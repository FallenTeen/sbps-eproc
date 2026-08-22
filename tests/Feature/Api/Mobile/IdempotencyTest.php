<?php

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Attendance\Models\TrackingBatch;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\StokMutasi;
use App\Domain\Production\Models\QCSample;
use App\Domain\Shared\Models\Dokumen;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    [$this->user, $this->token] = createMobileUserWithToken('Mandor Titik');
    $this->karyawan = Karyawan::factory()->create(['user_id' => $this->user->id]);

    $this->proyek = Proyek::factory()->internal()->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);
    $this->produk = Produk::factory()->split()->create();
    $this->mesin = MesinProduksi::create([
        'unit_bisnis_id' => UnitBisnis::factory()->create()->id,
        'nama' => 'Mesin AMP Idem',
        'jenis' => 'mixer_aspal',
        'kapasitas' => 50,
        'status' => 'aktif',
        'titik_id' => $this->titik->id,
        'produk_id' => $this->produk->id,
        'biaya_per_jam' => 500000,
    ]);
});

function mulaiSesi($test, string $clientUuid)
{
    return $test->withToken($test->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/produksi/mulai', [
            'client_uuid' => $clientUuid,
            'mesin_id' => $test->mesin->id,
            'produk_id' => $test->produk->id,
            'titik_id' => $test->titik->id,
        ]);
}

// ─── Produksi: mulai ─────────────────────────────────────────────────────────

test('produksi mulai idempotent: client_uuid sama tidak membuat sesi dobel', function () {
    $uuid = (string) Str::uuid();

    $first = mulaiSesi($this, $uuid)->assertStatus(201);
    $second = mulaiSesi($this, $uuid);

    $second->assertStatus(200)
        ->assertJsonPath('data.id', $first->json('data.id'));

    expect(ProductionSession::count())->toBe(1);
});

test('produksi mulai menolak tanpa client_uuid', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/produksi/mulai', [
            'mesin_id' => $this->mesin->id,
            'produk_id' => $this->produk->id,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('client_uuid');
});

// ─── Produksi: selesai ───────────────────────────────────────────────────────

test('produksi selesai idempotent: client_uuid sama tidak menduplikasi mutasi stok', function () {
    $bahan = BahanBaku::factory()->bahanBaku()->create();
    $mulai = mulaiSesi($this, (string) Str::uuid())->assertStatus(201)->json('data');

    $body = [
        'client_uuid' => (string) Str::uuid(),
        'hasil_output' => 10,
        'items' => [
            ['bahan_baku_id' => $bahan->id, 'jumlah_terpakai' => 5],
        ],
    ];

    $first = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson("/api/mobile/produksi/selesai/{$mulai['id']}", $body)
        ->assertOk()
        ->assertJsonPath('data.status', 'selesai');

    // Retry persis sama (respons pertama hilang di jalan).
    $second = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson("/api/mobile/produksi/selesai/{$mulai['id']}", $body);

    $second->assertStatus(200)
        ->assertJsonPath('data.id', $mulai['id'])
        ->assertJsonPath('data.status', 'selesai');

    expect($second->json('data.selesai'))->toBe($first->json('data.selesai'));
    expect(StokMutasi::where('referensi_id', $mulai['id'])->count())->toBe(1);
});

