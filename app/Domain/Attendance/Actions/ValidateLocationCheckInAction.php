<?php

namespace App\Domain\Attendance\Actions;

use App\Domain\Core\Models\Titik;

class ValidateLocationCheckInAction
{
    public function execute(Titik $titik, float $lat, float $lng): array
    {
        $distance = $this->haversine($titik->latitude, $titik->longitude, $lat, $lng);
        $status = $distance <= $titik->radius_presensi_meter ? 'valid' : 'luar_radius';

        return [
            'status_validasi' => $status,
            'catatan_override' => $status === 'luar_radius'
                ? sprintf('Di luar area kerja — jarak %d m', (int) round($distance))
                : null,
        ];
    }

    private function haversine($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // meter
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
