<?php

namespace Database\Seeders;

use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Cuti;
use App\Domain\HR\Models\GajiPeriode;
use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Models\KaryawanTitikAssignment;
use App\Domain\HR\Models\KomponenGaji;
use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class KaryawanSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $owner = User::where('email', 'owner@real.com')->firstOrFail();
        $gcs = User::where('email', 'gcs@real.com')->firstOrFail();
        $driverStandby = User::where('email', 'driver.standby@dummy.com')->firstOrFail();
        $driverKondisional = User::where('email', 'driver.kondisional@dummy.com')->firstOrFail();
        $mandorTitik = User::where('email', 'mandor.titik@dummy.com')->firstOrFail();
        $cbp = User::where('email', 'cbp@real.com')->firstOrFail();
        $amp = User::where('email', 'amp@real.com')->firstOrFail();

        // ───────────────────────── KARYAWAN ─────────────────────────
        $karyawans = [
            ['user_id' => $gcs->id, 'nama' => 'Koordinator GCS', 'tipe' => 'tetap', 'jabatan' => 'Koordinator GCS', 'rate_gaji_pokok' => 8_500_000, 'rate_harian' => null, 'no_hp' => '0812-1000-0001', 'alias' => 'KOR'],
            ['user_id' => $driverStandby->id, 'nama' => 'Rudi Hartono', 'tipe' => 'borongan_rit', 'jabatan' => 'Driver Dump Truck', 'rate_gaji_pokok' => null, 'rate_harian' => 150_000, 'no_hp' => '0812-1000-0002', 'alias' => 'RUDI'],
            ['user_id' => $driverKondisional->id, 'nama' => 'Bambang Setiawan', 'tipe' => 'borongan_rit', 'jabatan' => 'Driver Kondisional', 'rate_gaji_pokok' => null, 'rate_harian' => 150_000, 'no_hp' => '0812-1000-0003', 'alias' => 'BAMBANG'],
            ['user_id' => $mandorTitik->id, 'nama' => 'Joko Susilo', 'tipe' => 'harian', 'jabatan' => 'Mandor Titik', 'rate_gaji_pokok' => null, 'rate_harian' => 175_000, 'no_hp' => '0812-1000-0004', 'alias' => 'JOKO'],
            ['user_id' => $cbp->id, 'nama' => 'Agus Salim', 'tipe' => 'tetap', 'jabatan' => 'Operator Batching Plant', 'rate_gaji_pokok' => 7_000_000, 'rate_harian' => null, 'no_hp' => '0812-1000-0005', 'alias' => 'AGUS'],
            ['user_id' => $amp->id, 'nama' => 'Hendra Wijaya', 'tipe' => 'tetap', 'jabatan' => 'Operator AMP', 'rate_gaji_pokok' => 7_500_000, 'rate_harian' => null, 'no_hp' => '0812-1000-0006', 'alias' => 'HENDRA'],
            ['user_id' => null, 'nama' => 'Slamet Riyadi', 'tipe' => 'borongan_rit', 'jabatan' => 'Driver Dump Truck', 'rate_gaji_pokok' => null, 'rate_harian' => 150_000, 'no_hp' => '0812-1000-0007', 'alias' => 'SLAMET'],
            ['user_id' => null, 'nama' => 'Yanto Operator', 'tipe' => 'harian', 'jabatan' => 'Operator Excavator', 'rate_gaji_pokok' => null, 'rate_harian' => 200_000, 'no_hp' => '0812-1000-0008', 'alias' => 'YANTO'],
            ['user_id' => null, 'nama' => 'Dedi Kurniawan', 'tipe' => 'tetap', 'jabatan' => 'Operator Batching Plant', 'rate_gaji_pokok' => 6_800_000, 'rate_harian' => null, 'no_hp' => '0812-1000-0009', 'alias' => 'DEDI'],
            ['user_id' => null, 'nama' => 'Andi Firmansyah', 'tipe' => 'tetap', 'jabatan' => 'Operator AMP', 'rate_gaji_pokok' => 7_200_000, 'rate_harian' => null, 'no_hp' => '0812-1000-0010', 'alias' => 'ANDI'],
            ['user_id' => null, 'nama' => 'Siti Aminah', 'tipe' => 'tetap', 'jabatan' => 'Laboran QC', 'rate_gaji_pokok' => 5_800_000, 'rate_harian' => null, 'no_hp' => '0812-1000-0011', 'alias' => 'SITI'],
            ['user_id' => null, 'nama' => 'Budi Santoso', 'tipe' => 'tetap', 'jabatan' => 'Mekanik Armada', 'rate_gaji_pokok' => 5_500_000, 'rate_harian' => null, 'no_hp' => '0812-1000-0012', 'alias' => 'BUDI'],
            ['user_id' => null, 'nama' => 'Eko Prasetyo', 'tipe' => 'harian', 'jabatan' => 'Operator Loader', 'rate_gaji_pokok' => null, 'rate_harian' => 190_000, 'no_hp' => '0812-1000-0013', 'alias' => 'EKO'],
            ['user_id' => null, 'nama' => 'Wahyu Nugroho', 'tipe' => 'harian', 'jabatan' => 'Kenek Dump Truck', 'rate_gaji_pokok' => null, 'rate_harian' => 120_000, 'no_hp' => '0812-1000-0014', 'alias' => 'WAHYU'],
        ];

        $karyawanIds = [];
        foreach ($karyawans as $i => $data) {
            $karyawan = Karyawan::updateOrCreate(['nama' => $data['nama']], array_merge($data, [
                'npwp' => sprintf('12.345.678.%d-001.000', 900 + $i),
                'no_bpjs_kesehatan' => sprintf('0000123456%d', 780 + $i),
                'no_bpjs_ketenagakerjaan' => sprintf('0001234567%d', 890 + $i),
                'status_ptkp' => 'TK/0',
                'status' => 'aktif',
            ]));
            $karyawanIds[$data['nama']] = $karyawan->id;
        }

        // ─────────────────────────── CUTI ───────────────────────────
        Cuti::create([
            'karyawan_id' => $karyawanIds['Koordinator GCS'],
            'tipe' => 'tahunan',
            'tanggal_mulai' => now()->addDays(10)->toDateString(),
            'tanggal_selesai' => now()->addDays(11)->toDateString(),
            'status' => 'disetujui',
            'disetujui_oleh' => $owner->id,
            'catatan' => 'Cuti tahunan.',
        ]);

        Cuti::create([
            'karyawan_id' => $karyawanIds['Rudi Hartono'],
            'tipe' => 'sakit',
            'tanggal_mulai' => now()->subDays(2)->toDateString(),
            'tanggal_selesai' => now()->subDay()->toDateString(),
            'status' => 'diajukan',
            'disetujui_oleh' => null,
            'catatan' => 'Sakit demam.',
        ]);

        Cuti::create([
            'karyawan_id' => $karyawanIds['Agus Salim'],
            'tipe' => 'izin',
            'tanggal_mulai' => now()->addDays(2)->toDateString(),
            'tanggal_selesai' => now()->addDays(2)->toDateString(),
            'status' => 'disetujui',
            'disetujui_oleh' => $owner->id,
            'catatan' => 'Izin keperluan keluarga.',
        ]);

        Cuti::create([
            'karyawan_id' => $karyawanIds['Bambang Setiawan'],
            'tipe' => 'tahunan',
            'tanggal_mulai' => now()->addDays(5)->toDateString(),
            'tanggal_selesai' => now()->addDays(9)->toDateString(),
            'status' => 'diajukan',
            'disetujui_oleh' => null,
            'catatan' => 'Cuti tahunan 5 hari.',
        ]);

        Cuti::create([
            'karyawan_id' => $karyawanIds['Slamet Riyadi'],
            'tipe' => 'tanpa_keterangan',
            'tanggal_mulai' => now()->subDays(4)->toDateString(),
            'tanggal_selesai' => now()->subDays(4)->toDateString(),
            'status' => 'ditolak',
            'disetujui_oleh' => $owner->id,
            'catatan' => 'Tanpa keterangan, tidak disetujui.',
        ]);

        // ─────────────── PENUGASAN KARYAWAN KE TITIK ────────────────
        $titikLahanBlokA = Titik::where('nama', 'Lahan Blok A')->firstOrFail();
        $titikTambang = Titik::where('nama', 'Lokasi Tambang')->firstOrFail();
        $titikPlantCbp = Titik::where('nama', 'Plant CBP')->firstOrFail();
        $titikPlantAmp = Titik::where('nama', 'Plant AMP')->firstOrFail();
        $titikBendungan = Titik::where('nama', 'Lokasi Bendungan')->firstOrFail();
        $titikKantor = Titik::where('nama', 'Kantor Pusat')->firstOrFail();

        $assignments = [
            ['Rudi Hartono', $titikLahanBlokA->id],
            ['Joko Susilo', $titikTambang->id],
            ['Agus Salim', $titikPlantCbp->id],
            ['Hendra Wijaya', $titikPlantAmp->id],
            ['Slamet Riyadi', $titikBendungan->id],
            ['Bambang Setiawan', $titikTambang->id],
            ['Dedi Kurniawan', $titikPlantCbp->id],
            ['Andi Firmansyah', $titikPlantAmp->id],
            ['Siti Aminah', $titikPlantCbp->id],
            ['Yanto Operator', $titikTambang->id],
            ['Koordinator GCS', $titikLahanBlokA->id],
            ['Wahyu Nugroho', $titikBendungan->id],
        ];

        foreach ($assignments as $i => [$nama, $titikId]) {
            KaryawanTitikAssignment::create([
                'karyawan_id' => $karyawanIds[$nama],
                'titik_id' => $titikId,
                'tanggal_mulai' => now()->subDays(30 + $i * 10)->toDateString(),
                'tanggal_selesai' => null,
                'status' => 'aktif',
            ]);
        }

        // Assignment historis yang sudah selesai (untuk demo histori)
        KaryawanTitikAssignment::create([
            'karyawan_id' => $karyawanIds['Rudi Hartono'],
            'titik_id' => $titikKantor->id,
            'tanggal_mulai' => now()->subDays(90)->toDateString(),
            'tanggal_selesai' => now()->subDays(31)->toDateString(),
            'status' => 'selesai',
        ]);

        // ─────────────────────── PAYROLL (DEMO) ───────────────────────
        $bulan = now()->month;
        $tahun = now()->year;

        $periode1 = GajiPeriode::create([
            'karyawan_id' => $karyawanIds['Koordinator GCS'],
            'periode_bulan' => $bulan,
            'periode_tahun' => $tahun,
            'jumlah_hadir' => 22,
            'total_gaji' => 9_415_000,
            'status' => 'draft',
            'tanggal_dibayar' => null,
            'akun_kas_bank_id' => null,
        ]);
        KomponenGaji::create(['gaji_periode_id' => $periode1->id, 'jenis' => 'gaji_pokok', 'jumlah' => 8_500_000, 'keterangan' => 'Gaji pokok']);
        KomponenGaji::create(['gaji_periode_id' => $periode1->id, 'jenis' => 'tunjangan', 'jumlah' => 1_000_000, 'keterangan' => 'Tunjangan transport']);
        KomponenGaji::create(['gaji_periode_id' => $periode1->id, 'jenis' => 'bpjs_kesehatan_potongan', 'jumlah' => 85_000, 'keterangan' => 'Potongan BPJS']);

        $periode2 = GajiPeriode::create([
            'karyawan_id' => $karyawanIds['Rudi Hartono'],
            'periode_bulan' => $bulan,
            'periode_tahun' => $tahun,
            'jumlah_hadir' => 20,
            'total_gaji' => 3_000_000,
            'status' => 'dibayar',
            'tanggal_dibayar' => now()->subDays(3)->toDateString(),
            'akun_kas_bank_id' => null,
        ]);
        KomponenGaji::create(['gaji_periode_id' => $periode2->id, 'jenis' => 'gaji_pokok', 'jumlah' => 3_000_000, 'keterangan' => '20 hari x 150.000']);

        $periode3 = GajiPeriode::create([
            'karyawan_id' => $karyawanIds['Dedi Kurniawan'],
            'periode_bulan' => $bulan,
            'periode_tahun' => $tahun,
            'jumlah_hadir' => 22,
            'total_gaji' => 7_480_000,
            'status' => 'dibayar',
            'tanggal_dibayar' => now()->subDays(3)->toDateString(),
            'akun_kas_bank_id' => null,
        ]);
        KomponenGaji::create(['gaji_periode_id' => $periode3->id, 'jenis' => 'gaji_pokok', 'jumlah' => 6_800_000, 'keterangan' => 'Gaji pokok']);
        KomponenGaji::create(['gaji_periode_id' => $periode3->id, 'jenis' => 'tunjangan', 'jumlah' => 800_000, 'keterangan' => 'Tunjangan makan']);
        KomponenGaji::create(['gaji_periode_id' => $periode3->id, 'jenis' => 'bpjs_kesehatan_potongan', 'jumlah' => 68_000, 'keterangan' => 'Potongan BPJS']);
        KomponenGaji::create(['gaji_periode_id' => $periode3->id, 'jenis' => 'pph21_potongan', 'jumlah' => 52_000, 'keterangan' => 'Potongan PPh 21']);

        $periode4 = GajiPeriode::create([
            'karyawan_id' => $karyawanIds['Siti Aminah'],
            'periode_bulan' => $bulan,
            'periode_tahun' => $tahun,
            'jumlah_hadir' => 21,
            'total_gaji' => 6_220_000,
            'status' => 'draft',
            'tanggal_dibayar' => null,
            'akun_kas_bank_id' => null,
        ]);
        KomponenGaji::create(['gaji_periode_id' => $periode4->id, 'jenis' => 'gaji_pokok', 'jumlah' => 5_800_000, 'keterangan' => 'Gaji pokok']);
        KomponenGaji::create(['gaji_periode_id' => $periode4->id, 'jenis' => 'tunjangan', 'jumlah' => 500_000, 'keterangan' => 'Tunjangan transport']);

        $periode5 = GajiPeriode::create([
            'karyawan_id' => $karyawanIds['Budi Santoso'],
            'periode_bulan' => $bulan,
            'periode_tahun' => $tahun,
            'jumlah_hadir' => 22,
            'total_gaji' => 6_130_000,
            'status' => 'dibayar',
            'tanggal_dibayar' => now()->subDays(3)->toDateString(),
            'akun_kas_bank_id' => null,
        ]);
        KomponenGaji::create(['gaji_periode_id' => $periode5->id, 'jenis' => 'gaji_pokok', 'jumlah' => 5_500_000, 'keterangan' => 'Gaji pokok']);
        KomponenGaji::create(['gaji_periode_id' => $periode5->id, 'jenis' => 'insentif', 'jumlah' => 630_000, 'keterangan' => 'Insentif lembur servis']);

        $periode6 = GajiPeriode::create([
            'karyawan_id' => $karyawanIds['Hendra Wijaya'],
            'periode_bulan' => $bulan,
            'periode_tahun' => $tahun,
            'jumlah_hadir' => 22,
            'total_gaji' => 8_050_000,
            'status' => 'draft',
            'tanggal_dibayar' => null,
            'akun_kas_bank_id' => null,
        ]);
        KomponenGaji::create(['gaji_periode_id' => $periode6->id, 'jenis' => 'gaji_pokok', 'jumlah' => 7_500_000, 'keterangan' => 'Gaji pokok']);
        KomponenGaji::create(['gaji_periode_id' => $periode6->id, 'jenis' => 'tunjangan', 'jumlah' => 750_000, 'keterangan' => 'Tunjangan shift']);
    }
}
