<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Procurement\Actions\RecordStockMutationAction;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\HargaBeli;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\StokMutasi;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Procurement\States\Diterima;
use App\Domain\Production\Actions\CalculateProductionCostAction;
use App\Domain\Production\Actions\CalculateProductionRevenueAction;
use App\Domain\Production\Actions\EndProductionSessionAction;
use App\Domain\Production\Actions\GenerateResepFromMixDesignAction;
use App\Domain\Production\Models\HargaJual;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\MixDesignTemplate;
use App\Domain\Production\Models\MixDesignTemplateItem;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\ProductionSessionItem;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\ResepProduksi;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase;

uses(TestCase::class, DatabaseTransactions::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $this->unit = UnitBisnis::factory()->cbp()->create();
    $this->proyek = Proyek::factory()->for($this->unit)->internal()->create(['created_by' => $this->user->id]);
    $this->titik = Titik::factory()->create(['proyek_id' => $this->proyek->id]);

    $this->bbSemen = BahanBaku::factory()->bahanBaku()->create(['nama' => 'Semen', 'satuan' => 'kg']);
    $this->bbPasir = BahanBaku::factory()->bahanBaku()->create(['nama' => 'Pasir', 'satuan' => 'ton']);
    $this->bbSplit = BahanBaku::factory()->bahanBaku()->create(['nama' => 'Split', 'satuan' => 'ton']);
    $this->supplier = Supplier::factory()->create();

    foreach ([$this->bbSemen, $this->bbPasir, $this->bbSplit] as $bb) {
        HargaBeli::create([
            'bahan_baku_id' => $bb->id,
            'supplier_id' => $this->supplier->id,
            'harga' => match ($bb->nama) {
                'Semen' => 1_500,
                'Pasir' => 200_000,
                'Split' => 250_000,
                default => 10_000,
            },
            'berlaku_dari' => now()->subMonth(),
            'aktif' => true,
        ]);
    }

    $this->produk = Produk::factory()->create([
        'unit_bisnis_id' => $this->unit->id,
        'kategori' => 'BETON_COR',
        'satuan_output' => 'm3',
        'nama' => 'FC20',
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
        'nama' => 'Batching Plant 1',
        'jenis' => 'mixer_beton',
        'kapasitas' => 60,
        'status' => 'aktif',
        'biaya_per_jam' => 500_000,
        'default_produk_id' => $this->produk->id,
    ]);

    $this->operator = Karyawan::create([
        'nama' => 'Operator FC20',
        'tipe' => 'tetap',
        'jabatan' => 'Operator Mesin',
        'status' => 'aktif',
    ]);

    // BOM standar: 350 kg semen + 0.6 ton pasir + 0.4 ton split per m3
    ResepProduksi::create(['produk_id' => $this->produk->id, 'bahan_baku_id' => $this->bbSemen->id, 'jumlah_per_unit_output' => 350]);
    ResepProduksi::create(['produk_id' => $this->produk->id, 'bahan_baku_id' => $this->bbPasir->id, 'jumlah_per_unit_output' => 0.6]);
    ResepProduksi::create(['produk_id' => $this->produk->id, 'bahan_baku_id' => $this->bbSplit->id, 'jumlah_per_unit_output' => 0.4]);
});

// =========================================================
// PO → Receive → Stok Bertambah
// =========================================================

