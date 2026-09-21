<?php

namespace App\Domain\Core\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\GoogleMapsLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Bantuan input lokasi "tempel link Google Maps" untuk web.
 *
 * resolve : ekstrak lat/lng dari tautan yang ditempel pengguna (tanpa SDK —
 *           link hanya sumber koordinat; tampilan tetap memakai map OSM).
 * reverse : cari alamat dari koordinat via Nominatim (OpenStreetMap) sebagai
 *           proxy server (User-Agent jujur + cache 7 hari agar hormati
 *           kebijakan rate-limit). Alamat hanya DITAMPILKAN untuk konfirmasi
 *           "Apakah lokasi ini sudah benar?" — tidak dipersist.
 */
class LokasiController extends Controller
{
    public function resolve(Request $request)
    {
        $validated = $request->validate([
            'link' => 'required|string|max:2000',
        ]);

        $coords = GoogleMapsLink::extractCoordinates($validated['link']);

        if ($coords === null) {
            return response()->json([
                'latitude' => null,
                'longitude' => null,
                'error' => 'Tidak dapat mengekstrak koordinat dari tautan tersebut. Gunakan link Google Maps berisi "@lat,lng" atau koordinat "lat,lng".',
            ], 422);
        }

        return response()->json([
            'latitude' => $coords['lat'],
            'longitude' => $coords['lng'],
        ]);
    }

    public function reverse(Request $request)
    {
        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        $lat = (float) $validated['lat'];
        $lng = (float) $validated['lng'];

        $alamat = Cache::remember(
            'nominatim:'.number_format($lat, 6).','.number_format($lng, 6),
            now()->addDays(7),
            function () use ($lat, $lng) {
                return $this->reverseGeocode($lat, $lng);
            }
        );

        return response()->json([
            'latitude' => $lat,
            'longitude' => $lng,
            'alamat' => $alamat,
            'ditemukan' => $alamat !== null,
        ]);
    }

    private function reverseGeocode(float $lat, float $lng): ?string
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => GoogleMapsLink::USER_AGENT,
                    'Accept-Language' => 'id',
                ])
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'lat' => $lat,
                    'lon' => $lng,
                    'format' => 'jsonv2',
                    'accept-language' => 'id',
                ]);

            if (! $response->successful()) {
                return null;
            }

            $payload = $response->json();

            return is_array($payload) ? ($payload['display_name'] ?? null) : null;
        } catch (Throwable $e) {
            return null;
        }
    }
}