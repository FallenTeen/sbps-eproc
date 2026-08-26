<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\HargaBeli;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Production\Actions\CalculateProductionCostAction;
use App\Domain\Production\Actions\CalculateProductionRevenueAction;
use App\Domain\Production\Actions\CompleteDeliveryAction;
use App\Domain\Production\Actions\EndProductionSessionAction;
use App\Domain\Production\Actions\GenerateResepFromMixDesignAction;
use App\Domain\Production\Actions\RecordQCSampleAction;
use App\Domain\Production\Actions\RecordUjiTekanResultAction;
use App\Domain\Production\Actions\ScheduleDeliveryAction;
use App\Domain\Production\Actions\StartProductionSessionAction;
use App\Domain\Production\Models\HargaJual;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\MixDesignTemplate;
use App\Domain\Production\Models\MixDesignTemplateItem;
use App\Domain\Production\Models\Pengiriman;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\ProductionSessionItem;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\QCSample;
use App\Domain\Production\Models\ResepProduksi;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;
use Spatie\Permission\Models\Role;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    Role::findOrCreate('Owner');
    $this->user = User::factory()->create();
    $this->user->assignRole('Owner');
    $this->actingAs($this->user);

    $this->unit = UnitBisnis::factory()->cbp()->create();
    $this->proyek = Proyek::factory()->for($this->unit)->internal()->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);

    $this->bbSemen = BahanBaku::factory()->bahanBaku()->create(['nama' => 'Semen', 'satuan' => 'kg']);
    $this->bbPasir = BahanBaku::factory()->bahanBaku()->create(['nama' => 'Pasir', 'satuan' => 'ton']);
    $this->sup = Supplier::factory()->create();

    HargaBeli::create([
        'bahan_baku_id' => $this->bbSemen->id,
        'supplier_id' => $this->sup->id,
        'harga' => 1_500,
        'berlaku_dari' => now()->subMonth(),
        'aktif' => true,
    ]);
    HargaBeli::create([
        'bahan_baku_id' => $this->bbPasir->id,
        'supplier_id' => $this->sup->id,
        'harga' => 200_000,
        'berlaku_dari' => now()->subMonth(),
        'aktif' => true,
    ]);

    $this->produk = Produk::factory()->create([
        'unit_bisnis_id' => $this->unit->id,
        'nama' => 'FC20',
        'kategori' => 'BETON_COR',
        'satuan_output' => 'm3',
    ]);
    HargaJual::create([
        'produk_id' => $this->produk->id,
        'harga' => 1_200_000,
        'berlaku_dari' => now()->subMonth(),
        'aktif' => true,
    ]);

    $this->mesin = MesinProduksi::create([
        'unit_bisnis_id' => $this->unit->id,
        'titik_id' => $this->titik->id,
        'nama' => 'Batching Plant',
        'jenis' => 'mixer_beton',
        'kapasitas' => 60,
        'status' => 'aktif',
        'biaya_per_jam' => 500_000,
        'default_produk_id' => $this->produk->id,
    ]);

    $this->operator = Karyawan::create([
        'nama' => 'Operator Test',
        'tipe' => 'tetap',
        'jabatan' => 'Operator Mesin',
        'status' => 'aktif',
    ]);

    ResepProduksi::create([
        'produk_id' => $this->produk->id,
        'bahan_baku_id' => $this->bbSemen->id,
        'jumlah_per_unit_output' => 350,
    ]);
    ResepProduksi::create([
        'produk_id' => $this->produk->id,
        'bahan_baku_id' => $this->bbPasir->id,
        'jumlah_per_unit_output' => 0.6,
    ]);
});

// =========================================================
// Mix Design
// =========================================================

