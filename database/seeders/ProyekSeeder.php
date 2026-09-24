<?php

namespace Database\Seeders;

use App\Domain\Core\Models\KomunikasiLog;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class ProyekSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $gcs = UnitBisnis::where('kode', 'GCS')->firstOrFail();
        $cbp = UnitBisnis::where('kode', 'CBP')->firstOrFail();
        $amp = UnitBisnis::where('kode', 'AMP')->firstOrFail();

        $owner = User::where('email', 'owner@real.com')->firstOrFail();
        $gcsUser = User::where('email', 'gcs@real.com')->firstOrFail();
        $kontraktor = User::where('email', 'kontraktor@dummy.com')->firstOrFail();

        // ─────────────────────────── PROYEK ───────────────────────────
        $proyeks = [
            [
                'kode_proyek' => 'PRJ-GCS-001',
                'unit_bisnis_id' => $gcs->id,
                'nama' => 'Pematangan Lahan Kawasan Industri',
                'tipe_proyek' => 'internal',
                'client' => null,
                'lokasi' => 'Cikarang, Jawa Barat',
                'tanggal_mulai' => now()->subMonths(4)->toDateString(),
                'tanggal_selesai_rencana' => now()->addMonths(8)->toDateString(),
                'status' => 'aktif',
                'catatan' => 'Pekerjaan urugan, pematangan & pemadatan lahan.',
                'created_by' => $owner->id,
            ],
            [
                'kode_proyek' => 'PRJ-GCS-002',
                'unit_bisnis_id' => $gcs->id,
                'nama' => 'Angkutan Material Proyek Bendungan',
                'tipe_proyek' => 'kontrak_klien',
                'client' => 'PT Bendungan Utama',
                'lokasi' => 'Kabupaten Bogor',
                'tanggal_mulai' => now()->subMonths(3)->toDateString(),
                'tanggal_selesai_rencana' => now()->addMonths(9)->toDateString(),
                'status' => 'aktif',
                'catatan' => 'Angkut material timbunan dari area tambang ke lokasi bendungan.',
                'created_by' => $owner->id,
            ],
            [
                'kode_proyek' => 'PRJ-CBP-001',
                'unit_bisnis_id' => $cbp->id,
                'nama' => 'Suplai Beton Proyek Jembatan',
                'tipe_proyek' => 'kontrak_klien',
                'client' => 'PT Konstruksi Andalan',
                'lokasi' => 'Jakarta Barat',
                'tanggal_mulai' => now()->subMonths(2)->toDateString(),
                'tanggal_selesai_rencana' => now()->addMonths(6)->toDateString(),
                'status' => 'aktif',
                'catatan' => 'Penyediaan beton ready-mix K-225 & K-300.',
                'created_by' => $owner->id,
            ],
            [
                'kode_proyek' => 'PRJ-CBP-002',
                'unit_bisnis_id' => $cbp->id,
                'nama' => 'Sinergi Plant CBP-2',
                'tipe_proyek' => 'internal',
                'client' => null,
                'lokasi' => 'Cibitung, Jawa Barat',
                'tanggal_mulai' => now()->subMonths(1)->toDateString(),
                'tanggal_selesai_rencana' => now()->addMonths(5)->toDateString(),
                'status' => 'aktif',
                'catatan' => 'Pengerasan area & penataan Plant CBP-2.',
                'created_by' => $owner->id,
            ],
            [
                'kode_proyek' => 'PRJ-AMP-001',
                'unit_bisnis_id' => $amp->id,
                'nama' => 'Hotmix Jalan Provinsi',
                'tipe_proyek' => 'kontrak_klien',
                'client' => 'Dinas PU Provinsi',
                'lokasi' => 'Bekasi, Jawa Barat',
                'tanggal_mulai' => now()->subMonths(1)->toDateString(),
                'tanggal_selesai_rencana' => now()->addMonths(4)->toDateString(),
                'status' => 'aktif',
                'catatan' => 'Produksi & pengecoran hotmix AC-WC.',
                'created_by' => $owner->id,
            ],
            [
                'kode_proyek' => 'PRJ-KTR-001',
                'unit_bisnis_id' => $gcs->id,
                'nama' => 'Kantor Pusat SBPS',
                'tipe_proyek' => 'internal',
                'client' => null,
                'lokasi' => 'Patikraja, Banyumas, Jawa Tengah',
                'tanggal_mulai' => now()->subMonths(8)->toDateString(),
                'tanggal_selesai_rencana' => now()->addYears(5)->toDateString(),
                'status' => 'aktif',
                'catatan' => 'Head Office PT Satria Buana Pamula Sakti — lokasi absen karyawan kantor.',
                'created_by' => $owner->id,
            ],
        ];

        foreach ($proyeks as $data) {
            $proyek = Proyek::updateOrCreate(['kode_proyek' => $data['kode_proyek']], $data);

            // Hubungkan user kontraktor (eksternal) HANYA ke proyek kontrak_klien
            // miliknya (pivot proyek_user) untuk object-level scoping. Kontraktor
            // ini menangani PRJ-GCS-002 saja — proyek milik klien/unit lain TIDAK
            // boleh terlihat olehnya walau juga bertipe kontrak_klien.
            if ($data['kode_proyek'] === 'PRJ-GCS-002') {
                $proyek->users()->syncWithoutDetaching([$kontraktor->id]);
            }
        }

        // ─────────────────────────── TITIK ───────────────────────────
        $titiks = [
            ['PRJ-GCS-001', 'Lahan Blok A', -6.24300000, 107.15200000, 100],
            ['PRJ-GCS-001', 'Lahan Blok B', -6.25000000, 107.16000000, 100],
            ['PRJ-GCS-002', 'Lokasi Tambang', -6.59800000, 106.80600000, 150],
            ['PRJ-GCS-002', 'Lokasi Bendungan', -6.60100000, 106.80200000, 150],
            ['PRJ-CBP-001', 'Plant CBP', -6.21900000, 107.00100000, 100],
            ['PRJ-CBP-001', 'Lokasi Jembatan', -6.18400000, 106.79300000, 100],
            ['PRJ-AMP-001', 'Plant AMP', -6.23800000, 107.02000000, 100],
            ['PRJ-AMP-001', 'Jalan Provinsi KM 12', -6.18000000, 107.18000000, 100],
            ['PRJ-CBP-002', 'Area Plant CBP-2', -6.23000000, 107.01000000, 100],
            // Kantor utama SBPS (Jl. Raya Patikraja No. 99, Patikraja, Banyumas)
            // — titik absen wajib karyawan kantor.
            ['PRJ-KTR-001', 'Kantor Pusat', -7.4685527, 109.217636, 100],
        ];

        $titikIds = [];
        foreach ($titiks as [$kodeProyek, $nama, $lat, $lng, $radius]) {
            $proyek = Proyek::where('kode_proyek', $kodeProyek)->firstOrFail();
            $titik = Titik::firstOrCreate([
                'proyek_id' => $proyek->id,
                'nama' => $nama,
            ], [
                'latitude' => $lat,
                'longitude' => $lng,
                'radius_presensi_meter' => $radius,
                'status' => 'aktif',
            ]);
            $titikIds[$nama] = $titik->id;
        }

        // ─────────────────────────── RAB ───────────────────────────
        $rabs = [
            ['PRJ-GCS-001', 'bahan_baku', 1_500_000_000, null, 'Pembelian material urugan & pasir.'],
            ['PRJ-GCS-001', 'sparepart', 250_000_000, null, 'Sparepart armada.'],
            ['PRJ-GCS-001', 'sdm_tetap', 900_000_000, null, 'Gaji tim tetap.'],
            ['PRJ-GCS-001', 'sdm_kondisional', 400_000_000, null, 'Tenaga harian & borongan.'],
            ['PRJ-GCS-001', 'lainnya', 100_000_000, null, 'BBM & operasional.'],
            ['PRJ-GCS-002', 'bahan_baku', 800_000_000, null, 'Material timbunan.'],
            ['PRJ-GCS-002', 'sdm_kondisional', 350_000_000, null, 'Upah borongan rit.'],
            ['PRJ-CBP-001', 'bahan_baku', 2_000_000_000, 'Plant CBP', 'Semen, pasir, split, aditif.'],
            ['PRJ-CBP-001', 'sparepart', 120_000_000, 'Plant CBP', 'Sparepart batching plant.'],
            ['PRJ-CBP-001', 'sdm_tetap', 600_000_000, 'Plant CBP', 'Gaji operator tetap.'],
            ['PRJ-AMP-001', 'bahan_baku', 1_200_000_000, null, 'Agregat & aspal.'],
            ['PRJ-AMP-001', 'sdm_kondisional', 300_000_000, null, 'Tenaga harian plant.'],
            ['PRJ-CBP-002', 'bahan_baku', 250_000_000, 'Area Plant CBP-2', 'Beton untuk pengerasan.'],
        ];

        foreach ($rabs as [$kodeProyek, $kategori, $rencana, $namaTitik, $catatan]) {
            $proyek = Proyek::where('kode_proyek', $kodeProyek)->firstOrFail();
            Rab::create([
                'proyek_id' => $proyek->id,
                'titik_id' => $namaTitik ? ($titikIds[$namaTitik] ?? null) : null,
                'kategori' => $kategori,
                'rencana' => $rencana,
                'catatan' => $catatan,
                'created_by' => $owner->id,
            ]);
        }

        // ─────────────────────── KOMUNIKASI LOG ───────────────────────
        KomunikasiLog::create([
            'proyek_id' => Proyek::where('kode_proyek', 'PRJ-GCS-001')->first()->id,
            'user_id' => $gcsUser->id,
            'pengirim_role' => 'kantor',
            'pesan' => 'Laporan progres pematangan lahan 45%.',
        ]);

        KomunikasiLog::create([
            'proyek_id' => Proyek::where('kode_proyek', 'PRJ-GCS-002')->first()->id,
            'user_id' => $kontraktor->id,
            'pengirim_role' => 'kontraktor',
            'pesan' => 'Mohon tambahan armada dump truck 2 unit mulai minggu depan.',
        ]);
    }
}
