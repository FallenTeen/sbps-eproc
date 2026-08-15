<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Attendance\Actions\SubmitFieldFormAction;
use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Attendance\Models\Presensi;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FormulirController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/mobile/formulir/store
     */
    public function store(Request $request)
    {
        $presensi = $this->todayPresensi($request);

        if (!$presensi) {
            return $this->error('Anda belum check-in hari ini.', 422);
        }

        if ($presensi->formulir) {
            return $this->error('Formulir hari ini sudah diisi.', 422);
        }

        $validated = $request->validate([
            'aktivitas_dilakukan' => 'required|string|max:5000',
            'kondisi_area' => 'nullable|string|max:2000',
            'kendala' => 'nullable|string|max:2000',
            'catatan_tambahan' => 'nullable|string|max:2000',
            'photos' => 'nullable|array|max:5',
            'photos.*' => 'image|mimes:jpeg,png,jpg|max:10240',
        ]);

        $photos = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $photos[] = $file->store('formulir/' . now()->format('Y/m/d'), 'public');
            }
        }

        $formulir = (new SubmitFieldFormAction())->execute([
            'presensi_id' => $presensi->id,
            'aktivitas_dilakukan' => $validated['aktivitas_dilakukan'],
            'kondisi_area' => $validated['kondisi_area'] ?? null,
            'kendala' => $validated['kendala'] ?? null,
            'foto' => $photos ? implode(',', $photos) : null,
            'catatan_tambahan' => $validated['catatan_tambahan'] ?? null,
        ]);

        return $this->success([
            'id' => $formulir->id,
            'presensi_id' => $formulir->presensi_id,
            'foto' => array_map(fn ($path) => asset('storage/' . $path), $photos),
        ], 'Formulir berhasil disimpan.', 201);
    }

    /**
     * GET /api/mobile/formulir/hari-ini
     */
    public function hariIni(Request $request)
    {
        $presensi = $this->todayPresensi($request);

        if (!$presensi || !$presensi->formulir) {
            return $this->success(null, 'Belum ada formulir hari ini.');
        }

        return $this->success($this->formulirPayload($presensi->formulir), 'Formulir hari ini.');
    }

    /**
     * GET /api/mobile/formulir/riwayat
     */
    public function riwayat(Request $request)
    {
        $karyawan = $request->user()->karyawan;

        if (!$karyawan) {
            throw ValidationException::withMessages([
                'karyawan' => 'Akun Anda belum terhubung ke data karyawan.',
            ]);
        }

        $formulirs = FormulirLapangan::with('presensi.titik')
            ->whereHas('presensi', fn ($q) => $q->byKaryawan($karyawan->id))
            ->orderByDesc('created_at')
            ->paginate(20);

        return $this->success([
            'items' => $formulirs->getCollection()->map(fn (FormulirLapangan $f) => $this->formulirPayload($f)),
            'pagination' => [
                'total' => $formulirs->total(),
                'per_page' => $formulirs->perPage(),
                'current_page' => $formulirs->currentPage(),
                'last_page' => $formulirs->lastPage(),
            ],
        ], 'Riwayat formulir lapangan.');
    }

    private function todayPresensi(Request $request)
    {
        $karyawan = $request->user()->karyawan;

        if (!$karyawan) {
            throw ValidationException::withMessages([
                'karyawan' => 'Akun Anda belum terhubung ke data karyawan.',
            ]);
        }

        return Presensi::with('formulir')
            ->byKaryawan($karyawan->id)
            ->whereDate('check_in', now()->toDateString())
            ->latest('check_in')
            ->first();
    }

    private function formulirPayload(FormulirLapangan $formulir): array
    {
        $fotos = $formulir->foto
            ? array_map(fn ($path) => asset('storage/' . $path), explode(',', $formulir->foto))
            : [];

        return [
            'id' => $formulir->id,
            'presensi_id' => $formulir->presensi_id,
            'tanggal' => $formulir->presensi?->check_in?->toDateString(),
            'titik' => $formulir->presensi?->titik?->nama,
            'aktivitas_dilakukan' => $formulir->aktivitas_dilakukan,
            'kondisi_area' => $formulir->kondisi_area,
            'kendala' => $formulir->kendala,
            'catatan_tambahan' => $formulir->catatan_tambahan,
            'foto' => $fotos,
        ];
    }
}
