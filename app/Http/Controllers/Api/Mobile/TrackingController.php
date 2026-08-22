<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Attendance\Models\TrackingBatch;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TrackingController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/mobile/tracking/batch
     * Body: { batch_id, locations: [{ lat, lng, timestamp }] }
     * Idempotent via batch_id: satu batch_id = satu kiriman locations[] utuh.
     * Kiriman ulang dengan batch_id sama tidak menduplikasi baris lokasi.
     */
    public function batch(Request $request)
    {
        $karyawan = $request->user()->karyawan;

        if (! $karyawan) {
            throw ValidationException::withMessages([
                'karyawan' => 'Akun Anda belum terhubung ke data karyawan.',
            ]);
        }

        $maxBatch = (int) config('mobile.tracking.max_batch', 500);

        $validated = $request->validate([
            'batch_id' => 'required|uuid',
            'locations' => "required|array|min:1|max:{$maxBatch}",
            'locations.*.lat' => 'required|numeric|between:-90,90',
            'locations.*.lng' => 'required|numeric|between:-180,180',
            'locations.*.timestamp' => 'required|date',
        ]);

        // Cek batch yang sudah diproses SEBELUM validasi presensi,
        // agar retry tetap aman walau user sudah check-out.
        $existingBatch = TrackingBatch::where('batch_id', $validated['batch_id'])->first();

        if ($existingBatch && $existingBatch->karyawan_id === $karyawan->id) {
            return $this->success([
                'received' => $existingBatch->received_count,
                'saved' => $existingBatch->saved_count,
                'batch_id' => $existingBatch->batch_id,
                'duplicate' => true,
            ], 'Batch lokasi sudah diproses sebelumnya.');
        }

        $presensi = Presensi::byKaryawan($karyawan->id)
            ->whereDate('check_in', now()->toDateString())
            ->whereNull('check_out')
            ->latest('check_in')
            ->first();

        if (! $presensi) {
            return $this->error('Tracking hanya aktif saat check-in.', 422);
        }

        $cutoff = Carbon::parse(now()->toDateString().' '.config('mobile.tracking.auto_cutoff', '18:00'));

        $received = count($validated['locations']);
        $saved = 0;

        try {
            DB::transaction(function () use ($validated, $karyawan, $presensi, $cutoff, $received, &$saved) {
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

                // Batch paralel dengan batch_id sama menembak bersamaan →
                // lempar agar seluruh transaksi (lokasi tadi) di-rollback.
                TrackingBatch::create([
                    'karyawan_id' => $karyawan->id,
                    'batch_id' => $validated['batch_id'],
                    'received_count' => $received,
                    'saved_count' => $saved,
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            $existingBatch = TrackingBatch::where('batch_id', $validated['batch_id'])->firstOrFail();

            return $this->success([
                'received' => $existingBatch->received_count,
                'saved' => $existingBatch->saved_count,
                'batch_id' => $existingBatch->batch_id,
                'duplicate' => true,
            ], 'Batch lokasi sudah diproses sebelumnya.');
        }

        $request->user()->update(['last_tracking_at' => now()]);

        return $this->success([
            'received' => $received,
            'saved' => $saved,
            'batch_id' => $validated['batch_id'],
        ], 'Batch lokasi berhasil disimpan.');
    }

    /**
     * GET /api/mobile/tracking/hari-ini/{userId}
     * Hanya role tertentu (Owner / Admin).
     */
    public function hariIni(Request $request, string $userId)
    {
        $currentUser = $request->user();

        if (! $currentUser->isOwner() && ! $currentUser->isAdmin()) {
            return $this->error('Anda tidak berhak melihat tracking user lain.', 403);
        }

        $target = User::findOrFail($userId);

        if (! $target->karyawan) {
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

    /**
     * GET /api/mobile/tracking/active-users
     * User yang sedang aktif (kirim tracking dalam 1 jam terakhir).
     * Hanya role tertentu (Owner / Admin).
     */
    public function activeUsers(Request $request)
    {
        $currentUser = $request->user();

        if (! $currentUser->isOwner() && ! $currentUser->isAdmin()) {
            return $this->error('Anda tidak berhak melihat data ini.', 403);
        }

        $oneHourAgo = now()->subHour();

        $users = MobileTrackingLocation::selectRaw('
                karyawan_id,
                max(recorded_at) as last_seen,
                count(*) as point_count
            ')
            ->where('recorded_at', '>=', $oneHourAgo)
            ->groupBy('karyawan_id')
            ->get()
            ->map(function ($row) {
                $karyawan = Karyawan::with('user')
                    ->find($row->karyawan_id);

                return [
                    'karyawan_id' => $row->karyawan_id,
                    'nama' => $karyawan?->nama,
                    'user_id' => $karyawan?->user_id,
                    'last_seen' => Carbon::parse($row->last_seen)->toIso8601String(),
                    'point_count' => (int) $row->point_count,
                ];
            })
            ->filter(fn ($u) => $u['nama'] !== null)
            ->values();

        return $this->success([
            'total' => $users->count(),
            'items' => $users,
        ], 'User aktif.');
    }
}