describe('Mix Design - Generate dan Kustomisasi Resep', function () {
    test('generate resep dari mix design template menyalin semua item', function () {
        $template = MixDesignTemplate::create(['mutu_beton' => 'FC20', 'nama' => 'FC20 Standar']);
        MixDesignTemplateItem::create([
            'mix_design_template_id' => $template->id,
            'bahan_baku_id' => $this->bbSemen->id,
            'jumlah_per_m3' => 380,
        ]);
        MixDesignTemplateItem::create([
            'mix_design_template_id' => $template->id,
            'bahan_baku_id' => $this->bbPasir->id,
            'jumlah_per_m3' => 0.55,
        ]);

        $produkBaru = Produk::factory()->create([
            'unit_bisnis_id' => $this->unit->id,
            'nama' => 'FC20 Proyek Khusus',
        ]);

        (new GenerateResepFromMixDesignAction)->execute($produkBaru, 'FC20');

        $reseps = ResepProduksi::where('produk_id', $produkBaru->id)->get();
        expect($reseps)->toHaveCount(2);
        $resepSemen = $reseps->firstWhere('bahan_baku_id', $this->bbSemen->id);
        expect($resepSemen->jumlah_per_unit_output)->toEqual(380);
    });

    test('kustomisasi resep tidak mengubah template mix design asli', function () {
        $template = MixDesignTemplate::create(['mutu_beton' => 'FC30', 'nama' => 'FC30 Standar']);
        MixDesignTemplateItem::create([
            'mix_design_template_id' => $template->id,
            'bahan_baku_id' => $this->bbSemen->id,
            'jumlah_per_m3' => 420,
        ]);

        $produk = Produk::factory()->create(['unit_bisnis_id' => $this->unit->id]);
        (new GenerateResepFromMixDesignAction)->execute($produk, 'FC30');

        // Edit resep produk (kustomisasi)
        ResepProduksi::where('produk_id', $produk->id)->update(['jumlah_per_unit_output' => 400]);

        // Template tidak terpengaruh
        $templateItem = MixDesignTemplateItem::where('mix_design_template_id', $template->id)->first();
        expect($templateItem->jumlah_per_m3)->toEqual(420);
    });
});

// =========================================================
// Sesi Produksi - Alur Mulai sampai Selesai
// =========================================================

describe('Sesi Produksi - Alur Mulai sampai Selesai', function () {
    test('start sesi produksi mengubah status menjadi berjalan', function () {
        $action = new StartProductionSessionAction;
        $session = $action->execute([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'catatan' => 'Mulai produksi pagi',
        ]);

        expect($session->status)->toBe('berjalan');
        expect($session->mulai)->not->toBeNull();
        expect($session->selesai)->toBeNull();
    });

    test('end sesi produksi menyimpan hasil output dan konsumsi bahan baku', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHours(3),
            'status' => 'berjalan',
        ]);

        $action = new EndProductionSessionAction;
        $action->execute($session, [
            'hasil_output' => 12,
            'items' => [
                ['bahan_baku_id' => $this->bbSemen->id, 'jumlah_terpakai' => 4_200],
                ['bahan_baku_id' => $this->bbPasir->id, 'jumlah_terpakai' => 7.0],
            ],
        ]);

        $session->refresh();
        expect($session->status)->toBe('selesai');
        expect($session->hasil_output)->toEqual(12);
        expect($session->items)->toHaveCount(2);
    });

    test('biaya produksi dihitung dari durasi mesin dan bahan baku terpakai', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHours(2),
            'selesai' => now(),
            'hasil_output' => 10,
            'status' => 'selesai',
        ]);
        ProductionSessionItem::create([
            'production_session_id' => $session->id,
            'bahan_baku_id' => $this->bbSemen->id,
            'jumlah_terpakai' => 3_500,
        ]);
        ProductionSessionItem::create([
            'production_session_id' => $session->id,
            'bahan_baku_id' => $this->bbPasir->id,
            'jumlah_terpakai' => 6.0,
        ]);

        $biaya = (new CalculateProductionCostAction)->execute($session);

        // (2 jam x 500.000) + (3.500 x 1.500) + (6 x 200.000)
        expect($biaya)->toEqual((2 * 500_000) + (3_500 * 1_500) + (6 * 200_000));
    });

    test('pendapatan produksi = hasil output x harga jual snapshot', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHours(2),
            'selesai' => now(),
            'hasil_output' => 20,
            'status' => 'selesai',
        ]);

        $pendapatan = (new CalculateProductionRevenueAction)->execute($session);

        // 20 m3 x 1.200.000 = 24.000.000
        expect($pendapatan)->toEqual(20 * 1_200_000);
    });

    test('margin produksi = pendapatan - biaya', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHours(2),
            'selesai' => now(),
            'hasil_output' => 10,
            'status' => 'selesai',
        ]);
        ProductionSessionItem::create([
            'production_session_id' => $session->id,
            'bahan_baku_id' => $this->bbSemen->id,
            'jumlah_terpakai' => 3_500,
        ]);

        $pendapatan = (new CalculateProductionRevenueAction)->execute($session);
        $biaya = (new CalculateProductionCostAction)->execute($session);
        $margin = $pendapatan - $biaya;

        expect($margin)->toBeGreaterThan(0);
        expect($pendapatan)->toBeGreaterThan($biaya);
    });
});

