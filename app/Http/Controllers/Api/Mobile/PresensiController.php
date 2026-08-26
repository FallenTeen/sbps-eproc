<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Attendance\Actions\ValidateLocationCheckInAction;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Titik;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PresensiController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/mobile/titik-aktif
     */
    public function titikAktif(Request $request)
    {
        $titiks = Titik::aktif()
            ->with('proyek:id,nama')
            ->orderBy('nama')
            ->get()
            ->map(fn (Titik $t) => [
                'id' => $t->id,
                'nama' => $t->nama,
                'proyek' => $t->proyek?->nama,
                'latitude' => (float) $t->latitude,
                'longitude' => (float) $t->longitude,
                'radius_presensi_meter' => $t->radius_presensi_meter,
            ]);

        return $this->success($titiks, 'Daftar titik aktif.');
    }

    /**
     * POST /api/mobile/presensi/check-in
     */
    public function checkIn(Request $request)
    {
        $karyawan = $this->resolveKaryawan($request);

        $validated = $request->validate([
            'titik_id' => 'required|exists:titiks,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:10240',
            'photo_metadata' => 'nullable|array',
            'photo_metadata.latitude' => 'nullable|numeric',
            'photo_metadata.longitude' => 'nullable|numeric',
            'device_id' => 'nullable|string|max:255',
        ]);

        $titik = Titik::findOrFail($validated['titik_id']);

        $alreadyCheckedIn = Presensi::byKaryawan($karyawan->id)
            ->whereDate('check_in', now()->toDateString())
            ->whereNull('check_out')
            ->exists();

        if ($alreadyCheckedIn) {
            return $this->error('Anda sudah check-in hari ini.', 422);
        }

        $statusValidasi = (new ValidateLocationCheckInAction)->execute(
            $titik,
            (float) $validated['latitude'],
            (float) $validated['longitude']
        );

        $photoPath = $request->file('photo')->store('presensi/check-in', 'public');

        $presensi = Presensi::create([
            'karyawan_id' => $karyawan->id,
            'titik_id' => $titik->id,
            'check_in' => now(),
            'check_in_lat' => $validated['latitude'],
            'check_in_lng' => $validated['longitude'],
            'check_in_photo' => $photoPath,
            'check_in_photo_metadata' => $validated['photo_metadata'] ?? null,
            'device_id' => $validated['device_id'] ?? null,
            'status_validasi' => $statusValidasi,
        ]);

        $request->user()->update(['last_tracking_at' => now()]);

        return $this->success([
            'presensi_id' => $presensi->id,
            'check_in' => $presensi->check_in->toIso8601String(),
            'status_validasi' => $statusValidasi,
            'status' => 'menunggu_check_out',
        ], 'Check-in berhasil dicatat.', 201);
    }

    /**
     * POST /api/mobile/presensi/check-out
     */
    public function checkOut(Request $request)
    {
        $karyawan = $this->resolveKaryawan($request);

        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:10240',
            'photo_metadata' => 'nullable|array',
            'photo_metadata.latitude' => 'nullable|numeric',
            'photo_metadata.longitude' => 'nullable|numeric',
        ]);

        $presensi = Presensi::byKaryawan($karyawan->id)
            ->whereDate('check_in', now()->toDateString())
            ->whereNull('check_out')
            ->latest('check_in')
            ->first();

        if (! $presensi) {
            return $this->error('Anda belum check-in hari ini.', 422);
        }

        $photoPath = $request->file('photo')->store('presensi/check-out', 'public');

        $presensi->update([
            'check_out' => now(),
            'check_out_lat' => $validated['latitude'],
            'check_out_lng' => $validated['longitude'],
            'check_out_photo' => $photoPath,
            'check_out_photo_metadata' => $validated['photo_metadata'] ?? null,
        ]);

        return $this->success([
            'presensi_id' => $presensi->id,
            'check_out' => $presensi->fresh()->check_out->toIso8601String(),
            'status' => 'selesai',
        ], 'Check-out berhasil dicatat.');
    }

    /**
     * GET /api/mobile/presensi/hari-ini
     */
    public function hariIni(Request $request)
    {
        $karyawan = $this->resolveKaryawan($request);

        $presensi = Presensi::with(['titik', 'formulir'])
            ->byKaryawan($karyawan->id)
            ->whereDate('check_in', now()->toDateString())
            ->latest('check_in')
            ->first();

        if (! $presensi) {
            return $this->success([
                'presensi_id' => null,
                'check_in' => null,
                'check_out' => null,
                'status' => 'belum_check_in',
                'status_validasi' => null,
                'titik' => null,
                'formulir' => null,
            ], 'Belum ada presensi hari ini.');
        }

        return $this->success([
            'presensi_id' => $presensi->id,
            'check_in' => $presensi->check_in?->toIso8601String(),
            'check_out' => $presensi->check_out?->toIso8601String(),
            'status' => $presensi->check_out ? 'selesai' : 'menunggu_check_out',
            'status_validasi' => $presensi->status_validasi,
            'titik' => $presensi->titik
                ? ['id' => $presensi->titik->id, 'nama' => $presensi->titik->nama]
                : null,
            'formulir' => $presensi->formulir
                ? [
                    'id' => $presensi->formulir->id,
                    'aktivitas_dilakukan' => $presensi->formulir->aktivitas_dilakukan,
                    'kondisi_area' => $presensi->formulir->kondisi_area,
                    'kendala' => $presensi->formulir->kendala,
                ]
                : null,
        ], 'Status presensi hari ini.');
    }

    /**
     * GET /api/mobile/presensi/riwayat?bulan=&tahun=
     */
    public function riwayat(Request $request)
    {
        $karyawan = $this->resolveKaryawan($request);

        $validated = $request->validate([
            'bulan' => 'nullable|integer|between:1,12',
            'tahun' => 'nullable|integer|between:2000,2100',
        ]);

        $query = Presensi::with('titik')
            ->byKaryawan($karyawan->id);

        if (! empty($validated['bulan'])) {
            $query->whereMonth('check_in', $validated['bulan']);
        }

        if (! empty($validated['tahun'])) {
            $query->whereYear('check_in', $validated['tahun']);
        }

        $presensis = $query->orderByDesc('check_in')->paginate(20);

        return $this->success([
            'items' => $presensis->getCollection()->map(fn (Presensi $p) => [
                'id' => $p->id,
                'titik' => $p->titik?->nama,
                'check_in' => $p->check_in?->toIso8601String(),
                'check_out' => $p->check_out?->toIso8601String(),
                'status_validasi' => $p->status_validasi,
                'status' => $p->check_out ? 'selesai' : 'menunggu_check_out',
            ]),
            'pagination' => [
                'total' => $presensis->total(),
                'per_page' => $presensis->perPage(),
                'current_page' => $presensis->currentPage(),
                'last_page' => $presensis->lastPage(),
            ],
        ], 'Riwayat presensi.');
    }

    private function resolveKaryawan(Request $request)
    {
        $karyawan = $request->user()->karyawan;

        if (! $karyawan) {
            throw ValidationException::withMessages([
                'karyawan' => 'Akun Anda belum terhubung ke data karyawan.',
            ]);
        }

        return $karyawan;
    }
}
