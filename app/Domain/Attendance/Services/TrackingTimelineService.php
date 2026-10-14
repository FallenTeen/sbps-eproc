<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Bangun linimasa lokasi GPS untuk satu presensi (tampilan web khusus Owner).
 *
 * Sampling per `bucketMinutes` menit HANYA untuk kepadatan tampilan — interval
 * GPS di HP tidak diubah.
 */
class TrackingTimelineService
{
    /**
     * @return array{points: array<int, array>, raw_count: int}
     */
    public function forPresensi(Presensi $p, int $bucketMinutes = 30): array
    {
        $bucketMinutes = max(1, $bucketMinutes);

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

        $points = $this->sample($locations, $bucketMinutes);

        // Titik check-in & check-out selalu disertakan sebagai ujung linimasa.
        if ($p->check_in && $this->valid($p->check_in_lat, $p->check_in_lng)) {
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

        return [
            'points' => array_values($points),
            'raw_count' => $locations->count(),
        ];
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

    private function point(float $lat, float $lng, Carbon $at, string $jenis): array
    {
        return [
            'lat' => $lat,
            'lng' => $lng,
            'recorded_at' => $at->toIso8601String(),
            'label_jam' => $at->format('H:i'),
            'jenis' => $jenis,
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
