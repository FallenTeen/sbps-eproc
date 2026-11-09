<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use Carbon\Carbon;

/**
 * Bangun linimasa lokasi GPS untuk satu presensi (tampilan web khusus Owner).
 *
 * Menghasilkan titik lokasi secara konsisten per 5 menit (termasuk jika lokasi diam/sama).
 */
class TrackingTimelineService
{
    /**
     * Interval slot waktu linimasa (dalam menit)
     */
    protected int $bucketMinutes = 5;

    /**
     * @return array{points: array<int, array>, raw_count: int}
     */
    public function forPresensi(Presensi $p): array
    {
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

        // Filter koordinat yang valid
        $validLocations = $locations->filter(function ($loc) {
            return $loc->recorded_at && $this->valid($loc->latitude, $loc->longitude);
        })->values();

        if ($validLocations->isEmpty() && ! $p->check_in) {
            return [
                'points' => [],
                'raw_count' => 0,
            ];
        }

        /*
         * 1. Tentukan batas waktu awal dan akhir linimasa
         */
        $startTime = $p->check_in 
            ? Carbon::parse($p->check_in) 
            : Carbon::parse($validLocations->first()->recorded_at);

        $endTime = $p->check_out 
            ? Carbon::parse($p->check_out) 
            : ($validLocations->isNotEmpty() ? Carbon::parse($validLocations->last()->recorded_at) : now());

        /*
         * 2. Buat slot per 5 menit. Jika ada data baru di interval tersebut, tampilkan data tersebut.
         *    Jika lokasi diam / tidak ada kiriman baru, tetap buat titik menggunakan lokasi terakhir.
         */
        $points = [];
        $currentSlot = $startTime->copy()->floorMinutes($this->bucketMinutes);
        $lastKnownLocation = null;
        $locationIndex = 0;
        $totalLocations = $validLocations->count();

        while ($currentSlot->lessThanOrEqualTo($endTime)) {
            // Majukan pointer ke lokasi terbaru yang recorded_at <= currentSlot
            while (
                $locationIndex < $totalLocations &&
                Carbon::parse($validLocations[$locationIndex]->recorded_at)->lessThanOrEqualTo($currentSlot)
            ) {
                $lastKnownLocation = $validLocations[$locationIndex];
                $locationIndex++;
            }

            // Tampilkan titik di slot 5 menit ini menggunakan lokasi terakhir yang tersedia
            if ($lastKnownLocation) {
                $points[] = $this->point(
                    (float) $lastKnownLocation->latitude,
                    (float) $lastKnownLocation->longitude,
                    $currentSlot->copy(),
                    'track',
                    'slot-' . $currentSlot->timestamp
                );
            }

            $currentSlot->addMinutes($this->bucketMinutes);
        }

        /*
         * 3. Titik check-in tetap disertakan
         */
        if ($p->check_in && $this->valid($p->check_in_lat, $p->check_in_lng)) {
            array_unshift(
                $points,
                $this->point(
                    (float) $p->check_in_lat,
                    (float) $p->check_in_lng,
                    Carbon::parse($p->check_in),
                    'check_in',
                    'check-in-' . $p->id
                )
            );
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

        // Urutkan kembali berdasarkan urutan waktu recorded_at
        usort($points, function ($a, $b) {
            return strtotime($a['recorded_at']) <=> strtotime($b['recorded_at']);
        });

        return [
            'points' => array_values($points),
            'raw_count' => $locations->count(),
        ];
    }

    private function point(
        float $lat,
        float $lng,
        Carbon $at,
        string $jenis,
        string $id
    ): array {
        return [
            'id' => $id,
            'lat' => $lat,
            'lng' => $lng,
            'recorded_at' => $at->toIso8601String(),
            'label_jam' => $at->format('H:i:s'),
            'jenis' => $jenis,
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