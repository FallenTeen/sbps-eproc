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
            ['user_id' => $gcs->id, 'nama' => 'Koordinator GCS', 'tipe' => 'tetap', 'jabatan' => 'Koordinator GCS', 'rate_gaji_pokok' => 8_500_000, 'rate_harian' => null],
            ['user_id' => $driverStandby->id, 'nama' => 'Rudi Hartono', 'tipe' => 'borongan_rit', 'jabatan' => 'Driver Dump Truck', 'rate_gaji_pokok' => null, 'rate_harian' => 150_000],
            ['user_id' => $driverKondisional->id, 'nama' => 'Bambang Setiawan', 'tipe' => 'borongan_rit', 'jabatan' => 'Driver Kondisional', 'rate_gaji_pokok' => null, 'rate_harian' => 150_000],
            ['user_id' => $mandorTitik->id, 'nama' => 'Joko Susilo', 'tipe' => 'harian', 'jabatan' => 'Mandor Titik', 'rate_gaji_pokok' => null, 'rate_harian' => 175_000],
            ['user_id' => $cbp->id, 'nama' => 'Agus Salim', 'tipe' => 'tetap', 'jabatan' => 'Operator Batching Plant', 'rate_gaji_pokok' => 7_000_000, 'rate_harian' => null],
            ['user_id' => $amp->id, 'nama' => 'Hendra Wijaya', 'tipe' => 'tetap', 'jabatan' => 'Operator AMP', 'rate_gaji_pokok' => 7_500_000, 'rate_harian' => null],
            ['user_id' => null, 'nama' => 'Slamet Riyadi', 'tipe' => 'borongan_rit', 'jabatan' => 'Driver Dump Truck', 'rate_gaji_pokok' => null, 'rate_harian' => 150_000],
            ['user_id' => null, 'nama' => 'Yanto Operator', 'tipe' => 'harian', 'jabatan' => 'Operator Excavator', 'rate_gaji_pokok' => null, 'rate_harian' => 200_000],
            ['user_id' => null, 'nama' => 'Dedi Kurniawan', 'tipe' => 'tetap', 'jabatan' => 'Operator Batching Plant', 'rate_gaji_pokok' => 6_800_000, 'rate_harian' => null],
            ['user_id' => null, 'nama' => 'Andi Firmansyah', 'tipe' => 'tetap', 'jabatan' => 'Operator AMP', 'rate_gaji_pokok' => 7_200_000, 'rate_harian' => null],
        ];

        $karyawanIds = [];
        foreach ($karyawans as $data) {
            $karyawan = Karyawan::updateOrCreate(['nama' => $data['nama']], array_merge($data, [
                'npwp' => '12.345.678.9-001.000',
                'no_bpjs_kesehatan' => '0000123456789',
                'no_bpjs_ketenagakerjaan' => '0001234567890',
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

        // ─────────────── PENUGASAN KARYAWAN KE TITIK ────────────────
        $titikLahanBlokA = Titik::where('nama', 'Lahan Blok A')->firstOrFail();
        $titikTambang = Titik::where('nama', 'Lokasi Tambang')->firstOrFail();
        $titikPlantCbp = Titik::where('nama', 'Plant CBP')->firstOrFail();

        KaryawanTitikAssignment::create([
            'karyawan_id' => $karyawanIds['Rudi Hartono'],
            'titik_id' => $titikLahanBlokA->id,
            'tanggal_mulai' => now()->subDays(30)->toDateString(),
            'tanggal_selesai' => null,
            'status' => 'aktif',
        ]);

        KaryawanTitikAssignment::create([
            'karyawan_id' => $karyawanIds['Joko Susilo'],
            'titik_id' => $titikTambang->id,
            'tanggal_mulai' => now()->subDays(60)->toDateString(),
            'tanggal_selesai' => null,
            'status' => 'aktif',
        ]);

        KaryawanTitikAssignment::create([
            'karyawan_id' => $karyawanIds['Agus Salim'],
            'titik_id' => $titikPlantCbp->id,
            'tanggal_mulai' => now()->subDays(90)->toDateString(),
            'tanggal_selesai' => null,
            'status' => 'aktif',
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
    }
}
