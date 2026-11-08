<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\RekapManual;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaDokumenBerkala;
use App\Domain\Fleet\Models\ArmadaDokumenBerkalaRiwayat;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Domain\Fleet\Models\ServisEksternalNota;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Inventory\Models\StokOpname;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\StokMutasi;
use App\Domain\Security\Models\BukuTamu;
use App\Domain\Security\Models\SecurityChecklistRun;
use App\Domain\Security\Models\SecurityChecklistRunItem;
use App\Domain\Security\Models\SecurityChecklistTemplate;
use App\Domain\Security\Models\SecurityLaporanDarurat;
use App\Models\User;
use Database\Seeders\ArmadaDokumenBerkalaSeeder;
use Database\Seeders\FinanceManualRekapDemoSeeder;
use Database\Seeders\InventoryDemoSeeder;
use Database\Seeders\LogistikDemoSeeder;
use Database\Seeders\SecurityDemoSeeder;
use Database\Seeders\ServisEksternalDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
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

    expect(ArmadaDokumenBerkala::count())->toBe(5)
        ->and(ArmadaDokumenBerkalaRiwayat::count())->toBe(5);
});

test('seeder Security bersifat idempotent dan mengisi template serta data contoh', function () {
    $seeder = app(SecurityDemoSeeder::class);
    $seeder->run();
    $seeder->run();

    expect(SecurityChecklistTemplate::count())->toBe(2)
        ->and(SecurityChecklistTemplate::withCount('items')->get()->sum('items_count'))->toBe(6)
        ->and(SecurityChecklistRun::count())->toBe(2)
        ->and(SecurityChecklistRunItem::count())->toBe(6)
        ->and(BukuTamu::count())->toBe(1)
        ->and(SecurityLaporanDarurat::count())->toBe(1);
});

test('seeder Logistik mengisi tahap antrean, verifikasi, timbang, dan penolakan secara idempotent', function () {
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

    expect(Ritase::where('catatan', 'like', 'DATA DEMO LOGISTIK%')->count())->toBe(4)
        ->and(RitaseVerifikasi::where('tahap', 'logistik')->count())->toBe(3)
        ->and(RitaseVerifikasi::where('tahap', 'security')->count())->toBe(3);
});

test('seeder servis eksternal membuat variasi status dan nota placeholder yang valid secara idempotent', function () {
    Storage::fake('public');
    $unit = UnitBisnis::factory()->gcs()->create();
    $armada = Armada::factory()->for($unit)->create([
        'kode_unit' => 'GCS-SRV-EKS-SEED',
        'plat_nomor' => 'B 8000 EKS',
        'tipe_unit' => 'armada_jalan',
    ]);
    $owner = User::factory()->create(['email' => 'owner@real.com']);

    $seeder = app(ServisEksternalDemoSeeder::class);
    $seeder->run();
    $seeder->run();

    $pengajuan = PengajuanServisArmada::where('tipe_servis', 'eksternal');
    expect($pengajuan->count())->toBe(3)
        ->and($pengajuan->where('armada_id', $armada->id)->count())->toBe(3)
        ->and(ServisEksternalNota::count())->toBe(2);

    foreach (ServisEksternalNota::all() as $nota) {
        expect(Storage::disk('public')->exists($nota->foto_nota))->toBeTrue();
    }
});

test('seeder stok opname demo menggunakan action domain dan idempotent', function () {
    $user = User::factory()->create(['email' => 'test.inventory@dummy.com']);
    $unit = UnitBisnis::factory()->gcs()->create();
    $proyek = Proyek::factory()->for($unit)->internal()->create(['created_by' => $user->id]);
    $titik = Titik::factory()->for($proyek)->create();
    $bahanBaku = BahanBaku::factory()->create();
    StokMutasi::create([
        'bahan_baku_id' => $bahanBaku->id,
        'titik_id' => $titik->id,
        'tipe' => 'masuk',
        'jumlah' => 100,
        'tanggal' => now()->subDays(2)->toDateString(),
        'created_by' => $user->id,
    ]);

    $seeder = app(InventoryDemoSeeder::class);
    $seeder->run();
    $seeder->run();

    expect(StokOpname::count())->toBe(1)
        ->and(StokOpname::first()->dicatat_oleh)->toBe($user->id)
        ->and(StokOpname::first()->saldo_sistem)->toBe(100.0)
        ->and(StokOpname::first()->catatan)->toContain('DATA DEMO');
});

test('seeder finance menambahkan contoh rekap manual sebagai mutasi kas tertaut dan idempotent', function () {
    $user = User::factory()->create(['email' => 'owner@real.com']);
    $unit = UnitBisnis::factory()->gcs()->create();
    $akun = AkunKasBank::factory()->for($unit)->create(['nama' => 'Kas Kecil GCS']);

    $seeder = app(FinanceManualRekapDemoSeeder::class);
    $seeder->run();
    $seeder->run();

    $mutasi = MutasiKasBank::where('catatan', 'DATA DEMO REKAP MANUAL - pengeluaran operasional.')->first();
    expect(RekapManual::count())->toBe(1)
        ->and(MutasiKasBank::where('catatan', 'DATA DEMO REKAP MANUAL - pengeluaran operasional.')->count())->toBe(1)
        ->and($mutasi->akun_kas_bank_id)->toBe($akun->id)
        ->and($mutasi->referensi_type)->toBe(RekapManual::class)
        ->and($mutasi->referensi_id)->toBe(RekapManual::first()->id)
        ->and($mutasi->created_by)->toBe($user->id);
});
