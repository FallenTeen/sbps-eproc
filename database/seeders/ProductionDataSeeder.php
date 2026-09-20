<?php

namespace Database\Seeders;

use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Fleet\Models\ServiceInterval;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\StokMutasi;
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
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class ProductionDataSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $gcs = UnitBisnis::where('kode', 'GCS')->firstOrFail();
        $cbp = UnitBisnis::where('kode', 'CBP')->firstOrFail();
        $amp = UnitBisnis::where('kode', 'AMP')->firstOrFail();

        $cbpUser = User::where('email', 'cbp@real.com')->firstOrFail();
        $ampUser = User::where('email', 'amp@real.com')->firstOrFail();
        $owner = User::where('email', 'owner@real.com')->firstOrFail();

        $titikPlantCbp = Titik::where('nama', 'Plant CBP')->firstOrFail();
        $titikPlantAmp = Titik::where('nama', 'Plant AMP')->firstOrFail();
        $titikTambang = Titik::where('nama', 'Lokasi Tambang')->firstOrFail();
        $titikJembatan = Titik::where('nama', 'Lokasi Jembatan')->firstOrFail();

        $operatorCbp = Karyawan::where('nama', 'Agus Salim')->firstOrFail();
        $operatorCbp2 = Karyawan::where('nama', 'Dedi Kurniawan')->firstOrFail();
        $operatorAmp = Karyawan::where('nama', 'Hendra Wijaya')->firstOrFail();
        $operatorAmp2 = Karyawan::where('nama', 'Andi Firmansyah')->firstOrFail();
        $operatorCrusher = Karyawan::where('nama', 'Yanto Operator')->firstOrFail();
        $driverStandby = Karyawan::where('nama', 'Rudi Hartono')->firstOrFail();
        $driverTambahan = Karyawan::where('nama', 'Slamet Riyadi')->firstOrFail();

        $semen = BahanBaku::where('kode', 'BB-001')->firstOrFail();
        $pasir = BahanBaku::where('kode', 'BB-002')->firstOrFail();
        $split = BahanBaku::where('kode', 'BB-003')->firstOrFail();
        $air = BahanBaku::where('kode', 'BB-004')->firstOrFail();

        $molen1 = Armada::where('kode_unit', 'TM 01 C')->firstOrFail();
        $molen2 = Armada::where('kode_unit', 'TM 02 C')->firstOrFail();

        // ─────────────────────────── PRODUK ───────────────────────────
        $produkBeton225 = Produk::updateOrCreate(
            ['unit_bisnis_id' => $cbp->id, 'nama' => 'Beton K-225'],
            ['kategori' => 'BETON_COR', 'satuan_output' => 'm3', 'aktif' => true]
        );
        $produkBeton300 = Produk::updateOrCreate(
            ['unit_bisnis_id' => $cbp->id, 'nama' => 'Beton K-300'],
            ['kategori' => 'BETON_COR', 'satuan_output' => 'm3', 'aktif' => true]
        );
        $produkHotmix = Produk::updateOrCreate(
            ['unit_bisnis_id' => $amp->id, 'nama' => 'Hotmix AC-WC'],
            ['kategori' => 'HOTMIX', 'satuan_output' => 'ton', 'aktif' => true]
        );
        $produkAgregat = Produk::updateOrCreate(
            ['unit_bisnis_id' => $gcs->id, 'nama' => 'Agregat Kelas A'],
            ['kategori' => 'SPLIT', 'satuan_output' => 'ton', 'aktif' => true]
        );

        // ───────────────────────── MESIN PRODUKSI ─────────────────────────
        $mesinCbp = MesinProduksi::updateOrCreate(
            ['unit_bisnis_id' => $cbp->id, 'nama' => 'Batching Plant CBP-01'],
            [
                'jenis' => 'mixer_beton',
                'kapasitas' => '90 m³/jam',
                'status' => 'aktif',
                'titik_id' => $titikPlantCbp->id,
                'produk_id' => $produkBeton225->id,
                'biaya_per_jam' => 850_000,
            ]
        );
        $mesinAmp = MesinProduksi::updateOrCreate(
            ['unit_bisnis_id' => $amp->id, 'nama' => 'AMP-01'],
            [
                'jenis' => 'mixer_aspal',
                'kapasitas' => '60 ton/jam',
                'status' => 'aktif',
                'titik_id' => $titikPlantAmp->id,
                'produk_id' => $produkHotmix->id,
                'biaya_per_jam' => 900_000,
            ]
        );
        $mesinCrusher = MesinProduksi::updateOrCreate(
            ['unit_bisnis_id' => $gcs->id, 'nama' => 'Stone Crusher GCS-01'],
            [
                'jenis' => 'crusher',
                'kapasitas' => '100 ton/jam',
                'status' => 'aktif',
                'titik_id' => $titikTambang->id,
                'produk_id' => $produkAgregat->id,
                'biaya_per_jam' => 500_000,
            ]
        );

        // ───────────────────────── HARGA JUAL ─────────────────────────
        $hargaJual = [
            [$produkBeton225->id, 1_200_000],
            [$produkBeton300->id, 1_400_000],
            [$produkHotmix->id, 1_600_000],
            [$produkAgregat->id, 450_000],
        ];
        foreach ($hargaJual as [$produkId, $harga]) {
            HargaJual::create([
                'produk_id' => $produkId,
                'harga' => $harga,
                'berlaku_dari' => now()->subMonths(6)->toDateString(),
                'berlaku_sampai' => null,
            ]);
        }

        // ─────────────────────── RESEP PRODUKSI (BOM) ───────────────────────
        // Resep Beton K-225 per m³
        ResepProduksi::create(['produk_id' => $produkBeton225->id, 'bahan_baku_id' => $semen->id, 'jumlah_per_unit_output' => 350]);
        ResepProduksi::create(['produk_id' => $produkBeton225->id, 'bahan_baku_id' => $pasir->id, 'jumlah_per_unit_output' => 700]);
        ResepProduksi::create(['produk_id' => $produkBeton225->id, 'bahan_baku_id' => $split->id, 'jumlah_per_unit_output' => 1100]);
        ResepProduksi::create(['produk_id' => $produkBeton225->id, 'bahan_baku_id' => $air->id, 'jumlah_per_unit_output' => 200]);

        // ─────────────────────── MIX DESIGN TEMPLATE ───────────────────────
        $fc10 = MixDesignTemplate::create(['mutu_beton' => 'FC10', 'nama' => 'K-125', 'deskripsi' => 'Beton non-struktural.']);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc10->id, 'bahan_baku_id' => $semen->id, 'jumlah_per_m3' => 260]);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc10->id, 'bahan_baku_id' => $pasir->id, 'jumlah_per_m3' => 750]);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc10->id, 'bahan_baku_id' => $split->id, 'jumlah_per_m3' => 1050]);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc10->id, 'bahan_baku_id' => $air->id, 'jumlah_per_m3' => 190]);

        $fc15 = MixDesignTemplate::create(['mutu_beton' => 'FC15', 'nama' => 'K-175', 'deskripsi' => 'Beton struktural ringan.']);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc15->id, 'bahan_baku_id' => $semen->id, 'jumlah_per_m3' => 300]);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc15->id, 'bahan_baku_id' => $pasir->id, 'jumlah_per_m3' => 720]);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc15->id, 'bahan_baku_id' => $split->id, 'jumlah_per_m3' => 1080]);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc15->id, 'bahan_baku_id' => $air->id, 'jumlah_per_m3' => 195]);

        $fc25 = MixDesignTemplate::create(['mutu_beton' => 'FC25', 'nama' => 'K-300', 'deskripsi' => 'Beton struktural tinggi.']);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc25->id, 'bahan_baku_id' => $semen->id, 'jumlah_per_m3' => 380]);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc25->id, 'bahan_baku_id' => $pasir->id, 'jumlah_per_m3' => 680]);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc25->id, 'bahan_baku_id' => $split->id, 'jumlah_per_m3' => 1100]);
        MixDesignTemplateItem::create(['mix_design_template_id' => $fc25->id, 'bahan_baku_id' => $air->id, 'jumlah_per_m3' => 200]);

        // ────────────────────── PRODUCTION SESSION ──────────────────────
        $session1 = ProductionSession::create([
            'mesin_id' => $mesinCbp->id,
            'titik_id' => $titikPlantCbp->id,
            'produk_id' => $produkBeton225->id,
            'operator_karyawan_id' => $operatorCbp->id,
            'mulai' => now()->subDays(1)->startOfDay()->addHours(6),
            'selesai' => now()->subDays(1)->startOfDay()->addHours(12),
            'hasil_output' => 120,
            'status' => 'selesai',
            'catatan' => 'Produksi beton K-225 untuk proyek jembatan.',
        ]);
        ProductionSessionItem::create(['production_session_id' => $session1->id, 'bahan_baku_id' => $semen->id, 'jumlah_terpakai' => 42_000]);
        ProductionSessionItem::create(['production_session_id' => $session1->id, 'bahan_baku_id' => $pasir->id, 'jumlah_terpakai' => 84_000]);
        ProductionSessionItem::create(['production_session_id' => $session1->id, 'bahan_baku_id' => $split->id, 'jumlah_terpakai' => 132_000]);
        ProductionSessionItem::create(['production_session_id' => $session1->id, 'bahan_baku_id' => $air->id, 'jumlah_terpakai' => 24_000]);

        $session2 = ProductionSession::create([
            'mesin_id' => $mesinCbp->id,
            'titik_id' => $titikPlantCbp->id,
            'produk_id' => $produkBeton300->id,
            'operator_karyawan_id' => $operatorCbp2->id,
            'mulai' => now()->subHours(2),
            'selesai' => null,
            'hasil_output' => null,
            'status' => 'berjalan',
            'catatan' => 'Produksi beton K-300 berjalan.',
        ]);

        $session3 = ProductionSession::create([
            'mesin_id' => $mesinAmp->id,
            'titik_id' => $titikPlantAmp->id,
            'produk_id' => $produkHotmix->id,
            'operator_karyawan_id' => $operatorAmp->id,
            'mulai' => now()->subDays(2)->startOfDay()->addHours(7),
            'selesai' => now()->subDays(2)->startOfDay()->addHours(14),
            'hasil_output' => 80,
            'status' => 'selesai',
            'catatan' => 'Produksi hotmix untuk jalan provinsi.',
        ]);

        $session4 = ProductionSession::create([
            'mesin_id' => $mesinCrusher->id,
            'titik_id' => $titikTambang->id,
            'produk_id' => $produkAgregat->id,
            'operator_karyawan_id' => $operatorCrusher->id,
            'mulai' => now()->subDays(3)->startOfDay()->addHours(8),
            'selesai' => now()->subDays(3)->startOfDay()->addHours(16),
            'hasil_output' => 200,
            'status' => 'selesai',
            'catatan' => 'Produksi agregat kelas A.',
        ]);

        // ────────────────────────── QC SAMPLE ──────────────────────────
        QCSample::create([
            'production_session_id' => $session1->id,
            'jenis_uji' => 'slump_test',
            'nilai_slump' => 12,
            'tanggal_uji_tekan_rencana' => null,
            'hasil_uji_tekan' => null,
            'status' => 'lolos',
            'catatan' => 'Slump sesuai spesifikasi 12±2 cm.',
        ]);
        QCSample::create([
            'production_session_id' => $session1->id,
            'jenis_uji' => 'uji_tekan',
            'nilai_slump' => null,
            'tanggal_uji_tekan_rencana' => now()->addDays(28)->toDateString(),
            'hasil_uji_tekan' => null,
            'status' => 'menunggu_hasil',
            'catatan' => 'Sample uji tekan, menunggu 28 hari.',
        ]);
        QCSample::create([
            'production_session_id' => $session2->id,
            'jenis_uji' => 'slump_test',
            'nilai_slump' => 11,
            'tanggal_uji_tekan_rencana' => null,
            'hasil_uji_tekan' => null,
            'status' => 'menunggu_hasil',
            'catatan' => null,
        ]);

        // ───────────────────────── PENGIRIMAN ─────────────────────────
        Pengiriman::create([
            'production_session_id' => $session1->id,
            'armada_id' => $molen1->id,
            'driver_karyawan_id' => $driverStandby->id,
            'tujuan_alamat' => 'Lokasi Jembatan, Jakarta Barat',
            'waktu_muat' => now()->subDays(1)->startOfDay()->addHours(6)->addMinutes(30),
            'waktu_tiba_tujuan' => now()->subDays(1)->startOfDay()->addHours(7),
            'waktu_selesai_tuang' => now()->subDays(1)->startOfDay()->addHours(7)->addMinutes(30),
            'status' => 'selesai',
            'catatan' => null,
        ]);
        Pengiriman::create([
            'production_session_id' => $session1->id,
            'armada_id' => $molen2->id,
            'driver_karyawan_id' => $driverTambahan->id,
            'tujuan_alamat' => 'Lokasi Jembatan, Jakarta Barat',
            'waktu_muat' => now()->subDays(1)->startOfDay()->addHours(8),
            'waktu_tiba_tujuan' => now()->subDays(1)->startOfDay()->addHours(8)->addMinutes(30),
            'waktu_selesai_tuang' => now()->subDays(1)->startOfDay()->addHours(9),
            'status' => 'selesai',
            'catatan' => null,
        ]);
        Pengiriman::create([
            'production_session_id' => $session2->id,
            'armada_id' => $molen1->id,
            'driver_karyawan_id' => $driverStandby->id,
            'tujuan_alamat' => 'Lokasi Jembatan, Jakarta Barat',
            'waktu_muat' => now()->subHour(),
            'waktu_tiba_tujuan' => null,
            'waktu_selesai_tuang' => null,
            'status' => 'dalam_perjalanan',
            'catatan' => null,
        ]);

        // ─────────────── STOK MUTASI KELUAR (KONSUMSI) ────────────────
        $konsumsi = [
            [$semen->id, 42_000],
            [$pasir->id, 84_000],
            [$split->id, 132_000],
            [$air->id, 24_000],
        ];
        foreach ($konsumsi as [$bahanBakuId, $jumlah]) {
            StokMutasi::create([
                'bahan_baku_id' => $bahanBakuId,
                'titik_id' => $titikPlantCbp->id,
                'tipe' => 'keluar',
                'jumlah' => $jumlah,
                'referensi_type' => ProductionSession::class,
                'referensi_id' => $session1->id,
                'catatan' => 'Konsumsi produksi beton K-225.',
                'tanggal' => now()->subDays(1)->toDateString(),
                'created_by' => $cbpUser->id,
            ]);
        }

        // ──────────────── DATA FLEET UNTUK MESIN PRODUKSI ────────────────
        // BBM mesin
        BbmLog::create(['serviceable_type' => MesinProduksi::class, 'serviceable_id' => $mesinCbp->id, 'tanggal' => now()->subDay()->toDateString(), 'liter' => 200, 'biaya' => 2_400_000, 'jam_operasional_saat_isi' => 6, 'purchase_order_id' => null, 'dicatat_oleh' => $cbpUser->id]);
        BbmLog::create(['serviceable_type' => MesinProduksi::class, 'serviceable_id' => $mesinAmp->id, 'tanggal' => now()->subDays(2)->toDateString(), 'liter' => 180, 'biaya' => 2_160_000, 'jam_operasional_saat_isi' => 7, 'purchase_order_id' => null, 'dicatat_oleh' => $ampUser->id]);

        // Downtime mesin
        DowntimeLog::create([
            'serviceable_type' => MesinProduksi::class,
            'serviceable_id' => $mesinAmp->id,
            'mulai' => now()->subDays(3),
            'selesai' => now()->subDays(2),
            'penyebab' => 'Burner bermasalah',
            'kategori' => 'kerusakan',
            'catatan' => 'Burner diganti.',
        ]);

        // Checklist harian mesin
        ArmadaChecklistHarian::create([
            'checkable_type' => MesinProduksi::class,
            'checkable_id' => $mesinCbp->id,
            'tanggal' => now()->toDateString(),
            'kondisi_baik' => true,
            'item_bermasalah' => null,
            'dicatat_oleh_karyawan_id' => $operatorCbp->id,
        ]);
        ArmadaChecklistHarian::create([
            'checkable_type' => MesinProduksi::class,
            'checkable_id' => $mesinAmp->id,
            'tanggal' => now()->toDateString(),
            'kondisi_baik' => false,
            'item_bermasalah' => 'Mixer tidak stabil pada kapasitas penuh.',
            'dicatat_oleh_karyawan_id' => $operatorAmp->id,
        ]);

        // Service history mesin
        ServiceHistory::create(['serviceable_type' => MesinProduksi::class, 'serviceable_id' => $mesinCbp->id, 'tanggal' => now()->subDays(10)->toDateString(), 'jenis_servis' => 'Servis rutin', 'biaya' => 3_500_000, 'notes' => 'Pengecekan mixer & silo.', 'purchase_order_id' => null]);
        ServiceHistory::create(['serviceable_type' => MesinProduksi::class, 'serviceable_id' => $mesinAmp->id, 'tanggal' => now()->subDays(15)->toDateString(), 'jenis_servis' => 'Ganti burner', 'biaya' => 6_000_000, 'notes' => null, 'purchase_order_id' => null]);

        // Interval service mesin
        ServiceInterval::create(['serviceable_type' => MesinProduksi::class, 'serviceable_id' => $mesinCbp->id, 'interval_bulan' => 2, 'interval_jam_operasional' => 1000]);
        ServiceInterval::create(['serviceable_type' => MesinProduksi::class, 'serviceable_id' => $mesinAmp->id, 'interval_bulan' => 2, 'interval_jam_operasional' => 800]);
        ServiceInterval::create(['serviceable_type' => MesinProduksi::class, 'serviceable_id' => $mesinCrusher->id, 'interval_bulan' => 3, 'interval_jam_operasional' => 600]);
    }
}
