<?php

namespace Database\Seeders;

use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Data absensi (presensi) demo untuk staging.
 *
 * Mencakup kasus fitur baru §24 — aturan: SATU kasus, SATU karyawan,
 * deterministik (crc32 + konstanta nama, tanpa rand):
 *
 *  1. Flag check-out radius (BK-1): `check_out_status` valid / luar_radius
 *     / null bebas dari `status_validasi`:
 *     - Bambang Setiawan  : check-in valid, check-out jauh  -> flag
 *                           luar_radius, status tetap valid (dua bendera).
 *     - Joko Susilo       : check-in jauh, check-out dekat  -> status
 *                           luar_radius, flag checkout valid.
 *     - Eko Prasetyo      : tanpa titik (titik_id null)     -> flag null.
 *     2. Durasi lembur (BK-5), HANYA hari ini:
 *     - Koordinator GCS   : 07:00-15:30 tepat 8j30m  -> lembur 0.
 *     - Andi Firmansyah   : 07:00-15:31 8j31m        -> lembur 30 mnt.
 *     - Siti Aminah       : 06:30-15:40 9j10m        -> lembur 60 mnt.
 *     - Wahyu Nugroho     : shift malam 22:00-06:30 (durasi absolut
 *                           8j30m, presensi 36 jam).
 *  3. Tracking presensi hari ini (BK-7/BK-9), presensi hari ini dipaksa
 *     terbuka bila belum ada:
 *     - Rudi Hartono      : jejak normal tiap 25 menit (±19 titik).
 *     - Slamet Riyadi     : jejak 25 menit DENGAN jeda kosong 10:00-10:45
 *                           (gap >= 30 mnt: chip gap + garis putus).
 *     - Budi Santoso      : jejak padat tiap 5 menit (demo bucket).
 *
 * Idempoten untuk tracking (guard per karyawan-hari); presensi generik
 * mengikuti perilaku lama (dijalankan sekali setelah CleanDataSeeder).
 */
class AttendanceDataSeeder extends Seeder
{
    use StagingOnly;

    // ── Kasus flag check-out (BK-1) ──────────────────────────────────────
    private const CHECKOUT_LUAR_RADIUS = 'Bambang Setiawan';

    private const CHECKIN_LUAR_CHECKOUT_VALID = 'Joko Susilo';

    private const TANPA_TITIK = 'Eko Prasetyo';

    // ── Kasus durasi lembur (BK-5) ──────────────────────────────────────
    private const LEMBUR_TEPAT_8J30 = 'Koordinator GCS';

    private const LEMBUR_8J31 = 'Andi Firmansyah';

    private const LEMBUR_9J10 = 'Siti Aminah';

    private const SHIFT_MALAM = 'Wahyu Nugroho';

    // ── Kasus tracking presensi hari ini ─────────────────────────────────
    private const TRACKING_NORMAL = 'Rudi Hartono';

    private const TRACKING_GAP = 'Slamet Riyadi';

    private const TRACKING_PADAT = 'Budi Santoso';

    /** Hari (indeks 0..13) kasus dua-arah flag dijalankan. */
    private const HARI_CHECKOUT_LUAR = 9;

    private const HARI_CHECKIN_LUAR = 7;

    /** Jendela gap tracking (jam:menit, hanya titik yang disimpan). */
    private const GAP_AWAL = '10:00';

    private const GAP_AKHIR = '10:45';

    /** Penanda baris hasil seeder ini (memudahkan verifikasi/cleanup). */
    private const DEVICE_ID = 'seeder-attendance';

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
            if ($namaKaryawan === self::SHIFT_MALAM) {
                continue; // dibuat khusus lewat seedShiftMalam().
            }

