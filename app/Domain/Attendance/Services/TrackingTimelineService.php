<?php

namespace App\Domain\Attendance\Services;

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
<<<<<<< HEAD
use Carbon\Carbon;
=======
use Illuminate\Support\Collection;
>>>>>>> 1bd0312d1ff7f342e825cc737f476a76a97c5bbc

/**
 * Bangun linimasa lokasi GPS untuk satu presensi (tampilan web khusus Owner).
 *
<<<<<<< HEAD
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
=======
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
>>>>>>> 1bd0312d1ff7f342e825cc737f476a76a97c5bbc
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

<<<<<<< HEAD
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
=======
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
>>>>>>> 1bd0312d1ff7f342e825cc737f476a76a97c5bbc
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

<<<<<<< HEAD
        // Urutkan kembali berdasarkan urutan waktu recorded_at
        usort($points, function ($a, $b) {
            return strtotime($a['recorded_at']) <=> strtotime($b['recorded_at']);
        });
=======
        usort($points, fn ($a, $b) => strcmp($a['recorded_at'], $b['recorded_at']));

        if ($p->check_out) {
            $points = $this->sisipkanGap($points, $gapThreshold);
        }

        $total = count($points);
        $truncated = $total > self::MAX_POINTS;
        $points = array_slice($points, 0, self::MAX_POINTS);
>>>>>>> 1bd0312d1ff7f342e825cc737f476a76a97c5bbc

        return [
            'points' => array_values($points),
            'raw_count' => $locations->count(),
            'truncated' => $truncated,
        ];
    }

<<<<<<< HEAD
    private function point(
        float $lat,
        float $lng,
        Carbon $at,
        string $jenis,
        string $id
    ): array {
=======
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
>>>>>>> 1bd0312d1ff7f342e825cc737f476a76a97c5bbc
        return [
            'id' => $id,
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