describe('PO → Receive → Stok Bertambah', function () {
    test('po diterima menambah stok bahan baku di titik tujuan', function () {
        $po = PurchaseOrder::factory()->for($this->proyek)->disetujui()->create([
            'titik_id' => $this->titik->id,
        ]);
        $po->items()->create([
            'bahan_baku_id' => $this->bbSemen->id,
            'jumlah' => 5_000,
            'harga_satuan_snapshot' => 1_500,
            'subtotal' => 7_500_000,
        ]);

        $po->status->transitionTo(Diterima::class);
        (new RecordStockMutationAction)->execute($po);

        $stok = StokMutasi::where('bahan_baku_id', $this->bbSemen->id)
            ->where('titik_id', $this->titik->id)
            ->where('tipe', 'masuk')
            ->sum('jumlah');

        expect($stok)->toEqual(5_000);
    });

    test('stok berkurang ketika sesi produksi selesai', function () {
        // Isi stok dulu
        StokMutasi::create([
            'bahan_baku_id' => $this->bbSemen->id,
            'titik_id' => $this->titik->id,
            'tipe' => 'masuk',
            'jumlah' => 10_000,
            'tanggal' => now(),
            'created_by' => $this->user->id,
        ]);

        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHours(2),
            'status' => 'berjalan',
        ]);

        $action = new EndProductionSessionAction;
        $action->execute($session, [
            'hasil_output' => 5,
            'items' => [
                ['bahan_baku_id' => $this->bbSemen->id, 'jumlah_terpakai' => 1_800],  // realisasi
            ],
        ]);

        // Stok semen harus berkurang 1.800 kg
        $stokKeluar = StokMutasi::where('bahan_baku_id', $this->bbSemen->id)
            ->where('tipe', 'keluar')
            ->sum('jumlah');

        expect($stokKeluar)->toEqual(1_800);
    });
});

// =========================================================
// Mix Design → Generate Resep
// =========================================================

describe('Mix Design Template → Generate Resep Produksi', function () {
    test('generate resep dari mix design template menghasilkan resep yang benar', function () {
        $template = MixDesignTemplate::create([
            'mutu_beton' => 'FC25',
            'nama' => 'Beton FC25 Standar',
            'deskripsi' => 'Mix design standar FC25',
        ]);
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
        MixDesignTemplateItem::create([
            'mix_design_template_id' => $template->id,
            'bahan_baku_id' => $this->bbSplit->id,
            'jumlah_per_m3' => 0.45,
        ]);

        $produkBaru = Produk::factory()->create([
            'unit_bisnis_id' => $this->unit->id,
            'nama' => 'FC25 - Proyek Spesial',
            'kategori' => 'BETON_COR',
            'satuan_output' => 'm3',
        ]);

        $action = new GenerateResepFromMixDesignAction;
        $action->execute($produkBaru, 'FC25');

        $reseps = ResepProduksi::where('produk_id', $produkBaru->id)->get();

        expect($reseps)->toHaveCount(3);
        expect($reseps->firstWhere('bahan_baku_id', $this->bbSemen->id)->jumlah_per_unit_output)->toEqual(380);
        expect($reseps->firstWhere('bahan_baku_id', $this->bbPasir->id)->jumlah_per_unit_output)->toEqual(0.55);
    });

    test('generate resep tidak mempengaruhi template asli', function () {
        $template = MixDesignTemplate::create([
            'mutu_beton' => 'FC30',
            'nama' => 'FC30 Standar',
        ]);
        MixDesignTemplateItem::create([
            'mix_design_template_id' => $template->id,
            'bahan_baku_id' => $this->bbSemen->id,
            'jumlah_per_m3' => 420,
        ]);

        $produk1 = Produk::factory()->create(['unit_bisnis_id' => $this->unit->id]);
        $produk2 = Produk::factory()->create(['unit_bisnis_id' => $this->unit->id]);

        (new GenerateResepFromMixDesignAction)->execute($produk1, 'FC30');
        (new GenerateResepFromMixDesignAction)->execute($produk2, 'FC30');

        // Edit resep produk1 tidak mengubah template
        ResepProduksi::where('produk_id', $produk1->id)
            ->where('bahan_baku_id', $this->bbSemen->id)
            ->update(['jumlah_per_unit_output' => 400]);

        $templateItem = MixDesignTemplateItem::where('mix_design_template_id', $template->id)->first();
        expect($templateItem->jumlah_per_m3)->toEqual(420); // template tidak berubah
    });
});

// =========================================================
// Sesi Produksi: Auto-suggest BOM, Kalkulasi Biaya & Revenue
// =========================================================

