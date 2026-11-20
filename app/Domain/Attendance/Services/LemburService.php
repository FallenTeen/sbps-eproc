<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Models\Presensi;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Support\Collection;

/**
 * Hitung lembur (BK-3..BK-5) per KARYAWAN-HARI.
 *
 * Aturan: window = check-in TERAWAL s/d check-out TERAKHIR hari itu
 * (hanya presensi status_validasi "valid" yang punya check_out), kemudian
 * melebihi threshold (default 8j30m) dibulatkan KE ATAS per 30 mnt.
 * Ini mencegah dobel lembur bila karyawan check-out lalu check-in lagi.
 */
class LemburService
{
    /**
     * @param  int  $bulan  1-12
     * @param  int  $tahun
     * @return Collection<string, array{tanggal: string, menit: int, jam_tarif_menit: int}> keyed by tanggal
     */
    public function lemburPerTanggal(string $karyawanId, int $bulan, int $tahun): Collection
    {
        $presensis = Presensi::query()
            ->where('karyawan_id', $karyawanId)
            ->where('status_validasi', 'valid')
            ->whereNotNull('check_out')
            ->whereMonth('check_in', $bulan)
            ->whereYear('check_in', $tahun)
            ->get();

        return $this->hitungPerTanggal($presensis);
    }

    /**
     * @param  iterable<Presensi>  $presensis
     * @return Collection<string, array{tanggal: string, menit: int}>
     */
    public function hitungPerTanggal(iterable $presensis): Collection
    {
        $threshold = (int) config('attendance.lembur.threshold_menit', 510);
        $pembulatan = max(1, (int) config('attendance.lembur.pembulatan_menit', 30));

        $perTanggal = collect();

        foreach ($presensis as $p) {
            if (! $p->check_in || ! $p->check_out || $p->status_validasi !== 'valid') {
                continue;
            }

            $tanggal = $p->check_in->toDateString();
            $first = $perTanggal->get($tanggal);

            $start = $first['start'] ?? $p->check_in;
            $end = $first['end'] ?? $p->check_out;

            $perTanggal->put($tanggal, [
                'start' => $p->check_in->lt($start) ? $p->check_in : $start,
                'end' => $p->check_out->gt($end) ? $p->check_out : $end,
            ]);
        }

        return $perTanggal
            ->map(function (array $w) use ($threshold, $pembulatan) {
                $durasi = (int) $w['start']->diffInMinutes($w['end']);

                if ($durasi <= $threshold) {
                    return ['tanggal' => $w['start']->toDateString(), 'menit' => 0];
                }

                $menit = (int) (ceil(($durasi - $threshold) / $pembulatan) * $pembulatan);

                return ['tanggal' => $w['start']->toDateString(), 'menit' => $menit];
            })
            ->filter(fn (array $r) => $r['menit'] > 0)
            ->values()
            ->keyBy('tanggal');
    }

    /**
     * Tarif lembur SARAN per jam untuk karyawan (harian/tetap) sesuai BK-3.
     */
    public function tarifSaran(Karyawan $karyawan): float
    {
        $cfg = config('attendance.lembur');

        if ($karyawan->tipe === 'tetap') {
            $gaji = (float) ($karyawan->rate_gaji_pokok ?? 0);
            $jam = max(1, (int) ($cfg['tarif_tetap_jam'] ?? 173));

            return round($gaji / $jam * (float) ($cfg['tarif_tetap_faktor'] ?? 1.5), 2);
        }

        $gaji = (float) ($karyawan->rate_harian ?? 0);
        $jam = max(1, (int) ($cfg['tarif_harian_jam'] ?? 7));

        return round($gaji / $jam * (float) ($cfg['tarif_harian_faktor'] ?? 1.5), 2);
    }
}