// =========================================================
// QC Samples
// =========================================================

describe('QC Sample - Slump Test dan Uji Tekan', function () {
    test('record qc sample slump test menyimpan nilai slump', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHour(),
            'selesai' => now(),
            'hasil_output' => 8,
            'status' => 'selesai',
        ]);

        $action = new RecordQCSampleAction;
        $qc = $action->execute([
            'production_session_id' => $session->id,
            'jenis_uji' => 'slump_test',
            'nilai_slump' => 12,
            'catatan' => 'Slump normal',
        ]);

        expect($qc)->not->toBeNull();
        expect($qc->jenis_uji)->toBe('slump_test');
        expect($qc->nilai_slump)->toEqual(12);
        expect($qc->status)->toBe('menunggu_hasil');
    });

    test('record qc sample uji tekan menyetel tanggal uji tekan rencana +28 hari', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHour(),
            'selesai' => now(),
            'hasil_output' => 5,
            'status' => 'selesai',
        ]);

        $action = new RecordQCSampleAction;
        $qc = $action->execute([
            'production_session_id' => $session->id,
            'jenis_uji' => 'uji_tekan',
            'catatan' => 'Sample beton proyek A',
        ]);

        $expectedDate = now()->addDays(28)->toDateString();
        expect($qc->tanggal_uji_tekan_rencana->toDateString())->toBe($expectedDate);
        expect($qc->status)->toBe('menunggu_hasil');
    });

    test('record hasil uji tekan mengubah status qc menjadi lolos atau tidak lolos', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subMonth()->subHour(),
            'selesai' => now()->subMonth(),
            'hasil_output' => 6,
            'status' => 'selesai',
        ]);
        $qc = QCSample::create([
            'production_session_id' => $session->id,
            'jenis_uji' => 'uji_tekan',
            'tanggal_uji_tekan_rencana' => now()->subDays(1),
            'status' => 'menunggu_hasil',
        ]);

        $action = new RecordUjiTekanResultAction;

        // Lolos: hasil (25.5) >= target (20.0)
        $action->execute($qc, 25.5, 'Hasil OK', 20.0);
        expect($qc->fresh()->status)->toBe('lolos');
        expect($qc->fresh()->hasil_uji_tekan)->toEqual(25.5);
    });

    test('uji tekan tidak lolos mengubah status menjadi tidak lolos', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subMonth()->subHour(),
            'selesai' => now()->subMonth(),
            'hasil_output' => 4,
            'status' => 'selesai',
        ]);
        $qc = QCSample::create([
            'production_session_id' => $session->id,
            'jenis_uji' => 'uji_tekan',
            'tanggal_uji_tekan_rencana' => now()->subDays(1),
            'kuat_tekan_target' => 25.0,
            'status' => 'menunggu_hasil',
        ]);

        (new RecordUjiTekanResultAction)->execute($qc, 18.0, 'Tidak memenuhi target', 25.0);

        expect($qc->fresh()->status)->toBe('tidak_lolos');
    });
});

