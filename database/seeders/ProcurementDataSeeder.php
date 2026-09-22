<?php

namespace Database\Seeders;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\HargaBeli;
use App\Domain\Procurement\Models\Pembayaran;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\PurchaseOrderApproval;
use App\Domain\Procurement\Models\PurchaseOrderItem;
use App\Domain\Procurement\Models\StokMutasi;
use App\Domain\Procurement\Models\Supplier;
use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class ProcurementDataSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $owner = User::where('email', 'owner@real.com')->firstOrFail();
        $gcsUser = User::where('email', 'gcs@real.com')->firstOrFail();
        $ketuaArmada = User::where('email', 'ketua.armada@real.com')->firstOrFail();

        $proyek1 = Proyek::where('kode_proyek', 'PRJ-GCS-001')->firstOrFail();
        $proyek2 = Proyek::where('kode_proyek', 'PRJ-GCS-002')->firstOrFail();
        $proyek3 = Proyek::where('kode_proyek', 'PRJ-CBP-001')->firstOrFail();

        $titikBlokA = Titik::where('nama', 'Lahan Blok A')->firstOrFail();
        $titikPlantCbp = Titik::where('nama', 'Plant CBP')->firstOrFail();

        $semen = BahanBaku::where('kode', 'BB-001')->firstOrFail();
        $pasir = BahanBaku::where('kode', 'BB-002')->firstOrFail();
        $split = BahanBaku::where('kode', 'BB-003')->firstOrFail();
        $oli = BahanBaku::where('kode', 'SP-001')->firstOrFail();
        $filter = BahanBaku::where('kode', 'SP-002')->firstOrFail();

        $supplier1 = Supplier::where('kode', 'SUP-001')->firstOrFail();
        $supplier2 = Supplier::where('kode', 'SUP-002')->firstOrFail();

        $aspal = BahanBaku::where('kode', 'BB-005')->firstOrFail();
        $filler = BahanBaku::where('kode', 'BB-006')->firstOrFail();
        $aditif = BahanBaku::where('kode', 'BB-007')->firstOrFail();
        $ban = BahanBaku::where('kode', 'SP-003')->firstOrFail();
        $kampas = BahanBaku::where('kode', 'SP-004')->firstOrFail();
        $screw = BahanBaku::where('kode', 'SP-005')->firstOrFail();

        $supplier3 = Supplier::where('kode', 'SUP-003')->firstOrFail();
        $supplier4 = Supplier::where('kode', 'SUP-004')->firstOrFail();
        $supplier5 = Supplier::where('kode', 'SUP-005')->firstOrFail();

        // ───────────────────────── HARGA BELI ─────────────────────────
        $harga = [
            [$semen->id, $supplier1->id, 1_200],
            [$pasir->id, $supplier1->id, 200],
            [$split->id, $supplier1->id, 350],
            [$oli->id, $supplier2->id, 45_000],
            [$filter->id, $supplier2->id, 150_000],
            [$aspal->id, $supplier3->id, 12_500],
            [$filler->id, $supplier5->id, 400],
            [$aditif->id, $supplier4->id, 25_000],
            [$ban->id, $supplier4->id, 3_200_000],
            [$kampas->id, $supplier2->id, 450_000],
            [$screw->id, $supplier2->id, 85_000_000],
        ];

        foreach ($harga as [$bahanBakuId, $supplierId, $hargaSatuan]) {
            HargaBeli::create([
                'bahan_baku_id' => $bahanBakuId,
                'supplier_id' => $supplierId,
                'harga' => $hargaSatuan,
                'berlaku_dari' => now()->subMonths(6)->toDateString(),
                'berlaku_sampai' => null,
            ]);
        }

        // ──────────────────────── PURCHASE ORDER ────────────────────────
        // PO-1: draft
        $po1 = PurchaseOrder::updateOrCreate(
            ['kode_po' => 'PO-2026-0001'],
            [
                'proyek_id' => $proyek1->id,
                'titik_id' => $titikBlokA->id,
                'supplier_id' => $supplier1->id,
                'created_by' => $owner->id,
                'tanggal_pesan' => now()->subDays(5)->toDateString(),
                'tanggal_diperlukan' => now()->addDays(10)->toDateString(),
                'total' => 8_000_000,
                'status' => 'draft',
                'catatan' => 'Persediaan material urugan.',
            ]
        );
        PurchaseOrderItem::create(['purchase_order_id' => $po1->id, 'bahan_baku_id' => $semen->id, 'jumlah' => 5_000, 'harga_satuan_snapshot' => 1_200, 'subtotal' => 6_000_000]);
        PurchaseOrderItem::create(['purchase_order_id' => $po1->id, 'bahan_baku_id' => $pasir->id, 'jumlah' => 10_000, 'harga_satuan_snapshot' => 200, 'subtotal' => 2_000_000]);

        // PO-2: diterima
        $po2 = PurchaseOrder::updateOrCreate(
            ['kode_po' => 'PO-2026-0002'],
            [
                'proyek_id' => $proyek1->id,
                'titik_id' => $titikBlokA->id,
                'supplier_id' => $supplier2->id,
                'created_by' => $owner->id,
                'tanggal_pesan' => now()->subDays(10)->toDateString(),
                'tanggal_diperlukan' => now()->subDays(2)->toDateString(),
                'total' => 6_000_000,
                'status' => 'diterima',
                'catatan' => 'Sparepart armada, sudah diterima gudang.',
            ]
        );
        PurchaseOrderItem::create(['purchase_order_id' => $po2->id, 'bahan_baku_id' => $oli->id, 'jumlah' => 100, 'harga_satuan_snapshot' => 45_000, 'subtotal' => 4_500_000]);
        PurchaseOrderItem::create(['purchase_order_id' => $po2->id, 'bahan_baku_id' => $filter->id, 'jumlah' => 10, 'harga_satuan_snapshot' => 150_000, 'subtotal' => 1_500_000]);

        PurchaseOrderApproval::create(['purchase_order_id' => $po2->id, 'approved_by' => $ketuaArmada->id, 'status' => 'disetujui', 'catatan' => 'Sparepart sesuai kebutuhan armada.']);
        PurchaseOrderApproval::create(['purchase_order_id' => $po2->id, 'approved_by' => $owner->id, 'status' => 'disetujui', 'catatan' => null]);

        // PO-3: lunas
        $po3 = PurchaseOrder::updateOrCreate(
            ['kode_po' => 'PO-2026-0003'],
            [
                'proyek_id' => $proyek3->id,
                'titik_id' => $titikPlantCbp->id,
                'supplier_id' => $supplier1->id,
                'created_by' => $owner->id,
                'tanggal_pesan' => now()->subDays(20)->toDateString(),
                'tanggal_diperlukan' => now()->subDays(10)->toDateString(),
                'total' => 31_000_000,
                'status' => 'lunas',
                'catatan' => 'Material beton untuk produksi K-225.',
            ]
        );
        PurchaseOrderItem::create(['purchase_order_id' => $po3->id, 'bahan_baku_id' => $semen->id, 'jumlah' => 20_000, 'harga_satuan_snapshot' => 1_200, 'subtotal' => 24_000_000]);
        PurchaseOrderItem::create(['purchase_order_id' => $po3->id, 'bahan_baku_id' => $split->id, 'jumlah' => 20_000, 'harga_satuan_snapshot' => 350, 'subtotal' => 7_000_000]);

        PurchaseOrderApproval::create(['purchase_order_id' => $po3->id, 'approved_by' => $owner->id, 'status' => 'disetujui', 'catatan' => 'Disetujui owner.']);

        $akunMandiriCbp = AkunKasBank::where('nama', 'Bank Mandiri CBP')->firstOrFail();
        Pembayaran::create([
            'purchase_order_id' => $po3->id,
            'jumlah' => 31_000_000,
            'tanggal' => now()->subDays(18)->toDateString(),
            'metode' => 'transfer',
            'akun_kas_bank_id' => $akunMandiriCbp->id,
            'dicatat_oleh' => $owner->id,
            'catatan' => 'Pelunasan PO-2026-0003.',
        ]);

        // PO-4: disetujui
        $po4 = PurchaseOrder::updateOrCreate(
            ['kode_po' => 'PO-2026-0004'],
            [
                'proyek_id' => $proyek2->id,
                'titik_id' => null,
                'supplier_id' => $supplier2->id,
                'created_by' => $gcsUser->id,
                'tanggal_pesan' => now()->subDays(3)->toDateString(),
                'tanggal_diperlukan' => now()->addDays(7)->toDateString(),
                'total' => 750_000,
                'status' => 'disetujui',
                'catatan' => 'Pengadaan filter udara cadangan.',
            ]
        );
        PurchaseOrderItem::create(['purchase_order_id' => $po4->id, 'bahan_baku_id' => $filter->id, 'jumlah' => 5, 'harga_satuan_snapshot' => 150_000, 'subtotal' => 750_000]);

        PurchaseOrderApproval::create(['purchase_order_id' => $po4->id, 'approved_by' => $ketuaArmada->id, 'status' => 'disetujui', 'catatan' => null]);

        // PO-5: ditolak (ajuan baru)
        $po5 = PurchaseOrder::updateOrCreate(
            ['kode_po' => 'PO-2026-0005'],
            [
                'proyek_id' => null,
                'titik_id' => null,
                'supplier_id' => $supplier4->id,
                'created_by' => $gcsUser->id,
                'tanggal_pesan' => now()->subDays(1)->toDateString(),
                'tanggal_diperlukan' => now()->addDays(14)->toDateString(),
                'total' => 25_000_000,
                'status' => 'ditolak',
                'catatan' => 'Pengadaan kampas rem dibatalkan.',
            ]
        );
        PurchaseOrderItem::create(['purchase_order_id' => $po5->id, 'bahan_baku_id' => $kampas->id, 'jumlah' => 50, 'harga_satuan_snapshot' => 450_000, 'subtotal' => 22_500_000]);
        PurchaseOrderItem::create(['purchase_order_id' => $po5->id, 'bahan_baku_id' => $oli->id, 'jumlah' => 55, 'harga_satuan_snapshot' => 45_000, 'subtotal' => 2_475_000]);

        PurchaseOrderApproval::create(['purchase_order_id' => $po5->id, 'approved_by' => $ketuaArmada->id, 'status' => 'ditolak', 'catatan' => 'Stok kampas masih cukup.']);

        // PO-6: diterima — aspal & filler untuk AMP (proyek hotmix).
        $po6 = PurchaseOrder::updateOrCreate(
            ['kode_po' => 'PO-2026-0006'],
            [
                'proyek_id' => Proyek::where('kode_proyek', 'PRJ-AMP-001')->firstOrFail()->id,
                'titik_id' => Titik::where('nama', 'Plant AMP')->firstOrFail()->id,
                'supplier_id' => $supplier3->id,
                'created_by' => $owner->id,
                'tanggal_pesan' => now()->subDays(6)->toDateString(),
                'tanggal_diperlukan' => now()->subDays(1)->toDateString(),
                'total' => 173_000_000,
                'status' => 'diterima',
                'catatan' => 'Bahan aspal & filler untuk produksi hotmix.',
            ]
        );
        PurchaseOrderItem::create(['purchase_order_id' => $po6->id, 'bahan_baku_id' => $aspal->id, 'jumlah' => 12_000, 'harga_satuan_snapshot' => 12_500, 'subtotal' => 150_000_000]);
        PurchaseOrderItem::create(['purchase_order_id' => $po6->id, 'bahan_baku_id' => $filler->id, 'jumlah' => 57_500, 'harga_satuan_snapshot' => 400, 'subtotal' => 23_000_000]);

        PurchaseOrderApproval::create(['purchase_order_id' => $po6->id, 'approved_by' => $owner->id, 'status' => 'disetujui', 'catatan' => 'Mendukung target produksi hotmix AC-WC.']);

        // ───────────────────────── STOK MUTASI ─────────────────────────
        // Stok masuk dari PO-2 yang sudah diterima
        StokMutasi::create([
            'bahan_baku_id' => $oli->id,
            'titik_id' => $titikBlokA->id,
            'tipe' => 'masuk',
            'jumlah' => 100,
            'referensi_type' => PurchaseOrder::class,
            'referensi_id' => $po2->id,
            'catatan' => 'Penerimaan PO-2026-0002.',
            'tanggal' => now()->subDays(9)->toDateString(),
            'created_by' => $owner->id,
        ]);
        StokMutasi::create([
            'bahan_baku_id' => $filter->id,
            'titik_id' => $titikBlokA->id,
            'tipe' => 'masuk',
            'jumlah' => 10,
            'referensi_type' => PurchaseOrder::class,
            'referensi_id' => $po2->id,
            'catatan' => 'Penerimaan PO-2026-0002.',
            'tanggal' => now()->subDays(9)->toDateString(),
            'created_by' => $owner->id,
        ]);

        // Stok masuk dari PO-6 (aspal & filler untuk AMP).
        $titikPlantAmp = Titik::where('nama', 'Plant AMP')->firstOrFail();
        StokMutasi::create([
            'bahan_baku_id' => $aspal->id,
            'titik_id' => $titikPlantAmp->id,
            'tipe' => 'masuk',
            'jumlah' => 12_000,
            'referensi_type' => PurchaseOrder::class,
            'referensi_id' => $po6->id,
            'catatan' => 'Penerimaan PO-2026-0006.',
            'tanggal' => now()->subDays(5)->toDateString(),
            'created_by' => $owner->id,
        ]);
        StokMutasi::create([
            'bahan_baku_id' => $filler->id,
            'titik_id' => $titikPlantAmp->id,
            'tipe' => 'masuk',
            'jumlah' => 57_500,
            'referensi_type' => PurchaseOrder::class,
            'referensi_id' => $po6->id,
            'catatan' => 'Penerimaan PO-2026-0006.',
            'tanggal' => now()->subDays(5)->toDateString(),
            'created_by' => $owner->id,
        ]);
    }
}
