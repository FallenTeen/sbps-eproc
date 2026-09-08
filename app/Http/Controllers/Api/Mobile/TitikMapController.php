<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Core\Models\Titik;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TitikMapController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/mobile/titik-map
     *
     * Mendapatkan daftar titik dengan koordinat untuk pemetaan.
     * Query params:
     * - proyek_id: (uuid, opsional) filter per proyek
     * - semua: (bool, opsional) jika true tampilkan semua status, default hanya status aktif
     */
    public function index(Request $request)
    {
        $query = Titik::with('proyek:id,nama');

        // Default: hanya titik aktif, kecuali 'semua' = true / 1
        if (! $request->boolean('semua')) {
            $query->aktif();
        }

        // Filter opsional per proyek
        if ($request->filled('proyek_id')) {
            $query->byProyek($request->proyek_id);
        }

        $titiks = $query->orderBy('nama')
            ->get()
            ->map(fn (Titik $t) => [
                'id' => $t->id,
                'nama' => $t->nama,
                'latitude' => (float) $t->latitude,
                'longitude' => (float) $t->longitude,
                'radius_presensi_meter' => (int) $t->radius_presensi_meter,
                'proyek_id' => $t->proyek_id,
                'proyek_nama' => $t->proyek?->nama,
                'status' => $t->status,
            ]);

        return $this->success([
            'items' => $titiks,
        ], 'Daftar titik peta.');
    }
}
