<?php

namespace App\Support;

/**
 * Pembangun URL universal Google Maps dari koordinat lat/lng.
 *
 * Dipakai untuk aksi "Buka di Google Maps" / "Bagikan Lokasi" pada tracking
 * karyawan. Format SAMA PERSIS di mobile (Flutter) & web (Laravel):
 *
 *     https://www.google.com/maps/search/?api=1&query=LAT%2CLNG
 *
 * Titik koordinat selalu berasal dari GPS karyawan terakhir
 * (MobileTrackingLocation), bukan koordinat Titik proyek.
 */
class GeoUrl
{
    public static function googleMaps(float $lat, float $lng): string
    {
        return sprintf('https://www.google.com/maps/search/?api=1&query=%s%%2C%s', $lat, $lng);
    }

    /**
     * Bangun URL hanya bila kedua koordinat tersedia, else null.
     */
    public static function googleMapsOrNull(mixed $lat, mixed $lng): ?string
    {
        if ($lat === null || $lng === null || $lat === '' || $lng === '') {
            return null;
        }

        return self::googleMaps((float) $lat, (float) $lng);
    }
}