<?php

namespace Database\Seeders;

use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Seeder;

class AttendanceDataSeeder extends Seeder
{
    public function run(): void
    {
        $titikBlokA = Titik::where('nama', 'Lahan Blok A')->firstOrFail();
        $titikTambang = Titik::where('nama', 'Lokasi Tambang')->firstOrFail();
        $titikBendungan = Titik::where('nama', 'Lokasi Bendungan')->firstOrFail();

        $driverStandby = Karyawan::where('nama', 'Rudi Hartono')->firstOrFail();
        $driverKondisional = Karyawan::where('nama', 'Bambang Setiawan')->firstOrFail();
        $koordinator = Karyawan::where('nama', 'Koordinator GCS')->firstOrFail();

        $presensi1 = Presensi::create([
            'karyawan_id' => $driverStandby->id,
            'titik_id' => $titikBlokA->id,
            'check_in' => now()->startOfDay()->addHours(7)->addMinutes(5),
            'check_in_lat' => -6.2435,
            'check_in_lng' => 107.1525,
            'check_out' => now()->startOfDay()->addHours(16)->addMinutes(10),
            'check_out_lat' => -6.2434,
            'check_out_lng' => 107.1524,
            'status_validasi' => 'valid',
            'catatan_override' => null,
        ]);

        Presensi::create([
            'karyawan_id' => $driverKondisional->id,
            'titik_id' => $titikTambang->id,
            'check_in' => now()->startOfDay()->addHours(6)->addMinutes(55),
            'check_in_lat' => -6.5985,
            'check_in_lng' => 106.8065,
            'check_out' => now()->startOfDay()->addHours(16)->addMinutes(5),
            'check_out_lat' => -6.5984,
            'check_out_lng' => 106.8064,
            'status_validasi' => 'valid',
            'catatan_override' => null,
        ]);

        Presensi::create([
            'karyawan_id' => $koordinator->id,
            'titik_id' => $titikBendungan->id,
            'check_in' => now()->startOfDay()->addHours(6)->addMinutes(30),
            'check_in_lat' => -6.6018,
            'check_in_lng' => 106.8030,
            'check_out' => null,
            'check_out_lat' => null,
            'check_out_lng' => null,
            'status_validasi' => 'valid',
            'catatan_override' => null,
        ]);

        FormulirLapangan::create([
            'presensi_id' => $presensi1->id,
            'kondisi_area' => 'Kondisi area baik, cuaca cerah.',
            'aktivitas_dilakukan' => 'Pendampingan loading pasir & pengecekan rutin unit.',
            'kendala' => null,
            'foto' => null,
            'catatan_tambahan' => 'Belum ada temuan yang perlu dilaporkan.',
        ]);
    }
}
