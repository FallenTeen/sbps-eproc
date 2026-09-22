<?php

namespace Database\Seeders;

use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class AttendanceDataSeeder extends Seeder
{
    use StagingOnly;

    /**
     * Roster karyawan yang demo "monitoring karyawan": nama => nama titik absen.
     * Koordinat titik diambil langsung dari tabel titiks.
     */
    private function roster(): array
    {
        return [
            'Koordinator GCS' => 'Lahan Blok A',
            'Rudi Hartono' => 'Lahan Blok A',
            'Bambang Setiawan' => 'Lokasi Tambang',
            'Joko Susilo' => 'Lokasi Tambang',
            'Agus Salim' => 'Plant CBP',
            'Hendra Wijaya' => 'Plant AMP',
            'Slamet Riyadi' => 'Lokasi Bendungan',
            'Yanto Operator' => 'Lokasi Tambang',
            'Dedi Kurniawan' => 'Plant CBP',
            'Andi Firmansyah' => 'Plant AMP',
            'Siti Aminah' => 'Plant CBP',
            'Budi Santoso' => 'Lahan Blok A',
            'Eko Prasetyo' => 'Plant CBP',
            'Wahyu Nugroho' => 'Lokasi Bendungan',
        ];
    }

    public function run(): void
    {
        $this->assertNotProduction();

        foreach ($this->roster() as $namaKaryawan => $namaTitik) {
            $this->seedPresensiForKaryawan($namaKaryawan, $namaTitik);
        }

        $this->seedFormulirLapangan();
    }

    private function seedPresensiForKaryawan(string $namaKaryawan, string $namaTitik): void
    {
        $karyawan = Karyawan::where('nama', $namaKaryawan)->firstOrFail();
        $titik = Titik::where('nama', $namaTitik)->first();

        // Hash stabil per karyawan agar pola hadir/tidak-hadir tetap deterministik.
        $hash = crc32($namaKaryawan);

        $days = range(0, 13);
        foreach ($days as $dayIndex) {
            $tanggal = now()->subDays(13 - $dayIndex)->startOfDay();

            // Aturan sederhana: libur jika (dayIndex + hash) habis dibagi 9.
            if (($dayIndex + $hash) % 9 === 0) {
                continue;
            }

            // Hari ini: sebagian karyawan masih bekerja (check_out masih null).
            $isToday = $dayIndex === 13;
            $masihBekerja = $isToday && ($dayIndex + $hash) % 3 === 0;

            $checkInMinutes = 6 * 60 + 5 + (($dayIndex * 7 + $hash) % 50);
            $checkOutMinutes = 15 * 60 + 30 + (($dayIndex * 13 + $hash) % 120);

            // Posisi absen: dekat koordinat titik => valid.
            // Offset besar => luar_radius.
            $luarRadius = ($dayIndex + ceil($hash / 97)) % 25 === 0;
            $tidakValid = $dayIndex === 4 && $hash % 11 === 0;

            $lat = $titik?->latitude ?? -6.2;
            $lng = $titik?->longitude ?? 107.0;
            $offset = $luarRadius ? (0.012 + ($hash % 50) / 10000) : (($hash % 9) - 4) / 100000;

            $statusValidasi = $tidakValid ? 'tidak_valid' : ($luarRadius ? 'luar_radius' : 'valid');

            $presensi = Presensi::create([
                'karyawan_id' => $karyawan->id,
                'titik_id' => $tidakValid ? null : ($titik?->id ?? null),
                'check_in' => $tanggal->copy()->addMinutes($checkInMinutes),
                'check_in_lat' => round($lat + $offset, 7),
                'check_in_lng' => round($lng + $offset * 2, 7),
                'check_out' => $masihBekerja ? null : $tanggal->copy()->addMinutes($checkOutMinutes),
                'check_out_lat' => $masihBekerja ? null : round($lat + $offset / 2, 7),
                'check_out_lng' => $masihBekerja ? null : round($lng + $offset, 7),
                'status_validasi' => $statusValidasi,
                'catatan_override' => $tidakValid ? 'Absen tanpa titik / di luar lokasi kerja.' : null,
            ]);

            // Beberapa presensi punya catatan review dari koordinator.
            if ($statusValidasi === 'luar_radius' && ($dayIndex + $hash) % 2 === 0) {
                $presensi->update(['catatan_override' => 'Patroli area luar radius, tetap dianggap hadir.']);
            }
        }
    }

    private function seedFormulirLapangan(): void
    {
        $formulirData = [
            ['Rudi Hartono', 2, 'Kondisi area baik, cuaca cerah.', 'Pendampingan loading pasir & pengecekan rutin unit.', 'Kerusakan minor pada bucket excavator.', 'Dilaporkan ke mekanik.'],
            ['Rudi Hartono', 5, 'Debu tinggi saat loading.', 'Pengaturan antrian dump truck di area stockpile.', null, null],
            ['Rudi Hartono', 9, 'Hujan ringan pagi hari.', 'Monitoring pemadatan tanah Blok A.', null, 'Progres pemadatan 78%.'],
            ['Joko Susilo', 1, 'Lokasi tambang aktif beroperasi.', 'Koordinasi pengeboran & peledakan area 2.', 'Gerobak angkut perlu perbaikan.', null],
            ['Joko Susilo', 6, 'Cuaca cerah, aman beroperasi.', 'Supervisi loading material ke dump truck.', null, 'Produksi 45 rit.'],
            ['Joko Susilo', 11, 'Aman terkendali.', 'Pengecekan alat berat & rotasi operator.', 'Loader GCS-03 oli remb.', 'Diagendakan servis.'],
            ['Agus Salim', 3, 'Plant beroperasi normal.', 'Pengecekan mesin batching & silo semen.', null, null],
            ['Siti Aminah', 3, 'Lab QC bersih.', 'Uji slump beton K-300 & pembuatan sample uji tekan.', null, 'Slump 12 cm sesuai spesifikasi.'],
            ['Siti Aminah', 8, 'Normal.', 'Uji kuat tekan sample K-225 usia 7 hari.', null, 'Hasil 18 MPa.'],
            ['Budi Santoso', 2, 'Bengkel rapi.', 'Servis berkala DT 03 (ganti oli & filter).', 'Filter lama kotor parah.', null],
            ['Budi Santoso', 7, 'CUaca panas.', 'Perbaikan kampas rem TM 01 C.', null, 'Unit selesai & siap operasi.'],
            ['Hendra Wijaya', 4, 'Plant AMP normal.', 'Pemanasan burner & produksi hotmix AC-WC.', null, 'Produksi 80 ton.'],
            ['Koordinator GCS', 1, 'Area proyek aktif.', 'Kunjungan lapangan Blok A & rapat progres mingguan.', null, null],
            ['Wahyu Nugroho', 5, 'Normal.', 'Membantu loading material di lokasi bendungan.', null, null],
        ];

        foreach ($formulirData as [$namaKaryawan, $hariLalu, $kondisi, $aktivitas, $kendala, $catatan]) {
            $karyawan = Karyawan::where('nama', $namaKaryawan)->first();
            $tanggal = now()->subDays($hariLalu)->startOfDay();

            $presensi = Presensi::where('karyawan_id', $karyawan?->id)
                ->whereDate('check_in', $tanggal)
                ->first();

            if (! $presensi) {
                continue;
            }

            FormulirLapangan::create([
                'presensi_id' => $presensi->id,
                'kondisi_area' => $kondisi,
                'aktivitas_dilakukan' => $aktivitas,
                'kendala' => $kendala,
                'foto' => null,
                'catatan_tambahan' => $catatan,
            ]);
        }
    }
}
