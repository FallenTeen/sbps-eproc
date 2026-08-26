<?php

namespace Database\Seeders;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseBiayaLain;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Fleet\Models\ServiceInterval;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Database\Seeder;

class FleetDataSeeder extends Seeder
{
    public function run(): void
    {
        $gcs = UnitBisnis::where('kode', 'GCS')->firstOrFail();
        $cbp = UnitBisnis::where('kode', 'CBP')->firstOrFail();

        $gcsUser = User::where('email', 'gcs@example.com')->firstOrFail();

        $proyek1 = Proyek::where('kode_proyek', 'PRJ-GCS-001')->firstOrFail();
        $proyek2 = Proyek::where('kode_proyek', 'PRJ-GCS-002')->firstOrFail();

        $titikBlokA = Titik::where('nama', 'Lahan Blok A')->firstOrFail();
        $titikBlokB = Titik::where('nama', 'Lahan Blok B')->firstOrFail();
        $titikTambang = Titik::where('nama', 'Lokasi Tambang')->firstOrFail();
        $titikBendungan = Titik::where('nama', 'Lokasi Bendungan')->firstOrFail();
        $titikPlantCbp = Titik::where('nama', 'Plant CBP')->firstOrFail();

        $driverStandby = Karyawan::where('nama', 'Rudi Hartono')->firstOrFail();
        $driverKondisional = Karyawan::where('nama', 'Bambang Setiawan')->firstOrFail();
        $driverTambahan = Karyawan::where('nama', 'Slamet Riyadi')->firstOrFail();
        $koordinatorKaryawan = Karyawan::where('nama', 'Koordinator GCS')->firstOrFail();

        // ────────────────────────── ARMADA ──────────────────────────
        $armadas = [
            ['plat_nomor' => 'B 9123 ABC', 'unit_bisnis_id' => $gcs->id, 'kode_unit' => 'GCS-DT-01', 'jenis' => 'dump_truck', 'model_tarif' => 'ritase', 'tahun' => 2020, 'kapasitas' => '8 m³', 'titik_id' => $titikBlokA->id, 'status' => 'aktif'],
            ['plat_nomor' => 'B 9124 ABC', 'unit_bisnis_id' => $gcs->id, 'kode_unit' => 'GCS-DT-02', 'jenis' => 'dump_truck', 'model_tarif' => 'ritase', 'tahun' => 2019, 'kapasitas' => '8 m³', 'titik_id' => $titikTambang->id, 'status' => 'aktif'],
            ['plat_nomor' => 'B 9125 ABC', 'unit_bisnis_id' => $gcs->id, 'kode_unit' => 'GCS-DT-03', 'jenis' => 'dump_truck', 'model_tarif' => 'ritase', 'tahun' => 2021, 'kapasitas' => '12 m³', 'titik_id' => $titikBlokB->id, 'status' => 'aktif'],
            ['plat_nomor' => 'B 7711 XX', 'unit_bisnis_id' => $gcs->id, 'kode_unit' => 'GCS-AB-01', 'jenis' => 'alat_berat', 'model_tarif' => 'sewa_jam', 'tahun' => 2018, 'kapasitas' => 'Excavator PC200', 'titik_id' => $titikBendungan->id, 'status' => 'aktif'],
            ['plat_nomor' => 'B 8812 XX', 'unit_bisnis_id' => $gcs->id, 'kode_unit' => 'GCS-AB-02', 'jenis' => 'alat_berat', 'model_tarif' => 'sewa_jam', 'tahun' => 2019, 'kapasitas' => 'Wheel Loader', 'titik_id' => $titikTambang->id, 'status' => 'aktif'],
            ['plat_nomor' => 'B 6621 MX', 'unit_bisnis_id' => $cbp->id, 'kode_unit' => 'CBP-TM-01', 'jenis' => 'truck_molen', 'model_tarif' => 'sewa_jam', 'tahun' => 2022, 'kapasitas' => '7 m³', 'titik_id' => $titikPlantCbp->id, 'status' => 'aktif'],
            ['plat_nomor' => 'B 6622 MX', 'unit_bisnis_id' => $cbp->id, 'kode_unit' => 'CBP-TM-02', 'jenis' => 'truck_molen', 'model_tarif' => 'sewa_jam', 'tahun' => 2022, 'kapasitas' => '7 m³', 'titik_id' => $titikPlantCbp->id, 'status' => 'aktif'],
        ];

        $armadaIds = [];
        foreach ($armadas as $data) {
            $armada = Armada::updateOrCreate(
                ['plat_nomor' => $data['plat_nomor']],
                array_merge($data, ['tanggal_mulai_pakai' => now()->subYears(2)->toDateString()])
            );
            $armadaIds[$data['kode_unit']] = $armada->id;
        }

        // ───────────────────────── RUTE TARIF ─────────────────────────
        $ruteTarifs = [
            ['lokasi_asal' => 'Lokasi Tambang', 'lokasi_tujuan' => 'Lokasi Bendungan', 'jarak_km' => 25, 'tarif_per_rit' => 1_200_000, 'indeks_liter_solar_per_km' => 0.400],
            ['lokasi_asal' => 'Lahan Blok A', 'lokasi_tujuan' => 'Stockpile', 'jarak_km' => 12, 'tarif_per_rit' => 650_000, 'indeks_liter_solar_per_km' => 0.350],
            ['lokasi_asal' => 'Cikarang', 'lokasi_tujuan' => 'Jakarta', 'jarak_km' => 45, 'tarif_per_rit' => 2_100_000, 'indeks_liter_solar_per_km' => 0.450],
        ];

        $ruteIds = [];
        foreach ($ruteTarifs as $data) {
            $rute = RuteTarif::updateOrCreate(
                [
                    'unit_bisnis_id' => $gcs->id,
                    'lokasi_asal' => $data['lokasi_asal'],
                    'lokasi_tujuan' => $data['lokasi_tujuan'],
                ],
                array_merge($data, [
                    'unit_bisnis_id' => $gcs->id,
                    'berlaku_dari' => now()->subMonths(6)->toDateString(),
                    'berlaku_sampai' => null,
                ])
            );
            $ruteIds[$data['lokasi_asal'].'|'.$data['lokasi_tujuan']] = $rute->id;
        }

        $ruteTambangBendungan = $ruteIds['Lokasi Tambang|Lokasi Bendungan'];
        $ruteBlokAStockpile = $ruteIds['Lahan Blok A|Stockpile'];

        // ─────────────────────── PENUGASAN DRIVER ───────────────────────
        ArmadaDriver::create(['armada_id' => $armadaIds['GCS-DT-01'], 'karyawan_id' => $driverStandby->id, 'tipe' => 'standby', 'tanggal_mulai' => now()->subDays(30)->toDateString(), 'tanggal_selesai' => null, 'status' => 'aktif']);
        ArmadaDriver::create(['armada_id' => $armadaIds['GCS-DT-02'], 'karyawan_id' => $driverKondisional->id, 'tipe' => 'kondisional', 'tanggal_mulai' => now()->subDays(30)->toDateString(), 'tanggal_selesai' => null, 'status' => 'aktif']);
        ArmadaDriver::create(['armada_id' => $armadaIds['CBP-TM-01'], 'karyawan_id' => $driverTambahan->id, 'tipe' => 'standby', 'tanggal_mulai' => now()->subDays(30)->toDateString(), 'tanggal_selesai' => null, 'status' => 'aktif']);

        // ────────────────────── INTERVAL SERVICE ──────────────────────
        foreach ($armadaIds as $armadaId) {
            ServiceInterval::create([
                'serviceable_type' => Armada::class,
                'serviceable_id' => $armadaId,
                'interval_bulan' => 2,
                'interval_jam_operasional' => 500,
            ]);
        }

        // ─────────────────────────── RITASE ───────────────────────────
        $ritase1 = Ritase::create([
            'armada_id' => $armadaIds['GCS-DT-01'],
            'driver_karyawan_id' => $driverStandby->id,
            'tanggal' => now()->subDays(3)->toDateString(),
            'rute_tarif_id' => $ruteTambangBendungan,
            'kategori' => 'material',
            'material' => 'Pasir',
            'jumlah_rit' => 12,
            'tarif_per_rit_snapshot' => 1_200_000,
            'proyek_id' => $proyek2->id,
            'titik_id' => $titikBendungan->id,
            'customer' => 'PT Bendungan Utama',
            'status' => 'disetujui',
            'catatan' => null,
        ]);
        Ritase::create([
            'armada_id' => $armadaIds['GCS-DT-01'],
            'driver_karyawan_id' => $driverStandby->id,
            'tanggal' => now()->subDays(2)->toDateString(),
            'rute_tarif_id' => $ruteTambangBendungan,
            'kategori' => 'material',
            'material' => 'Split 1/2',
            'jumlah_rit' => 10,
            'tarif_per_rit_snapshot' => 1_200_000,
            'proyek_id' => $proyek2->id,
            'titik_id' => $titikBendungan->id,
            'customer' => 'PT Bendungan Utama',
            'status' => 'draft',
            'catatan' => null,
        ]);
        $ritase3 = Ritase::create([
            'armada_id' => $armadaIds['GCS-DT-01'],
            'driver_karyawan_id' => $driverStandby->id,
            'tanggal' => now()->subDay()->toDateString(),
            'rute_tarif_id' => $ruteTambangBendungan,
            'kategori' => 'material',
            'material' => 'Pasir',
            'jumlah_rit' => 10,
            'tarif_per_rit_snapshot' => 1_200_000,
            'proyek_id' => $proyek2->id,
            'titik_id' => $titikBendungan->id,
            'customer' => 'PT Bendungan Utama',
            'status' => 'disetujui',
            'catatan' => null,
        ]);
        $ritase4 = Ritase::create([
            'armada_id' => $armadaIds['GCS-DT-02'],
            'driver_karyawan_id' => $driverKondisional->id,
            'tanggal' => now()->subDays(4)->toDateString(),
            'rute_tarif_id' => $ruteBlokAStockpile,
            'kategori' => 'urugan',
            'material' => 'Urug',
            'jumlah_rit' => 8,
            'tarif_per_rit_snapshot' => 650_000,
            'proyek_id' => $proyek1->id,
            'titik_id' => $titikBlokA->id,
            'customer' => null,
            'status' => 'ditagih',
            'catatan' => null,
        ]);
        Ritase::create([
            'armada_id' => $armadaIds['GCS-DT-02'],
            'driver_karyawan_id' => $driverKondisional->id,
            'tanggal' => now()->subDays(2)->toDateString(),
            'rute_tarif_id' => $ruteBlokAStockpile,
            'kategori' => 'urugan',
            'material' => 'Urug',
            'jumlah_rit' => 15,
            'tarif_per_rit_snapshot' => 650_000,
            'proyek_id' => $proyek1->id,
            'titik_id' => $titikBlokA->id,
            'customer' => null,
            'status' => 'draft',
            'catatan' => null,
        ]);

        RitaseBiayaLain::create([
            'ritase_id' => $ritase1->id,
            'jenis' => 'lainnya',
            'jumlah' => 50_000,
            'catatan' => 'Biaya tol akses bendungan.',
        ]);

        // ──────────────────────── SEWA ALAT/JAM ────────────────────────
        $sewa1 = SewaAlatJam::create([
            'armada_id' => $armadaIds['GCS-AB-01'],
            'proyek_id' => $proyek2->id,
            'penyewa_eksternal' => null,
            'lokasi_pekerjaan' => 'Lokasi Bendungan',
            'harga_per_jam_snapshot' => 350_000,
            'tanggal' => now()->subDays(3)->toDateString(),
            'hm_awal' => 1200.5,
            'hm_akhir' => 1208.5,
            'jumlah_jam' => 8,
            'status' => 'disetujui',
            'catatan' => null,
        ]);
        SewaAlatJam::create([
            'armada_id' => $armadaIds['GCS-AB-02'],
            'proyek_id' => $proyek1->id,
            'penyewa_eksternal' => null,
            'lokasi_pekerjaan' => 'Lokasi Tambang',
            'harga_per_jam_snapshot' => 300_000,
            'tanggal' => now()->subDays(2)->toDateString(),
            'hm_awal' => 800.0,
            'hm_akhir' => 806.0,
            'jumlah_jam' => 6,
            'status' => 'draft',
            'catatan' => null,
        ]);

        // ─────────────────────── SERVICE HISTORY ───────────────────────
        ServiceHistory::create([
            'serviceable_type' => Armada::class,
            'serviceable_id' => $armadaIds['GCS-DT-01'],
            'tanggal' => now()->subDays(14)->toDateString(),
            'jenis_servis' => 'Servis berkala',
            'biaya' => 2_500_000,
            'notes' => 'Ganti oli & filter udara.',
            'purchase_order_id' => null,
        ]);
        ServiceHistory::create([
            'serviceable_type' => Armada::class,
            'serviceable_id' => $armadaIds['GCS-DT-02'],
            'tanggal' => now()->subDays(30)->toDateString(),
            'jenis_servis' => 'Ganti ban',
            'biaya' => 4_000_000,
            'notes' => 'Ganti 2 ban belakang.',
            'purchase_order_id' => null,
        ]);

        // ─────────────────────────── BBM LOG ───────────────────────────
        BbmLog::create([
            'serviceable_type' => Armada::class,
            'serviceable_id' => $armadaIds['GCS-DT-01'],
            'tanggal' => now()->subDays(2)->toDateString(),
            'liter' => 120,
            'biaya' => 1_440_000,
            'jam_operasional_saat_isi' => 8,
            'purchase_order_id' => null,
            'dicatat_oleh' => $gcsUser->id,
        ]);
        BbmLog::create([
            'serviceable_type' => Armada::class,
            'serviceable_id' => $armadaIds['GCS-DT-02'],
            'tanggal' => now()->subDay()->toDateString(),
            'liter' => 100,
            'biaya' => 1_200_000,
            'jam_operasional_saat_isi' => 6,
            'purchase_order_id' => null,
            'dicatat_oleh' => $gcsUser->id,
        ]);
        BbmLog::create([
            'serviceable_type' => Armada::class,
            'serviceable_id' => $armadaIds['GCS-AB-01'],
            'tanggal' => now()->subDays(3)->toDateString(),
            'liter' => 80,
            'biaya' => 960_000,
            'jam_operasional_saat_isi' => 8,
            'purchase_order_id' => null,
            'dicatat_oleh' => $gcsUser->id,
        ]);

        // ───────────────────────── DOWNTIME LOG ─────────────────────────
        DowntimeLog::create([
            'serviceable_type' => Armada::class,
            'serviceable_id' => $armadaIds['GCS-DT-02'],
            'mulai' => now()->subHours(5),
            'selesai' => null,
            'penyebab' => 'Mesin overheat',
            'kategori' => 'kerusakan',
            'catatan' => 'Menunggu pengecekan radiator.',
        ]);
        DowntimeLog::create([
            'serviceable_type' => Armada::class,
            'serviceable_id' => $armadaIds['GCS-DT-03'],
            'mulai' => now()->subDays(4),
            'selesai' => now()->subDays(2),
            'penyebab' => 'Ganti ban',
            'kategori' => 'kerusakan',
            'catatan' => null,
        ]);

        // ─────────────────── CHECKLIST HARIAN ARMADA ───────────────────
        ArmadaChecklistHarian::create([
            'checkable_type' => Armada::class,
            'checkable_id' => $armadaIds['GCS-DT-01'],
            'tanggal' => now()->toDateString(),
            'kondisi_baik' => true,
            'item_bermasalah' => null,
            'dicatat_oleh_karyawan_id' => $koordinatorKaryawan->id,
        ]);
        ArmadaChecklistHarian::create([
            'checkable_type' => Armada::class,
            'checkable_id' => $armadaIds['GCS-DT-02'],
            'tanggal' => now()->toDateString(),
            'kondisi_baik' => false,
            'item_bermasalah' => 'Radiator bocor, mesin cepat panas.',
            'dicatat_oleh_karyawan_id' => $koordinatorKaryawan->id,
        ]);
    }
}
