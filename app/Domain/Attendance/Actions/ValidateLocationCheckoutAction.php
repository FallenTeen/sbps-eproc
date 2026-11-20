<?php

namespace App\Domain\Attendance\Actions;

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Titik;

/**
 * Validasi radius saat CHECK-OUT (BK-1/BK-2).
 *
 * Tidak memblokir: hasilnya hanya flag `check_out_status` (valid/luar_radius)
 * yang disimpan terpisah dari `status_validasi` (kolom itu dipakai payroll
 * untuk hitung kehadiran - checkout jauh tidak boleh membatalkan hadir).
 * Presensi tanpa titik (mis. manual web) tidak divalidasi (flag = null).
 */
class ValidateLocationCheckoutAction
{
    public function execute(Presensi $presensi, ?float $lat, ?float $lng): ?string
    {
        $titik = $presensi->titik;

        if (! $titik || $lat === null || $lng === null) {
            return null;
        }

        $distance = $this->haversine(
            $titik->latitude,
            $titik->longitude,
            $lat,
            $lng
        );

        return $distance <= $titik->radius_presensi_meter ? 'valid' : 'luar_radius';
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