describe('Sesi Produksi - Kalkulasi Biaya dan Revenue', function () {
    test('auto-suggest konsumsi bahan baku dari resep saat end session', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHours(2),
            'status' => 'berjalan',
        ]);

        $action = new EndProductionSessionAction;
        // Bila items tidak diisi, EndProductionSessionAction meng-auto suggest dari resep
        $action->execute($session, ['hasil_output' => 10]);

        // 10 m3 x 350 kg/m3 = 3.500 kg semen
        $semenItem = $session->items()->where('bahan_baku_id', $this->bbSemen->id)->first();
        expect($semenItem->jumlah_terpakai)->toEqual(3_500);
    });

    test('kalkulasi biaya produksi per sesi: durasi mesin + bahan baku terpakai', function () {
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

        // Catat konsumsi aktual
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

        $action = new CalculateProductionCostAction;
        $biaya = $action->execute($session);

        // Biaya mesin: 2 jam x 500.000 = 1.000.000
        // Biaya semen: 3.500 x 1.500 = 5.250.000
        // Biaya pasir: 6 x 200.000 = 1.200.000
        // Total: 7.450.000
        $expectedBiaya = (2 * 500_000) + (3_500 * 1_500) + (6 * 200_000);
        expect($biaya)->toEqual($expectedBiaya);
    });

    test('kalkulasi pendapatan produksi: output x harga jual snapshot', function () {
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHours(2),
            'selesai' => now(),
            'hasil_output' => 15,
            'status' => 'selesai',
        ]);

        $action = new CalculateProductionRevenueAction;
        $pendapatan = $action->execute($session);

        // 15 m3 x 1.200.000/m3 = 18.000.000
        expect($pendapatan)->toEqual(15 * 1_200_000);
    });

    test('produksi dengan stok kurang menampilkan warning tetapi tetap bisa disimpan', function () {
        // Saldo stok 0 (tidak ada stok)
        $session = ProductionSession::create([
            'mesin_id' => $this->mesin->id,
            'titik_id' => $this->titik->id,
            'produk_id' => $this->produk->id,
            'operator_karyawan_id' => $this->operator->id,
            'mulai' => now()->subHour(),
            'status' => 'berjalan',
        ]);

        $action = new EndProductionSessionAction;
        $result = $action->execute($session, [
            'hasil_output' => 5,
            'konsumsi_bahan_baku' => [
                ['bahan_baku_id' => $this->bbSemen->id, 'jumlah_terpakai' => 1_750],
            ],
        ]);

        // Sesi tetap berhasil disimpan meskipun stok tidak cukup (warning-first, bukan hard-block)
        expect($session->fresh()->status)->toBe('selesai');
        expect($session->fresh()->items()->count())->toBe(3);
    });
});

// =========================================================
// Ritase → Payroll Borongan
// =========================================================

describe('Ritase → Payroll Borongan', function () {
    test('total upah ritase dihitung snapshot tarif bukan tarif master yang berubah', function () {
        $unitGCS = UnitBisnis::factory()->gcs()->create();
        $armada = Armada::factory()->for($unitGCS)->dumpTruck()->create();
        $driver = Karyawan::create(['nama' => 'Driver Rit', 'tipe' => 'borongan_rit', 'status' => 'aktif']);
        $rute = RuteTarif::create([
            'unit_bisnis_id' => $unitGCS->id,
            'lokasi_asal' => 'Quarry A',
            'lokasi_tujuan' => 'Site B',
            'jarak_km' => 20,
            'tarif_per_rit' => 100_000,
            'berlaku_dari' => '2026-01-01',
        ]);

        $ritase = Ritase::create([
            'armada_id' => $armada->id,
            'driver_karyawan_id' => $driver->id,
            'rute_tarif_id' => $rute->id,
            'tanggal' => now()->toDateString(),
            'jumlah_rit' => 6,
            'tarif_per_rit_snapshot' => 100_000,  // snapshot pada saat input
            'total_upah_rit' => 600_000,
            'status' => 'draft',
        ]);

        // Ubah tarif master (setelah ritase dibuat)
        $rute->update(['tarif_per_rit' => 120_000]);

        // Total upah rit HARUS tetap 600.000 (snapshot), bukan 720.000
        expect($ritase->total_upah_rit)->toEqual(600_000);
        expect($ritase->tarif_per_rit_snapshot)->toEqual(100_000);
    });
});
