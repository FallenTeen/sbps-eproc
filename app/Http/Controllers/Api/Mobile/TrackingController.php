<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TrackingController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/mobile/tracking/batch
     * Body: { locations: [{ lat, lng, timestamp }] }
     */
    public function batch(Request $request)
    {
        $karyawan = $request->user()->karyawan;

        if (!$karyawan) {
            throw ValidationException::withMessages([
                'karyawan' => 'Akun Anda belum terhubung ke data karyawan.',
            ]);
        }

        $maxBatch = (int) config('mobile.tracking.max_batch', 500);

        $validated = $request->validate([
            'locations' => "required|array|min:1|max:{$maxBatch}",
            'locations.*.lat' => 'required|numeric|between:-90,90',
            'locations.*.lng' => 'required|numeric|between:-180,180',
            'locations.*.timestamp' => 'required|date',
        ]);

        $presensi = Presensi::byKaryawan($karyawan->id)
            ->whereDate('check_in', now()->toDateString())
            ->whereNull('check_out')
            ->latest('check_in')
            ->first();

        if (!$presensi) {
            return $this->error('Tracking hanya aktif saat check-in.', 422);
        }

        $cutoff = Carbon::parse(now()->toDateString() . ' ' . config('mobile.tracking.auto_cutoff', '18:00'));

        $saved = 0;

        foreach ($validated['locations'] as $loc) {
            $recordedAt = Carbon::parse($loc['timestamp']);

            if ($recordedAt->greaterThan($cutoff)) {
                continue;
            }

            MobileTrackingLocation::create([
                'karyawan_id' => $karyawan->id,
                'presensi_id' => $presensi->id,
                'latitude' => $loc['lat'],
                'longitude' => $loc['lng'],
                'recorded_at' => $recordedAt,
            ]);

            $saved++;
        }

        $request->user()->update(['last_tracking_at' => now()]);

        return $this->success([
            'received' => count($validated['locations']),
            'saved' => $saved,
        ], 'Batch lokasi berhasil disimpan.');
    }

    /**
     * GET /api/mobile/tracking/hari-ini/{userId}
     * Hanya role tertentu (Owner / Admin).
     */
    public function hariIni(Request $request, string $userId)
    {
        $currentUser = $request->user();

        if (!$currentUser->isOwner() && !$currentUser->isAdmin()) {
            return $this->error('Anda tidak berhak melihat tracking user lain.', 403);
        }

        $target = User::findOrFail($userId);

        if (!$target->karyawan) {
            return $this->error('User tidak memiliki data karyawan.', 422);
        }

        $locations = MobileTrackingLocation::where('karyawan_id', $target->karyawan->id)
            ->whereDate('recorded_at', now()->toDateString())
            ->orderBy('recorded_at')
            ->get()
            ->map(fn (MobileTrackingLocation $l) => [
                'lat' => (float) $l->latitude,
                'lng' => (float) $l->longitude,
                'timestamp' => $l->recorded_at->toIso8601String(),
            ]);

        return $this->success([
            'user_id' => $target->id,
            'nama' => $target->name,
            'tanggal' => now()->toDateString(),
            'items' => $locations,
        ], 'Tracking hari ini.');
    }
}
