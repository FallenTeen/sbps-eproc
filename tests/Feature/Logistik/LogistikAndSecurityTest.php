<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\RecordRitaseAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseTimbang;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Security\Models\BukuTamu;
use App\Domain\Security\Models\SecurityChecklistRun;
use App\Domain\Security\Models\SecurityLaporanDarurat;
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
    $this->armada = Armada::factory()->for($this->unit)->create([
        'tipe_unit' => 'armada_jalan',
        'plat_nomor' => 'B 7777 LOG',
        'tara_master_kg' => 8500,
    ]);

    // Rute dari Kantor Pusat (wajib jembatan timbang TD-E6)
    $this->rutePusat = RuteTarif::create([
        'unit_bisnis_id' => $this->unit->id,
        'lokasi_asal' => 'Kantor Pusat SBPS',
        'lokasi_tujuan' => 'Proyek Tol Cibitung',
        'jarak_km' => 25.5,
        'tarif_per_rit' => 150000,
        'berlaku_dari' => now()->subMonth(),
    ]);

    // Driver & Karyawan
    $this->driverUser = User::factory()->create(['is_active' => true]);
    $this->driverKaryawan = Karyawan::create([
        'user_id' => $this->driverUser->id,
        'nama' => 'Driver Logistik Test',
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);

    // Logistik User
    $this->logistikUser = User::factory()->create(['is_active' => true]);
    Role::findOrCreate('Logistik', 'web');
    $this->logistikUser->assignRole('Logistik');
    $this->logistikToken = $this->logistikUser->createToken('mobile-test')->plainTextToken;

    // Security User
    $this->securityUser = User::factory()->create(['is_active' => true]);
    Role::findOrCreate('Security', 'web');
    $this->securityUser->assignRole('Security');
    $this->securityToken = $this->securityUser->createToken('mobile-test')->plainTextToken;
});

// ── TD-E: Logistik & Timbang ─────────────────────────────────────────────────

test('ritase dari kantor pusat otomatis wajib_jembatan_timbang dan muncul di antrean logistik', function () {
    $ritase = app(RecordRitaseAction::class)->execute([
        'armada_id' => $this->armada->id,
        'driver_karyawan_id' => $this->driverKaryawan->id,
        'rute_tarif_id' => $this->rutePusat->id,
        'jumlah_rit' => 1,
        'satuan_volume' => 'tonase',
        'jumlah_volume' => 24.5,
        'material' => 'Batu Split 1-2',
    ]);

    expect($ritase->wajib_jembatan_timbang)->toBeTrue();
    expect($ritase->muatan)->not->toBeNull();
    expect($ritase->muatan->jumlah_driver)->toBe(24.5);

    $response = $this->withToken($this->logistikToken)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/logistik/ritase/antrean');

    $response->assertOk()
        ->assertJsonPath('status', 'success');

    $items = $response->json('data.items');
    expect(count($items))->toBeGreaterThanOrEqual(1);

    $found = collect($items)->firstWhere('id', $ritase->id);
    expect($found)->not->toBeNull();
    expect($found['wajib_jembatan_timbang'])->toBeTrue();
    expect($found['jumlah_driver'])->toBe(24.5);
    expect($found['status_verifikasi_logistik'])->toBe('menunggu');
});

test('logistik dapat melakukan verifikasi ritase, catat timbang, dan deteksi selisih', function () {
    $ritase = app(RecordRitaseAction::class)->execute([
        'armada_id' => $this->armada->id,
        'driver_karyawan_id' => $this->driverKaryawan->id,
        'rute_tarif_id' => $this->rutePusat->id,
        'jumlah_rit' => 1,
        'satuan_volume' => 'tonase',
        'jumlah_volume' => 25.0,
        'material' => 'Pasir Cor',
    ]);

    // Logistik timbang: berat isi 32500, kosong 8500 -> netto 24000 kg (24.0 ton)
    // Driver lapor 25.0 ton -> ada selisih 1.0 ton!
    $response = $this->withToken($this->logistikToken)
        ->withHeaders(mobileIdemHeaders())
        ->post("/api/mobile/logistik/ritase/{$ritase->id}/verifikasi", [
            'jumlah_verifikasi' => 24.0,
            'berat_kosong_kg' => 8500,
            'berat_isi_kg' => 32500,
            'berat_netto_kg' => 24000,
            'tara_sumber' => 'master',
            'nomor_tiket' => 'TIKET-999',
            'catatan' => 'Muatan basah',
            'checklist' => ['muatan_sesuai' => true, 'terpal_terpasang' => true],
            'foto_tiket' => UploadedFile::fake()->image('tiket.jpg'),
        ]);

    $response->assertOk()
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.ada_selisih', true);

    $ritase->refresh();
    expect($ritase->ada_selisih)->toBeTrue();
    expect($ritase->sumber_angka_resmi)->toBe('logistik');
    expect($ritase->jumlah_resmi)->toBe(24.0);

    // Timbang tersimpan
    $timbang = RitaseTimbang::where('ritase_id', $ritase->id)->first();
    expect($timbang)->not->toBeNull();
    expect($timbang->berat_netto_kg)->toBe(24000.0);
    expect($timbang->nomor_tiket)->toBe('TIKET-999');

    // Verifikasi tersimpan
    $verif = RitaseVerifikasi::where('ritase_id', $ritase->id)->where('tahap', 'logistik')->first();
    expect($verif)->not->toBeNull();
    expect($verif->status)->toBe('terverifikasi');
    expect($verif->jumlah_verifikasi)->toBe(24.0);
});

