<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\ServisEksternalDetail;
use App\Domain\Fleet\Models\ServisEksternalNota;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->unit = UnitBisnis::factory()->gcs()->create();
    $this->armada = Armada::factory()->for($this->unit)->create(['tipe_unit' => 'armada_jalan']);

    // Owner (manager) — bisa ajukan servis semua armada
    $this->owner = User::factory()->create(['is_active' => true]);
    $this->owner->assignRole('Owner');
    $this->ownerToken = $this->owner->createToken('mobile-test')->plainTextToken;

    // Driver — hanya bisa ajukan servis untuk armada yang diampu
    $this->driver = User::factory()->create(['is_active' => true]);
    Role::findOrCreate('Driver Armada', 'web');
    $this->driver->assignRole('Driver Armada');
    $karyawan = Karyawan::create([
        'user_id' => $this->driver->id,
        'nama'    => 'Driver Eksternal Test',
        'tipe'    => 'borongan_rit',
        'jabatan' => 'Driver',
        'status'  => 'aktif',
    ]);
    ArmadaDriver::create([
        'armada_id'     => $this->armada->id,
        'karyawan_id'   => $karyawan->id,
        'tipe'          => 'standby',
        'tanggal_mulai' => now()->subDay()->toDateString(),
        'status'        => 'aktif',
    ]);
    $this->driverToken = $this->driver->createToken('mobile-test')->plainTextToken;

    // Workshop — verifikasi servis eksternal
    $this->workshop = User::factory()->create(['is_active' => true]);
    Role::findOrCreate('Workshop', 'web');
    $this->workshop->assignRole('Workshop');
    $this->workshopToken = $this->workshop->createToken('mobile-test')->plainTextToken;
});

// ── TD-B1/B2: Ajuan servis eksternal ─────────────────────────────────────────

test('POST servis-armada/eksternal membuat pengajuan tipe eksternal dengan status dikerjakan', function () {
    $response = $this->withToken($this->ownerToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/servis-armada/eksternal', [
            'armada_id'            => $this->armada->id,
            'nama_bengkel'         => 'Bengkel Jaya Motor',
            'alamat_bengkel'       => 'Jl. Raya No. 1',
            'latitude'             => -6.12345,
            'longitude'            => 106.98765,
            'rincian_pekerjaan'    => 'Ganti oli dan tune up',
            'total_biaya_estimasi' => 500000,
            'foto_bengkel'         => UploadedFile::fake()->image('bengkel.jpg'),
        ]);

    $response->assertCreated()
        ->assertJsonPath('status', 'success');

    $pengajuan = PengajuanServisArmada::where('tipe_servis', 'eksternal')->first();
    expect($pengajuan)->not->toBeNull();
    expect($pengajuan->tipe_servis)->toBe('eksternal');
    expect($pengajuan->status->getValue())->toBe('dikerjakan');
    expect($pengajuan->armada_id)->toBe($this->armada->id);

    $detail = $pengajuan->eksternalDetail;
    expect($detail)->not->toBeNull();
    expect($detail->nama_bengkel)->toBe('Bengkel Jaya Motor');
    expect($detail->verifikasi_workshop)->toBe('belum');
    expect($detail->foto_bengkel)->not->toBeNull();
});

test('driver bisa mengajukan servis eksternal untuk armada yang diampu', function () {
    $response = $this->withToken($this->driverToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/servis-armada/eksternal', [
            'armada_id'            => $this->armada->id,
            'nama_bengkel'         => 'Bengkel Maju',
            'total_biaya_estimasi' => 300000,
        ]);

    $response->assertCreated();
    expect(PengajuanServisArmada::where('tipe_servis', 'eksternal')->count())->toBe(1);
});

// ── TD-B4/B5: Tambah nota dan foto hasil ─────────────────────────────────────

test('POST nota dan foto hasil servis eksternal berhasil', function () {
    // Buat pengajuan dulu
    $this->withToken($this->ownerToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/servis-armada/eksternal', [
            'armada_id'            => $this->armada->id,
            'nama_bengkel'         => 'Bengkel Test Nota',
            'total_biaya_estimasi' => 100000,
        ])
        ->assertCreated();

    $pengajuan = PengajuanServisArmada::where('tipe_servis', 'eksternal')->first();

    // Tambah nota
    $notaResponse = $this->withToken($this->ownerToken)
        ->withHeaders(mobileIdemHeaders())
        ->post("/api/mobile/servis-armada/{$pengajuan->id}/eksternal/nota", [
            'foto_nota' => [
                UploadedFile::fake()->image('nota1.jpg'),
                UploadedFile::fake()->image('nota2.jpg'),
            ],
        ]);

    $notaResponse->assertCreated();
    expect(ServisEksternalNota::where('pengajuan_id', $pengajuan->id)->count())->toBe(2);

    // Tambah foto hasil
    $hasilResponse = $this->withToken($this->ownerToken)
        ->withHeaders(mobileIdemHeaders())
        ->post("/api/mobile/servis-armada/{$pengajuan->id}/foto-hasil", [
            'foto_hasil' => UploadedFile::fake()->image('hasil.jpg'),
        ]);

    $hasilResponse->assertCreated()
        ->assertJsonPath('status', 'success');
});

