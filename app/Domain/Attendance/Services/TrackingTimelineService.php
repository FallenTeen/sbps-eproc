<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use Illuminate\Support\Collection;

/**
 * Bangun linimasa lokasi GPS untuk satu presensi (tampilan web khusus Owner).
 *
 * - Sampling per `bucketMinutes` menit HANYA untuk kepadatan tampilan
 *   (`'all'` = semua titik mentah). Interval GPS di HP tidak diubah.
 * - GAP: rentang jam tanpa titik >= `gap_threshold` menit di antara
 *   check-in..check-out disisipkan sebagai entri `jenis: 'gap'`
 *   ({dari, sampai, durasi_menit}) di posisi kronologisnya. Label web netral
 *   tanpa klaim penyebab (app ditutup / battery-optimizer / GPS mati).
 * - Gap hanya dihasilkan bila ada >=1 titik GPS (raw_count=0 berarti
 *   "tidak ada data GPS", bukan gap - mis. app belum pernah update).
 * - Cap titik tampilan MAX_POINTS supaya payload & Leaflet aman.
 */
class TrackingTimelineService
{
    public const MAX_POINTS = 2000;

    public function forPresensi(Presensi $p, int|string $bucketMinutes = 30, ?int $gapThresholdMinutes = null): array
    {
        $isAll = $bucketMinutes === 'all' || (string) $bucketMinutes === 'all';
        $bucketMinutes = $isAll ? 0 : max(1, (int) $bucketMinutes);
        $gapThreshold = max(
            1,
            (int) ($gapThresholdMinutes ?? config('mobile.tracking.gap_threshold_minutes', 30))
        );

        $locations = MobileTrackingLocation::query()
            ->where('presensi_id', $p->id)
            ->orderBy('recorded_at')
            ->get(['latitude', 'longitude', 'recorded_at']);

        // Fallback: lokasi karyawan dalam rentang check-in..(check-out ?? now).
        if ($locations->isEmpty() && $p->check_in) {
            $locations = MobileTrackingLocation::query()
                ->where('karyawan_id', $p->karyawan_id)
                ->whereBetween('recorded_at', [$p->check_in, $p->check_out ?? now()])
                ->orderBy('recorded_at')
                ->get(['latitude', 'longitude', 'recorded_at']);
        }

        // Lokasi kosong TIDAK langsung return: titik check-in/check-out tetap
        // disisipkan sebagai ujung linimasa supaya peta punya acuan (raw_count
        // tetap 0 sehingga UI tetap jujur menyebut "tanpa GPS").
        if (! $p->check_in) {
            return ['points' => [], 'raw_count' => 0, 'truncated' => false];
        }

        $raw = $locations->filter(fn ($l) => $this->valid($l->latitude, $l->longitude))
            ->filter(fn ($l) => $p->check_in && $l->recorded_at->gte($p->check_in))
            ->filter(fn ($l) => ! $p->check_out || $l->recorded_at->lte($p->check_out))
            ->values();

        $points = $isAll
            ? $raw->map(fn ($loc) => $this->point(
                (float) $loc->latitude,
                (float) $loc->longitude,
                $loc->recorded_at,
                'track'
            ))->all()
            : $this->sample($raw, $bucketMinutes);

        // Titik check-in & check-out selalu disertakan sebagai ujung linimasa.
        if ($this->valid($p->check_in_lat, $p->check_in_lng)) {
            array_unshift($points, $this->point(
                (float) $p->check_in_lat,
                (float) $p->check_in_lng,
                $p->check_in,
                'check_in'
            ));
        }

        if ($p->check_out && $this->valid($p->check_out_lat, $p->check_out_lng)) {
            $points[] = $this->point(
                (float) $p->check_out_lat,
                (float) $p->check_out_lng,
                $p->check_out,
                'check_out'
            );
        }

        usort($points, fn ($a, $b) => strcmp($a['recorded_at'], $b['recorded_at']));

        if ($p->check_out) {
            $points = $this->sisipkanGap($points, $gapThreshold);
        }

        $total = count($points);
        $truncated = $total > self::MAX_POINTS;
        $points = array_slice($points, 0, self::MAX_POINTS);

        return [
            'points' => array_values($points),
            'raw_count' => $locations->count(),
            'truncated' => $truncated,
        ];
    }

    /**
     * Sisipkan entri gap antar titik-titik kronologis yang jeda waktunya
     * >= threshold (gap dinilai dari perbedaan waktu, bukan jarak geografis).
     *
     * @param  array<int, array>  $points
     * @return array<int, array>
     */
    private function sisipkanGap(array $points, int $gapThreshold): array
    {
        $out = [];

        foreach ($points as $i => $pt) {
            $out[] = $pt;

            if ($i === 0) {
                continue;
            }

            $prev = $points[$i - 1];
            $dari = \Carbon\Carbon::parse($prev['recorded_at']);
            $sampai = \Carbon\Carbon::parse($pt['recorded_at']);
            $durasi = (int) $dari->diffInMinutes($sampai);

            if ($durasi < $gapThreshold) {
                continue;
            }

            $out[] = $this->gapPoint($dari, $sampai, $durasi);
        }

        return $out;
    }

    /**
     * Ambil titik PERTAMA tiap bucket menit.
     *
     * @return array<int, array>
     */
    private function sample(Collection $locations, int $bucketMinutes): array
    {
        $points = [];
        $seen = [];

        foreach ($locations as $loc) {
            if (! $loc->recorded_at || ! $this->valid($loc->latitude, $loc->longitude)) {
                continue;
            }

            $at = $loc->recorded_at;
            $bucket = intdiv($at->hour * 60 + $at->minute, $bucketMinutes);

            if (isset($seen[$bucket])) {
                continue;
            }
            $seen[$bucket] = true;

            $points[] = $this->point(
                (float) $loc->latitude,
                (float) $loc->longitude,
                $at,
                'track'
            );
        }

        return $points;
    }

    private function point(float $lat, float $lng, \Carbon\CarbonInterface $at, string $jenis): array
    {
        return [
            'lat' => $lat,
            'lng' => $lng,
            'recorded_at' => $at->toIso8601String(),
            'label_jam' => $at->format('H:i'),
            'jenis' => $jenis,
        ];
    }

    private function gapPoint(\Carbon\CarbonInterface $dari, \Carbon\CarbonInterface $sampai, int $durasi): array
    {
        return [
            'lat' => null,
            'lng' => null,
            'recorded_at' => $sampai->toIso8601String(),
            'label_jam' => $dari->format('H:i') . '-' . $sampai->format('H:i'),
            'durasi_menit' => $durasi,
            'jenis' => 'gap',
        ];
    }

    private function valid(mixed $lat, mixed $lng): bool
    {
        if ($lat === null || $lng === null || $lat === '' || $lng === '') {
            return false;
        }

        $lat = (float) $lat;
        $lng = (float) $lng;

        return $lat >= -90 && $lat <= 90
            && $lng >= -180 && $lng <= 180
            && ($lat !== 0.0 || $lng !== 0.0);
    }
}