            $this->seedPresensiForKaryawan($namaKaryawan, $namaTitik);
        }

        $this->seedShiftMalam();
        $this->seedTrackingHariIni();
        $this->seedFormulirLapangan();
    }

    /**
     * Jadwal durasi lembur hari ini (BK-5): nama => [jam check-in, jam
     * check-out] — dipaksa tanpa aturan libur/kemauan hari.
     */
    private function lemburHariIni(): array
    {
        return [
            self::LEMBUR_TEPAT_8J30 => ['07:00', '15:30'],
            self::LEMBUR_8J31 => ['07:00', '15:31'],
            self::LEMBUR_9J10 => ['06:30', '15:40'],
        ];
    }

    private function seedPresensiForKaryawan(string $namaKaryawan, string $namaTitik): void
    {
        $karyawan = Karyawan::where('nama', $namaKaryawan)->firstOrFail();
        $titik = Titik::where('nama', $namaTitik)->first();

        // Hash stabil per karyawan agar pola hadir/tidak-hadir tetap deterministik.
        $hash = crc32($namaKaryawan);

        $tanpaTitik = $namaKaryawan === self::TANPA_TITIK;
        $jadwalLembur = $this->lemburHariIni();
        $kasusLembur = $jadwalLembur[$namaKaryawan] ?? null;
        $kasusTracking = in_array($namaKaryawan, [
            self::TRACKING_NORMAL,
            self::TRACKING_GAP,
            self::TRACKING_PADAT,
        ], true);
        $hariIniDipaksa = $kasusLembur !== null || $kasusTracking || $tanpaTitik;

        $days = range(0, 13);
        foreach ($days as $dayIndex) {
            $tanggal = now()->subDays(13 - $dayIndex)->startOfDay();
            $isToday = $dayIndex === 13;

            // Libur (tidak kena hari paksa kasus fitur).
            if (! ($isToday && $hariIniDipaksa) && ($dayIndex + $hash) % 9 === 0) {
                continue;
            }

            // ── Kasus lembur hari ini: durasi dikunci 100% ─────────────────
            if ($isToday && $kasusLembur !== null) {
                [$jamIn, $jamOut] = $kasusLembur;
                $this->createPresensi($karyawan, $titik, [
                    'check_in' => Carbon::parse($tanggal->toDateString() . ' ' . $jamIn),
                    'check_out' => Carbon::parse($tanggal->toDateString() . ' ' . $jamOut),
                    'offset_dekat' => (($hash % 9) - 4) / 100000,
                    'status_validasi' => 'valid',
                    'check_out_status' => 'valid',
                ]);
                continue;
            }

            // ── Kasus tracking hari ini: presensi dipaksa terbuka ──────────
            if ($isToday && $kasusTracking) {
                $this->createPresensi($karyawan, $titik, [
                    'check_in' => Carbon::parse($tanggal->toDateString() . ' 07:00'),
                    'check_out' => null,
                    'offset_dekat' => (($hash % 9) - 4) / 100000,
                    'status_validasi' => 'valid',
                    'check_out_status' => null,
                ]);
                continue;
            }

            // Hari ini: sebagian karyawan masih bekerja (check_out masih null).
            $masihBekerja = $isToday && ($dayIndex + $hash) % 3 === 0 && ! $tanpaTitik;

            $checkInMinutes = 6 * 60 + 5 + (($dayIndex * 7 + $hash) % 50);
            $checkOutMinutes = 15 * 60 + 30 + (($dayIndex * 13 + $hash) % 120);

            // Posisi absen: BERSIFAT PER-HARI, flag dua arah:
            //   - dekat titik +/-offset kecil, jauh (0.012 derajat ~ 1.3 km).
            //   - check-in jauh -> status_validasi luar_radius (Aturan lama).
            //   - check-out jauh -> check_out_status luar_radius TANPA
            //     mengubah status_validasi (BK-1).
            $luarIn = ($dayIndex + ceil($hash / 97)) % 25 === 0;
            $luarOut = ($dayIndex + 23 + ceil($hash / 131)) % 41 === 0 && ! $tanpaTitik;
            $tidakValid = $dayIndex === 4 && $hash % 11 === 0;

            // Kasus flag dua arah, terkunci per karyawan + hari (bukan % race).
            if ($dayIndex === self::HARI_CHECKOUT_LUAR && $namaKaryawan === self::CHECKOUT_LUAR_RADIUS) {
                $luarIn = false;
                $luarOut = true;
                $tidakValid = false;
            }

            if ($dayIndex === self::HARI_CHECKIN_LUAR && $namaKaryawan === self::CHECKIN_LUAR_CHECKOUT_VALID) {
                $luarIn = true;
                $luarOut = false;
                $tidakValid = false;
            }

            $offsetDekat = (($hash % 9) - 4) / 100000;
            $offsetJauh = 0.012 + ($hash % 50) / 10000;

            $lat = $titik?->latitude ?? -6.2;
            $lng = $titik?->longitude ?? 107.0;

            $checkInLat = round($lat + ($luarIn ? $offsetJauh : $offsetDekat), 7);
            $checkInLng = round($lng + ($luarIn ? $offsetJauh * 2 : $offsetDekat * 2), 7);
            $checkOutLat = $masihBekerja ? null : round($lat + ($luarOut ? $offsetJauh : $offsetDekat / 2), 7);
            $checkOutLng = $masihBekerja ? null : round($lng + ($luarOut ? $offsetJauh : $offsetDekat), 7);

            $statusValidasi = $tidakValid ? 'tidak_valid' : ($luarIn ? 'luar_radius' : 'valid');
            $checkOutStatus = $masihBekerja || $tidakValid || $tanpaTitik
                ? null
                : ($luarOut ? 'luar_radius' : 'valid');

            $presensi = Presensi::create([
                'karyawan_id' => $karyawan->id,
                'titik_id' => ($tidakValid || $tanpaTitik) ? null : ($titik?->id ?? null),
                'check_in' => $tanggal->copy()->addMinutes($checkInMinutes),
                'check_in_lat' => $checkInLat,
                'check_in_lng' => $checkInLng,
                'check_out' => $masihBekerja ? null : $tanggal->copy()->addMinutes($checkOutMinutes),
                'check_out_lat' => $checkOutLat,
                'check_out_lng' => $checkOutLng,
                'status_validasi' => $statusValidasi,
                'check_out_status' => $checkOutStatus,
                'catatan_override' => $tidakValid ? 'Absen tanpa titik / di luar lokasi kerja.' : null,
                'device_id' => self::DEVICE_ID,
            ]);

            // Beberapa presensi punya catatan review dari koordinator.
            if ($statusValidasi === 'luar_radius' && ($dayIndex + $hash) % 2 === 0) {
                $presensi->update(['catatan_override' => 'Patroli area luar radius, tetap dianggap hadir.']);
            }
        }
    }

    /**
     * Kasus shift malam (BK-5/wajib-uji 4-6): check-in 22:00 tiga hari lalu
     * -> check-out 06:30 dua hari lalu. Durasi absolut 8j30m -> lembur 0;
     * presensi berada dalam window query 36 jam server.
     */
    private function seedShiftMalam(): void
    {
        $karyawan = Karyawan::where('nama', self::SHIFT_MALAM)->first();
        if (! $karyawan) {
            return;
        }

        $titik = Titik::where('nama', $this->roster()[self::SHIFT_MALAM])->first();

        $checkIn = now()->subDays(3)->setTime(22, 0);
        if (Presensi::where('karyawan_id', $karyawan->id)->where('check_in', $checkIn)->exists()) {
            return;
        }

        $lat = $titik?->latitude ?? -6.2;
        $lng = $titik?->longitude ?? 107.0;
        $offset = ((crc32(self::SHIFT_MALAM) % 9) - 4) / 100000;

        $this->createPresensi($karyawan, $titik, [
            'check_in' => $checkIn,
            'check_out' => now()->subDays(2)->setTime(6, 30),
            'offset_dekat' => $offset,
            'status_validasi' => 'valid',
            'check_out_status' => 'valid',
        ]);
    }

    /**
     * Kasus tracking presensi hari ini (BK-7/BK-9): 1 kasus : 1 karyawan.
     *
     * - Rudi  : jejak normal tiap 25 menit (teladan demo lama MobileDemo).
     * - Slamet: jejak 25 menit TETAPI 10:00-10:45 sengaja kosong (gap
     *           >= 30 mnt -> chip gap + garis putus di map).
     * - Budi  : jejak padat tiap 5 menit (uji bucket 5/10 menit).
     *
     * Semua titik terhubung presensi_id hari ini (dipaksa terbuka bila
     * belum ada). Idempoten: bila karyawan sudah punya titik hari ini,
     * dilewati.
     */
    private function seedTrackingHariIni(): void
    {
        $kasus = [
            self::TRACKING_NORMAL => ['menit' => 25, 'gap' => false],
            self::TRACKING_GAP => ['menit' => 25, 'gap' => true],
            self::TRACKING_PADAT => ['menit' => 5, 'gap' => false],
        ];

        foreach ($kasus as $nama => $cfg) {
            $karyawan = Karyawan::where('nama', $nama)->first();
            if (! $karyawan) {
                continue;
            }

            $presensi = Presensi::where('karyawan_id', $karyawan->id)
                ->whereDate('check_in', now()->toDateString())
                ->first();

            if (! $presensi) {
                continue;
            }

            $already = MobileTrackingLocation::where('karyawan_id', $karyawan->id)
                ->whereDate('recorded_at', now()->toDateString())
                ->exists();
            if ($already) {
                continue;
            }

            $lat = (float) ($presensi->check_in_lat ?? -6.2);
            $lng = (float) ($presensi->check_in_lng ?? 107.0);
            $start = $presensi->check_in->copy();
            $akhir = $presensi->check_out ?? now();
            $gapStart = now()->startOfDay()->addMinutes(
                (int) explode(':', self::GAP_AWAL)[0] * 60 + (int) explode(':', self::GAP_AWAL)[1]
            );
            $gapEnd = now()->startOfDay()->addMinutes(
                (int) explode(':', self::GAP_AKHIR)[0] * 60 + (int) explode(':', self::GAP_AKHIR)[1]
            );

            $offset = 0.0;
            for ($t = $start->copy(); $t->lte($akhir); $t->addMinutes($cfg['menit'])) {
                if ($cfg['gap'] && $t->gte($gapStart) && $t->lt($gapEnd)) {
                    continue; // jeda kosong - pasar kasus gap.
                }

                $offset += 0.00002 * (($t->minute % 10 < 5) ? 1 : -1);

                MobileTrackingLocation::create([
                    'karyawan_id' => $karyawan->id,
                    'presensi_id' => $presensi->id,
                    'latitude' => round($lat + $offset, 7),
                    'longitude' => round($lng + $offset * 0.5, 7),
                    'recorded_at' => $t->copy(),
                ]);
            }
        }
    }

    /**
     * Buat satu baris presensi dengan offset koordinat relatif titik.
     *
     * @param  array{
     *     check_in: Carbon,
     *     check_out: ?Carbon,
     *     offset_dekat: float,
     *     status_validasi: string,
     *     check_out_status: ?string,
     * }  $a
     */
    private function createPresensi(Karyawan $karyawan, ?Titik $titik, array $a): Presensi
    {
        $lat = $titik?->latitude ?? -6.2;
        $lng = $titik?->longitude ?? 107.0;
        $o = $a['offset_dekat'];

        return Presensi::create([
            'karyawan_id' => $karyawan->id,
            'titik_id' => $titik?->id ?? null,
            'check_in' => $a['check_in'],
            'check_in_lat' => round($lat + $o, 7),
            'check_in_lng' => round($lng + $o * 2, 7),
            'check_out' => $a['check_out'],
            'check_out_lat' => $a['check_out'] !== null ? round($lat + $o / 2, 7) : null,
            'check_out_lng' => $a['check_out'] !== null ? round($lng + $o, 7) : null,
            'status_validasi' => $a['status_validasi'],
            'check_out_status' => $a['check_out_status'],
            'catatan_override' => null,
            'device_id' => self::DEVICE_ID,
        ]);
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