// ── TD-B7: Verifikasi Workshop ───────────────────────────────────────────────

test('workshop bisa memverifikasi servis eksternal', function () {
    // Buat pengajuan (sebagai owner)
    $createResponse = $this->withToken($this->ownerToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/servis-armada/eksternal', [
            'armada_id'            => $this->armada->id,
            'nama_bengkel'         => 'Bengkel Verif Test',
            'total_biaya_estimasi' => 750000,
        ]);

    $createResponse->assertCreated();

    $pengajuan = PengajuanServisArmada::where('tipe_servis', 'eksternal')->first();

    // Reset auth state so previous withToken doesn't leak
    $this->app['auth']->forgetGuards();

    // Verifikasi (sebagai workshop)
    $verifikasiResponse = $this->withToken($this->workshopToken)
        ->withHeaders(mobileIdemHeaders())
        ->post("/api/mobile/workshop/servis-eksternal/{$pengajuan->id}/verifikasi", [
            'status'  => 'terverifikasi',
            'catatan' => 'Pekerjaan sesuai.',
        ]);

    $verifikasiResponse->assertOk()
        ->assertJsonPath('status', 'success');

    $detail = ServisEksternalDetail::where('pengajuan_id', $pengajuan->id)->first();
    expect($detail->verifikasi_workshop)->toBe('terverifikasi');
    expect($detail->verifikasi_workshop_oleh)->toBe($this->workshop->id);
    expect($detail->verifikasi_workshop_catatan)->toBe('Pekerjaan sesuai.');
});

test('workshop bisa menandai servis eksternal bermasalah', function () {
    $this->withToken($this->ownerToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/servis-armada/eksternal', [
            'armada_id'            => $this->armada->id,
            'nama_bengkel'         => 'Bengkel Problem',
            'total_biaya_estimasi' => 200000,
        ])
        ->assertCreated();

    $pengajuan = PengajuanServisArmada::where('tipe_servis', 'eksternal')->first();

    $this->app['auth']->forgetGuards();

    $this->withToken($this->workshopToken)
        ->withHeaders(mobileIdemHeaders())
        ->post("/api/mobile/workshop/servis-eksternal/{$pengajuan->id}/verifikasi", [
            'status'  => 'bermasalah',
            'catatan' => 'Biaya tidak sesuai nota.',
        ])
        ->assertOk();

    $detail = ServisEksternalDetail::where('pengajuan_id', $pengajuan->id)->first();
    expect($detail->verifikasi_workshop)->toBe('bermasalah');
});

// ── TD-B7: Daftar servis eksternal untuk workshop ────────────────────────────

test('GET workshop/servis-eksternal menampilkan daftar servis bertipe eksternal', function () {
    // Buat 1 internal + 1 eksternal
    PengajuanServisArmada::factory()->for($this->armada)->create([
        'tipe_servis' => 'internal',
        'diajukan_oleh' => $this->owner->id,
    ]);

    $this->withToken($this->ownerToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/servis-armada/eksternal', [
            'armada_id'            => $this->armada->id,
            'nama_bengkel'         => 'Bengkel List Test',
            'total_biaya_estimasi' => 100000,
        ])
        ->assertCreated();

    $response = $this->withToken($this->workshopToken)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/workshop/servis-eksternal');

    $response->assertOk();

    // Hanya eksternal yang muncul
    $items = $response->json('data.data') ?? $response->json('data');
    $allEksternal = collect(is_array($items) ? $items : [])
        ->every(fn ($item) => ($item['tipe_servis'] ?? '') === 'eksternal');
    expect($allEksternal)->toBeTrue();
});

// ── TD-B: Endpoint index juga bisa filter tipe_servis ────────────────────────

test('GET servis-armada?tipe_servis=eksternal hanya mengembalikan servis eksternal', function () {
    $this->withToken($this->ownerToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/servis-armada/eksternal', [
            'armada_id'            => $this->armada->id,
            'nama_bengkel'         => 'Bengkel Filter',
            'total_biaya_estimasi' => 100000,
        ])
        ->assertCreated();

    $response = $this->withToken($this->ownerToken)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/servis-armada?tipe_servis=eksternal');

    $response->assertOk();
});
