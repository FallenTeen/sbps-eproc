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
     * Karyawan yang masih ber-presensi aktif HARI INI (check-in, belum
     * check-out) beserta status GPS terkini. Setiap field adalah data ABSAH
     * server — tidak ada fabrikasi realtime:
     *
     * - `titik`        : titik kerja dari presensi aktif mereka;
     * - `aktif_sejak`  : waktu check-in yang masih aktif (ISO);
     * - `last_seen`    : timestamp lokasi GPS TERAKHIR hari ini
     *                    (null bila belum ada GPS tercatat hari ini);
     * - `point_count`  : jumlah titik GPS hari ini.
     *
     * Freshness / stale-state dihitung klien dari `last_seen`. Daftar ini
     * BUKAN janji realtime — app wajib menyebut keterlambatannya bila lama.
     * Khusus role Owner / Admin.
     */
    public function activeUsers(Request $request)
    {
        $currentUser = $request->user();

        if (! $currentUser->isOwner() && ! $currentUser->isAdmin()) {
            return $this->error('Anda tidak berhak melihat data ini.', 403);
        }

        $today = now()->toDateString();

        $presensis = Presensi::with(['karyawan.user', 'karyawan', 'titik'])
            ->whereDate('check_in', $today)
            ->whereNull('check_out')
            ->orderByDesc('check_in')
            ->get();

        $karyawanIds = $presensis->pluck('karyawan_id')->filter()->values();

        // GPS terakhir & jumlah titik hari ini per karyawan (anti N+1).
        $lastLocations = MobileTrackingLocation::selectRaw('karyawan_id, max(recorded_at) as last_seen')
            ->whereIn('karyawan_id', $karyawanIds)
            ->whereDate('recorded_at', $today)
            ->groupBy('karyawan_id')
            ->pluck('last_seen', 'karyawan_id');

        $pointCounts = MobileTrackingLocation::selectRaw('karyawan_id, count(*) as point_count')
            ->whereIn('karyawan_id', $karyawanIds)
            ->whereDate('recorded_at', $today)
            ->groupBy('karyawan_id')
            ->pluck('point_count', 'karyawan_id');

        $items = $presensis
            ->filter(fn (Presensi $p) => $p->karyawan !== null && $p->karyawan->user !== null)
            ->map(function (Presensi $p) use ($lastLocations, $pointCounts) {
                $lastSeen = $lastLocations[$p->karyawan_id] ?? null;

                return [
                    'karyawan_id' => $p->karyawan_id,
                    'nama' => $p->karyawan->nama,
                    'user_id' => $p->karyawan->user_id,
                    'titik' => $p->titik?->nama,
                    'aktif_sejak' => $p->check_in?->toIso8601String(),
                    'last_seen' => $lastSeen ? Carbon::parse($lastSeen)->toIso8601String() : null,
                    'point_count' => (int) ($pointCounts[$p->karyawan_id] ?? 0),
                ];
            })
            ->values();

        return $this->success([
            'total' => $items->count(),
            'items' => $items,
        ], 'Karyawan ber-presensi aktif & status GPS.');
    }
}
