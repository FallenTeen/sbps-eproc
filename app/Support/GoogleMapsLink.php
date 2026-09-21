<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Ekstraksi koordinat dari tautan/teks lokasi Google Maps.
 *
 * Arahnya KEBALIKAN dari GeoUrl: GeoUrl mengubah lat/lng -> URL Google Maps;
 * helper ini mengubah tautan/teks yang ditempel pengguna -> lat/lng, tanpa
 * memakai Google Maps SDK sama sekali (link hanya dijadikan sumber koordinat,
 * hasilnya ditampilkan & disimpan memakai map existing: Leaflet/OSM).
 *
 * Format yang dikenali:
 *  - URL penuh dengan "@lat,lng[,zoom]"         → https://www.google.com/maps/place/.../@-7.4685527,109.217636,17z
 *  - query / q= / ll= lat,lng (koma mentalah atau %2C)
 *  - teks polos "lat,lng"
 *  - link pendek maps.app.goo.gl / goo.gl/maps   → di-resolve (follow redirect)
 *    server-side lalu parse URL final.
 */
class GoogleMapsLink
{
    /** User-Agent jujur & jelas (syarat kebijakan penggunaan Nominatim/OSM). */
    public const USER_AGENT = 'SBPS-EProc/1.0 (internal admin; contact administrator@satriabuana.local)';

    /**
     * Coba ekstrak koordinat dari input (tautan atau teks). Normalisasi:
     * pola langsung lebih dulu; bila berupa link pendek baru di-resolve lalu
     * di-parse ulang. Kembalikan ['lat'=>float,'lng'=>float] atau null.
     */
    public static function extractCoordinates(string $input): ?array
    {
        $input = trim($input);
        if ($input === '') {
            return null;
        }

        $coords = self::coordinatesFromText($input);
        if ($coords !== null) {
            return $coords;
        }

        if (self::isShortLink($input)) {
            $resolved = self::resolveLink($input);
            if ($resolved !== null) {
                $coords = self::coordinatesFromText($resolved);
                if ($coords !== null) {
                    return $coords;
                }
            }
        }

        return null;
    }

    /**
     * Ikuti redirect link pendek Google Maps dan kembalikan URL final,
     * atau null bila gagal / bukan shortlink.
     */
    public static function resolveLink(string $input): ?string
    {
        $url = self::normalizeShortLink($input);
        if ($url === null) {
            return null;
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => self::USER_AGENT])
                ->get($url);

            if (! $response->successful()) {
                return null;
            }

            $effective = $response->effectiveUri();

            return $effective !== null ? (string) $effective : $url;
        } catch (Throwable $e) {
            return null;
        }
    }

    private static function coordinatesFromText(string $text): ?array
    {
        $patterns = [
            // @lat,lng[,zoom] — format utama Google Maps (place/dir/search).
            '/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/',
            // query=lat,lng  (koma mentalah atau %2C)
            '/[?&]query=(-?\d{1,3}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i',
            // q=lat,lng
            '/[?&]q=(-?\d{1,3}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i',
            // ll=lat,lng (maps.google.com)
            '/[?&]ll=(-?\d{1,3}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i',
            // Teks polos "lat,lng" (tanpa URL).
            '/^(-?\d{1,3}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)$/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                $lat = (float) $m[1];
                $lng = (float) $m[2];

                if (self::isValidLatLng($lat, $lng)) {
                    return ['lat' => $lat, 'lng' => $lng];
                }
            }
        }

        return null;
    }

    private static function isShortLink(string $input): bool
    {
        return (bool) self::normalizeShortLink($input);
    }

    private static function normalizeShortLink(string $input): ?string
    {
        $trimmed = trim($input);
        if ($trimmed === '') {
            return null;
        }

        // Tanpa skema -> anggap https.
        if (str_starts_with($trimmed, 'http://') || str_starts_with($trimmed, 'https://')) {
            $host = parse_url($trimmed, PHP_URL_HOST);
            $host = is_string($host) ? strtolower($host) : '';
        } else {
            $host = strtolower((string) parse_url('http://'.$trimmed, PHP_URL_HOST));
            $trimmed = 'https://'.$trimmed;
        }

        if (! in_array($host, ['goo.gl', 'maps.app.goo.gl'], true)) {
            return null;
        }

        return $trimmed;
    }

    public static function isValidLatLng(mixed $lat, mixed $lng): bool
    {
        $lat = (float) $lat;
        $lng = (float) $lng;

        return $lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180;
    }
}