// =========================================================
// Pengiriman Beton
// =========================================================

describe('Pengiriman Beton - Jadwal dan Validasi Waktu Tuang', function () {
    test('jadwalkan pengiriman beton dengan truck molen', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHour(),
            'selesai' => now(),
            'hasil_output' => 8,
            'status' => 'selesai',
        ]);

        $unitGCS = UnitBisnis::factory()->gcs()->create();
        $molen = Armada::factory()->for($unitGCS)->truckMolen()->create();
        $driver = Karyawan::create(['nama' => 'Driver Molen', 'tipe' => 'tetap', 'status' => 'aktif']);

        $action = new ScheduleDeliveryAction;
        $pengiriman = $action->execute([
            'production_session_id' => $session->id,
            'armada_id' => $molen->id,
            'driver_karyawan_id' => $driver->id,
            'tujuan_alamat' => 'Jl. Site Proyek No. 1',
            'waktu_muat' => now()->addMinutes(30),
        ]);

        expect($pengiriman)->not->toBeNull();
        expect($pengiriman->status)->toBe('dijadwalkan');
        expect($pengiriman->armada_id)->toBe($molen->id);
    });

    test('pengiriman selesai tuang dalam batas 120 menit tidak ada warning', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHours(3),
            'selesai' => now()->subHours(2),
            'hasil_output' => 6,
            'status' => 'selesai',
        ]);
        $molen = Armada::factory()->for(UnitBisnis::factory()->gcs()->create())->truckMolen()->create();
        $driver = Karyawan::create(['nama' => 'Driver 2', 'tipe' => 'tetap', 'status' => 'aktif']);

        $pengiriman = Pengiriman::create([
            'production_session_id' => $session->id,
            'armada_id' => $molen->id,
            'driver_karyawan_id' => $driver->id,
            'tujuan_alamat' => 'Lokasi A',
            'waktu_muat' => now()->subHours(2),
            'status' => 'dalam_perjalanan',
        ]);

        $action = new CompleteDeliveryAction;
        $result = $action->execute($pengiriman, [
            'waktu_tiba_tujuan' => now()->subHours(1)->subMinutes(30),
            'waktu_selesai_tuang' => now()->subHours(1), // 60 menit dari muat
        ]);

        expect($result['status'])->toBe('selesai');
        expect($result)->not->toHaveKey('warning_waktu_tuang');
    });

    test('pengiriman melebihi 120 menit menampilkan warning waktu tuang', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHours(5),
            'selesai' => now()->subHours(4),
            'hasil_output' => 4,
            'status' => 'selesai',
        ]);
        $molen = Armada::factory()->for(UnitBisnis::factory()->gcs()->create())->truckMolen()->create();
        $driver = Karyawan::create(['nama' => 'Driver 3', 'tipe' => 'tetap', 'status' => 'aktif']);

        $pengiriman = Pengiriman::create([
            'production_session_id' => $session->id,
            'armada_id' => $molen->id,
            'driver_karyawan_id' => $driver->id,
            'tujuan_alamat' => 'Lokasi Jauh',
            'waktu_muat' => now()->subHours(3),
            'status' => 'dalam_perjalanan',
        ]);

        $action = new CompleteDeliveryAction;
        $pengiriman = $action->execute($pengiriman, [
            'waktu_tiba_tujuan' => now()->subHours(1),
            'waktu_selesai_tuang' => now(), // 180 menit dari muat, melebihi 120 menit
        ]);

        // Tetap berhasil disimpan (warning-first, bukan hard block)
        expect($pengiriman->status)->toBe('selesai');
        expect($pengiriman->catatan)->toContain('Waktu tuang melebihi');
    });
});
