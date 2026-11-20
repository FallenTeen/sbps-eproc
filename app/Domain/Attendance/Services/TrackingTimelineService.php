<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use Carbon\Carbon;
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
 * - DEDUPE: titik mentah dengan `recorded_at` identik & koordinat nyaris
 *   sama (beda < 1e-6 derajat) hanya dipakai sekali (keep first) karena
 *   duplikat bisa muncul dari upload batch mobile. `raw_count` tetap
 *   menghitung titik mentah valid SEBELUM dedupe (artinya "GPS mentah").
 * - Ringkasan additive: `durasi_menit`, `jarak_meter` (haversine antar
 *   titik valid kronologis), `gap_count`, `interval_menit` (null saat 'all').
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

        $query = MobileTrackingLocation::query()
            ->where('presensi_id', $p->id)
            ->orderBy('recorded_at')
            ->orderBy('created_at');

        $locations = $query->get([
            'id',
            'latitude',
            'longitude',
            'recorded_at',
        ]);

        /*
         * Fallback apabila belum ada GPS yang terhubung langsung dengan presensi_id.
         */
        if ($locations->isEmpty() && $p->check_in) {
            $locations = MobileTrackingLocation::query()
                ->where('karyawan_id', $p->karyawan_id)
                ->whereBetween('recorded_at', [
                    $p->check_in,
                    $p->check_out ?? now(),
                ])
                ->orderBy('recorded_at')
                ->orderBy('created_at')
                ->get([
                    'id',
                    'latitude',
                    'longitude',
                    'recorded_at',
                ]);
        }

        // Lokasi kosong TIDAK langsung return: titik check-in/check-out tetap
        // disisipkan sebagai ujung linimasa supaya peta punya acuan (raw_count
        // tetap 0 sehingga UI tetap jujur menyebut "tanpa GPS").
        if (! $p->check_in) {
            return [
                'points' => [],
                'raw_count' => 0,
                'truncated' => false,
                'durasi_menit' => 0,
                'jarak_meter' => 0.0,
                'gap_count' => 0,
                'interval_menit' => null,
            ];
        }

        $checkIn = Carbon::parse($p->check_in);
        $checkOut = $p->check_out ? Carbon::parse($p->check_out) : null;
        $raw = $locations->filter(fn ($l) => $l->recorded_at && $this->valid($l->latitude, $l->longitude))
            ->filter(fn ($l) => Carbon::parse($l->recorded_at)->gte($checkIn))
            ->filter(fn ($l) => ! $checkOut || Carbon::parse($l->recorded_at)->lte($checkOut))
            ->values();

        // raw_count = jumlah titik mentah valid (setelah filter window,
        // sebelum dedupe) — semantik "GPS mentah" dipertahankan.
        $rawCount = $raw->count();

        $deduped = $this->dedupe($raw);

        $points = $isAll
            ? $deduped->map(fn ($loc) => $this->point(
                (float) $loc->latitude,
                (float) $loc->longitude,
                Carbon::parse($loc->recorded_at),
                'track'
            ))->all()
            : $this->sample($deduped, $bucketMinutes);

        // Titik check-in & check-out selalu disertakan sebagai ujung linimasa.
        if ($this->valid($p->check_in_lat, $p->check_in_lng)) {
            array_unshift($points, $this->point(
                (float) $p->check_in_lat,
                (float) $p->check_in_lng,
                $checkIn,
                'check_in',
                'check-in-' . $p->id
            ));
        }

        /*
         * 4. Titik check-out tetap disertakan
         */
        if ($p->check_out && $this->valid($p->check_out_lat, $p->check_out_lng)) {
            $points[] = $this->point(
                (float) $p->check_out_lat,
                (float) $p->check_out_lng,
                Carbon::parse($p->check_out),
                'check_out',
                'check-out-' . $p->id
            );
        }

    usort($points, fn ($a, $b) => strtotime($a['recorded_at']) <=> strtotime($b['recorded_at']));

    if ($p->check_out && $raw->isNotEmpty()) {
            $points = $this->sisipkanGap($points, $gapThreshold);
        }

        $total = count($points);
        $truncated = $total > self::MAX_POINTS;
        $points = array_slice($points, 0, self::MAX_POINTS);

        $gapCount = count(array_filter($points, fn ($pt) => ($pt['jenis'] ?? '') === 'gap'));

        $lastGps = $deduped->isNotEmpty()
            ? Carbon::parse($deduped->last()->recorded_at)
            : null;
        $durasiAkhir = $checkOut ?? $lastGps ?? $checkIn;

        return [
            'points' => array_values($points),
            'raw_count' => $rawCount,
            'truncated' => $truncated,
            'durasi_menit' => (int) ceil($checkIn->diffInMinutes($durasiAkhir)),
            'jarak_meter' => round($this->jarakMeter($deduped), 1),
            'gap_count' => $gapCount,
            'interval_menit' => $isAll ? null : $bucketMinutes,
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
     * Ambil titik PERTAMA tiap bucket menit (epoch-aligned) dan tandai
     * dengan label interval additive: `bucket_label` (mulai bucket) dan
     * `bucket_menit`.
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

            $at = Carbon::parse($loc->recorded_at);
            $bucket = intdiv($at->timestamp, $bucketMinutes * 60);

            if (isset($seen[$bucket])) {
                continue;
            }
            $seen[$bucket] = true;

            $bucketStart = Carbon::createFromTimestamp(
                $bucket * $bucketMinutes * 60,
                $at->getTimezone()
            );

            $points[] = array_merge(
                $this->point((float) $loc->latitude, (float) $loc->longitude, $at, 'track'),
                [
                    'bucket_label' => $bucketStart->format('H:i'),
                    'bucket_menit' => $bucketMinutes,
                ]
            );
        }

        return $points;
    }

    /**
     * Buang titik duplikat: `recorded_at` identik (detik) & koordinat beda
     * < 1e-6 derajat → keep first. Duplikat berasal dari upload batch mobile.
     */
    private function dedupe(Collection $locations): Collection
    {
        $seen = [];

        return $locations->filter(function ($loc) use (&$seen) {
            $key = sprintf(
                '%d|%d|%d',
                Carbon::parse($loc->recorded_at)->timestamp,
                round((float) $loc->latitude * 1e6),
                round((float) $loc->longitude * 1e6)
            );

            if (isset($seen[$key])) {
                return false;
            }
            $seen[$key] = true;

            return true;
        })->values();
    }

    /**
     * Perkiraan jarak tempuh: penjumlahan haversine antar titik valid
     * kronologis (raw setelah dedupe). Titik check-in/out tidak dihitung.
     */
    private function jarakMeter(Collection $locations): float
    {
        $total = 0.0;
        $prev = null;

        foreach ($locations as $loc) {
            $cur = [(float) $loc->latitude, (float) $loc->longitude];

            if ($prev !== null) {
                $total += $this->haversineMeter($prev[0], $prev[1], $cur[0], $cur[1]);
            }
            $prev = $cur;
        }

        return $total;
    }

    private function haversineMeter(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * asin(min(1.0, sqrt($a)));
    }

    private function point(float $lat, float $lng, \Carbon\CarbonInterface $at, string $jenis, ?string $id = null): array
    {
        return [
            'id' => $id ?? $jenis . '-' . $at->timestamp,
            'lat' => $lat,
            'lng' => $lng,
            'recorded_at' => $at->toIso8601String(),
            'label_jam' => $at->format('H:i:s'),
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
        if (
            $lat === null ||
            $lng === null ||
            $lat === '' ||
            $lng === ''
        ) {
            return false;
        }

        $lat = (float) $lat;
        $lng = (float) $lng;

        return $lat >= -90
            && $lat <= 90
            && $lng >= -180
            && $lng <= 180
            && ($lat !== 0.0 || $lng !== 0.0);
    }
}