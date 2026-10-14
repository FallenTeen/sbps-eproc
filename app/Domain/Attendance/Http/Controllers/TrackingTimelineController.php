<?php

namespace App\Domain\Attendance\Http\Controllers;

use App\Domain\Attendance\Models\MobileTrackingLocation;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Attendance\Services\TrackingTimelineService;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Halaman tracking linimasa (web, KHUSUS Owner).
 */
class TrackingTimelineController extends Controller
{
    public function index(Request $request, TrackingTimelineService $service)
    {
        $tanggal = $request->filled('tanggal') ? $request->input('tanggal') : now()->toDateString();
        $karyawanId = $request->input('karyawan_id');
        $presensiId = $request->input('presensi_id');

        $query = Presensi::with(['karyawan', 'titik'])->whereDate('check_in', $tanggal);
        if ($karyawanId) {
            $query->where('karyawan_id', $karyawanId);
        }
        $presensis = $query->orderByDesc('check_in')->get();

        $karyawanIds = $presensis->pluck('karyawan_id')->filter()->unique()->values();

        $lastSeen = MobileTrackingLocation::query()
            ->whereIn('karyawan_id', $karyawanIds)
            ->whereDate('recorded_at', $tanggal)
            ->selectRaw('karyawan_id, max(recorded_at) as last_seen')
            ->groupBy('karyawan_id')
            ->pluck('last_seen', 'karyawan_id');

        $pointCounts = MobileTrackingLocation::query()
            ->whereIn('karyawan_id', $karyawanIds)
            ->whereDate('recorded_at', $tanggal)
            ->selectRaw('karyawan_id, count(*) as total')
            ->groupBy('karyawan_id')
            ->pluck('total', 'karyawan_id');

        $rows = $presensis->map(fn (Presensi $p) => [
            'id' => $p->id,
            'nama' => $p->karyawan?->nama,
            'titik' => $p->titik?->nama,
            'check_in' => $p->check_in?->toIso8601String(),
            'check_out' => $p->check_out?->toIso8601String(),
            'last_seen' => isset($lastSeen[$p->karyawan_id])
                ? Carbon::parse($lastSeen[$p->karyawan_id])->toIso8601String()
                : null,
            'point_count' => (int) ($pointCounts[$p->karyawan_id] ?? 0),
        ])->values();

        $selected = null;
        if ($presensiId) {
            $target = $presensis->firstWhere('id', $presensiId)
                ?? Presensi::with(['karyawan', 'titik'])->find($presensiId);

            if ($target) {
                $selected = [
                    'id' => $target->id,
                    'nama' => $target->karyawan?->nama,
                    'titik' => $target->titik ? [
                        'nama' => $target->titik->nama,
                        'latitude' => $target->titik->latitude,
                        'longitude' => $target->titik->longitude,
                        'radius_presensi_meter' => $target->titik->radius_presensi_meter,
                    ] : null,
                    'tracking' => $service->forPresensi($target),
                ];
            }
        }

        return Inertia::render('Attendance/Tracking/Index', [
            'rows' => $rows,
            'selected' => $selected,
            'karyawan' => Karyawan::aktif()->get(['id', 'nama']),
            'filters' => [
                'tanggal' => $tanggal,
                'karyawan_id' => $karyawanId,
                'presensi_id' => $presensiId,
            ],
        ]);
    }
}
