<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDokumenBerkala;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Security\Models\BukuTamu;
use App\Domain\Security\Models\SecurityChecklistTemplate;
use App\Domain\Security\Models\SecurityLaporanDarurat;
use Database\Seeders\ArmadaDokumenBerkalaSeeder;
use Database\Seeders\LogistikDemoSeeder;
use Database\Seeders\SecurityDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('seeder dokumen armada bersifat idempotent dan menambah dokumen contoh', function () {
    $unit = UnitBisnis::factory()->gcs()->create();
    foreach (range(1, 5) as $index) {
        Armada::factory()->for($unit)->create([
            'kode_unit' => "GCS-SEED-{$index}",
            'plat_nomor' => "B 100{$index} SEED",
        ]);
    }

    $seeder = app(ArmadaDokumenBerkalaSeeder::class);
    $seeder->run();
    $seeder->run();

    expect(ArmadaDokumenBerkala::count())->toBe(5);
});

test('seeder Security bersifat idempotent dan mengisi template serta data contoh', function () {
    $seeder = app(SecurityDemoSeeder::class);
    $seeder->run();
    $seeder->run();

    expect(SecurityChecklistTemplate::count())->toBe(2)
        ->and(SecurityChecklistTemplate::withCount('items')->get()->sum('items_count'))->toBe(6)
        ->and(BukuTamu::count())->toBe(1)
        ->and(SecurityLaporanDarurat::count())->toBe(1);
});

test('seeder Logistik membuat satu ritase demo untuk verifikasi dan bersifat idempotent', function () {
    $unit = UnitBisnis::factory()->gcs()->create();
    $armada = Armada::factory()->for($unit)->create([
        'tipe_unit' => 'armada_jalan',
        'kode_unit' => 'GCS-LOG-SEED',
        'plat_nomor' => 'B 7000 LOG',
    ]);
    $karyawan = Karyawan::create([
        'nama' => 'Driver Seeder Logistik',
        'tipe' => 'borongan_rit',
        'jabatan' => 'Driver',
        'status' => 'aktif',
    ]);
    ArmadaDriver::create([
        'armada_id' => $armada->id,
        'karyawan_id' => $karyawan->id,
        'tipe' => 'standby',
        'tanggal_mulai' => now()->toDateString(),
        'status' => 'aktif',
    ]);

    $seeder = app(LogistikDemoSeeder::class);
    $seeder->run();
    $seeder->run();

    expect(Ritase::where('catatan', 'DATA DEMO LOGISTIK - verifikasi timbang')->count())->toBe(1);
});