test('produksi selesai menolak tanpa client_uuid', function () {
    $mulai = mulaiSesi($this, (string) Str::uuid())->assertStatus(201)->json('data');

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson("/api/mobile/produksi/selesai/{$mulai['id']}", [
            'hasil_output' => 10,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('client_uuid');
});

// ─── QC: slump test ──────────────────────────────────────────────────────────

test('slump test idempotent: client_uuid sama tidak membuat sample dobel', function () {
    $session = ProductionSession::create([
        'mesin_id' => $this->mesin->id,
        'titik_id' => $this->titik->id,
        'produk_id' => $this->produk->id,
        'operator_karyawan_id' => $this->karyawan->id,
        'mulai' => now(),
        'status' => 'berjalan',
    ]);

    $body = [
        'client_uuid' => (string) Str::uuid(),
        'production_session_id' => $session->id,
        'nilai_slump' => 12.5,
        'catatan' => 'Slump normal',
    ];

    $first = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/qc/slump-test', $body)
        ->assertStatus(201);

    $second = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/qc/slump-test', $body);

    $second->assertStatus(200)
        ->assertJsonPath('data.id', $first->json('data.id'));

    expect(QCSample::count())->toBe(1);
});

test('slump test menolak tanpa client_uuid', function () {
    $session = ProductionSession::create([
        'mesin_id' => $this->mesin->id,
        'titik_id' => $this->titik->id,
        'produk_id' => $this->produk->id,
        'operator_karyawan_id' => $this->karyawan->id,
        'mulai' => now(),
        'status' => 'berjalan',
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/qc/slump-test', [
            'production_session_id' => $session->id,
            'nilai_slump' => 10,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('client_uuid');
});

// ─── QC: uji tekan ───────────────────────────────────────────────────────────

test('uji tekan idempotent: retry client_uuid sama mengembalikan hasil sebelumnya tanpa error', function () {
    $session = ProductionSession::create([
        'mesin_id' => $this->mesin->id,
        'titik_id' => $this->titik->id,
        'produk_id' => $this->produk->id,
        'operator_karyawan_id' => $this->karyawan->id,
        'mulai' => now(),
        'status' => 'berjalan',
    ]);

    // Sample slump "menunggu hasil" sudah ada (dibuat via endpoint slump).
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/qc/slump-test', [
            'client_uuid' => (string) Str::uuid(),
            'production_session_id' => $session->id,
            'nilai_slump' => 12,
        ])
        ->assertStatus(201);

    $body = [
        'client_uuid' => (string) Str::uuid(),
        'production_session_id' => $session->id,
        'hasil_uji_tekan' => 25.5,
        'target_mpa' => 20,
    ];

    $first = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/qc/uji-tekan', $body)
        ->assertOk()
        ->assertJsonPath('data.status', 'lolos');

    // Retry setelah status sample bukan lagi "menunggu_hasil".
    $second = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/qc/uji-tekan', $body);

    $second->assertStatus(200)
        ->assertJsonPath('data.id', $first->json('data.id'))
        ->assertJsonPath('data.status', 'lolos')
        ->assertJsonPath('data.hasil_uji_tekan', 25.5);

    expect(QCSample::where('production_session_id', $session->id)->count())->toBe(1);
});

test('uji tekan menolak tanpa client_uuid', function () {
    $session = ProductionSession::create([
        'mesin_id' => $this->mesin->id,
        'titik_id' => $this->titik->id,
        'produk_id' => $this->produk->id,
        'operator_karyawan_id' => $this->karyawan->id,
        'mulai' => now(),
        'status' => 'berjalan',
    ]);

    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/qc/uji-tekan', [
            'production_session_id' => $session->id,
            'hasil_uji_tekan' => 25,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('client_uuid');
});

// ─── Upload ──────────────────────────────────────────────────────────────────

test('upload idempotent: client_uuid sama tidak membuat dokumen dobel', function () {
    $body = [
        'client_uuid' => (string) Str::uuid(),
        'file_type' => 'foto',
        'kategori' => 'dokumentasi',
        'catatan' => 'Bukti lapangan',
    ];

    $first = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/upload', array_merge($body, [
            'files' => [UploadedFile::fake()->image('bukti-1.jpg')],
        ]))
        ->assertStatus(201);

    // Kiriman ulang: file boleh beda, yang penting client_uuid sama.
    $second = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/upload', array_merge($body, [
            'files' => [UploadedFile::fake()->image('bukti-1-dup.jpg')],
        ]));

    $second->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $first->json('data.0.id'));

    expect(Dokumen::count())->toBe(1);
});

test('upload menolak tanpa client_uuid', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->post('/api/mobile/upload', [
            'files' => [UploadedFile::fake()->image('x.jpg')],
            'file_type' => 'foto',
        ])
        ->assertStatus(422);
});

// ─── Tracking batch ──────────────────────────────────────────────────────────

test('tracking batch idempotent: locations[] identik dengan batch_id sama tidak tersimpan dua kali', function () {
    config(['mobile.tracking.auto_cutoff' => '23:59']);

    Presensi::create([
        'karyawan_id' => $this->karyawan->id,
        'titik_id' => $this->titik->id,
        'check_in' => now()->subHour(),
        'status_validasi' => 'valid',
    ]);

    $locations = [
        ['lat' => -7.1, 'lng' => 110.2, 'timestamp' => now()->subMinutes(5)->toIso8601String()],
        ['lat' => -7.11, 'lng' => 110.21, 'timestamp' => now()->subMinutes(3)->toIso8601String()],
    ];

    $body = [
        'batch_id' => (string) Str::uuid(),
        'locations' => $locations,
    ];

    $first = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/tracking/batch', $body)
        ->assertOk()
        ->assertJsonPath('data.saved', 2);

    // Kirim PERSIS sama (isi locations[] identik, batch_id sama).
    $second = $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/tracking/batch', $body);

    $second->assertStatus(200)
        ->assertJsonPath('data.saved', 2)
        ->assertJsonPath('data.received', 2)
        ->assertJsonPath('data.duplicate', true)
        ->assertJsonPath('data.batch_id', $body['batch_id']);

    expect(MobileTrackingLocation::count())->toBe(2);
    expect(TrackingBatch::count())->toBe(1);
    expect($second->json('data.saved'))->toBe($first->json('data.saved'));
});

test('tracking batch menolak tanpa batch_id', function () {
    $this->withToken($this->token)
        ->withHeaders(mobileAuthHeaders())
        ->postJson('/api/mobile/tracking/batch', [
            'locations' => [
                ['lat' => -7.1, 'lng' => 110.2, 'timestamp' => now()->toIso8601String()],
            ],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('batch_id');
});