test('logistik dapat mengelola tara master armada', function () {
    // 1. Get tara master
    $resList = $this->withToken($this->logistikToken)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/logistik/tara-master');

    $resList->assertOk()
        ->assertJsonPath('status', 'success');

    // 2. Update tara master
    $resUpdate = $this->withToken($this->logistikToken)
        ->withHeaders(mobileAuthHeaders())
        ->put("/api/mobile/logistik/tara-master/{$this->armada->id}", [
            'tara_master_kg' => 9200.5,
        ]);

    $resUpdate->assertOk();
    expect((float) $this->armada->fresh()->tara_master_kg)->toBe(9200.5);
    expect($this->armada->fresh()->tara_diperbarui_pada)->not->toBeNull();
});

// ── TD-F: Security Modul ─────────────────────────────────────────────────────

test('security dapat mencatat buku tamu dan menandai keluar', function () {
    // 1. Catat tamu masuk
    $resMasuk = $this->withToken($this->securityToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/security/buku-tamu', [
            'nama' => 'Budi Santoso',
            'jumlah_orang' => 2,
            'asal' => 'PT Semen Padang',
            'nomor_telepon' => '08123456789',
            'kendaraan' => 'mobil',
            'plat_nomor' => 'B 1234 ABC',
            'catatan' => 'Meeting operasional',
            'foto' => UploadedFile::fake()->image('tamu.jpg'),
        ]);

    $resMasuk->assertCreated()
        ->assertJsonPath('status', 'success');

    $tamuId = $resMasuk->json('data.id');
    $tamu = BukuTamu::find($tamuId);
    expect($tamu)->not->toBeNull();
    expect($tamu->nama)->toBe('Budi Santoso');
    expect($tamu->waktu_masuk)->not->toBeNull();
    expect($tamu->waktu_keluar)->toBeNull();

    // 2. Get buku tamu hari ini
    $resHariIni = $this->withToken($this->securityToken)
        ->withHeaders(mobileAuthHeaders())
        ->get('/api/mobile/security/buku-tamu/hari-ini');

    $resHariIni->assertOk();
    expect(count($resHariIni->json('data.items')))->toBeGreaterThanOrEqual(1);

    // 3. Tandai keluar
    $resKeluar = $this->withToken($this->securityToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/security/buku-tamu/keluar', [
            'tamu_id' => $tamuId,
        ]);

    $resKeluar->assertOk();
    expect($tamu->fresh()->waktu_keluar)->not->toBeNull();
});

test('security dapat submit checklist kantor dan laporan darurat', function () {
    // 1. Checklist kantor
    $resChecklist = $this->withToken($this->securityToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/security/checklist', [
            'periode' => 'malam',
            'jam_pantau' => '22:00',
            'items' => [
                ['lokasi' => 'Pintu Gerbang Utama', 'kondisi' => 'terkunci', 'is_ok' => true],
                ['lokasi' => 'Lampu Halaman', 'kondisi' => 'menyala', 'is_ok' => true],
            ],
            'catatan' => 'Aman terkendali',
        ]);

    $resChecklist->assertCreated()
        ->assertJsonPath('status', 'success');

    expect(SecurityChecklistRun::where('periode', 'malam')->count())->toBe(1);

    // 2. Laporan darurat
    $resDarurat = $this->withToken($this->securityToken)
        ->withHeaders(mobileIdemHeaders())
        ->post('/api/mobile/security/darurat', [
            'kategori' => 'keamanan',
            'judul' => 'Pagar belakang roboh',
            'deskripsi' => 'Tertimpa pohon saat hujan deras',
            'lokasi_ruangan' => 'Area Belakang Workshop',
            'tingkat' => 'tinggi',
        ]);

    $resDarurat->assertCreated()
        ->assertJsonPath('status', 'success');

    expect(SecurityLaporanDarurat::where('kategori', 'keamanan')->count())->toBe(1);
});

test('security dapat verifikasi konfirmasi unit dan muatan pada antrean ritase', function () {
    $ritase = app(RecordRitaseAction::class)->execute([
        'armada_id' => $this->armada->id,
        'driver_karyawan_id' => $this->driverKaryawan->id,
        'rute_tarif_id' => $this->rutePusat->id,
        'jumlah_rit' => 1,
        'satuan_volume' => 'tonase',
        'jumlah_volume' => 20.0,
        'material' => 'Abu Batu',
    ]);

    // Verifikasi Security
    $response = $this->withToken($this->securityToken)
        ->withHeaders(mobileIdemHeaders())
        ->post("/api/mobile/security/ritase/{$ritase->id}/verifikasi", [
            'checklist' => ['unit_sesuai' => true, 'muatan_aman' => true],
            'catatan' => 'Plat nomor dan segel sesuai',
            'foto' => UploadedFile::fake()->image('security_truck.jpg'),
        ]);

    $response->assertOk()
        ->assertJsonPath('status', 'success');

    $verif = RitaseVerifikasi::where('ritase_id', $ritase->id)->where('tahap', 'security')->first();
    expect($verif)->not->toBeNull();
    expect($verif->status)->toBe('terverifikasi');
    expect($verif->checklist['unit_sesuai'])->toBeTrue();
});
