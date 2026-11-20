<?php

namespace App\Domain\Core\Http\Controllers;

use App\Domain\Core\Models\KomunikasiLog;
use App\Domain\Core\Models\Proyek;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Sisi KANTOR dari thread komunikasi per proyek (kantor↔produksi↔kontraktor).
 * Kontraktor memakai portal `kontraktor.*`; role internal memakai modul ini.
 * Semua query discoping via Proyek::visibleFor + unit_bisnis_id (privilege role).
 */
class KomunikasiController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Proyek::class);

        $query = Proyek::with(['unitBisnis:id,nama'])
            ->withCount('komunikasiLogs as pesan_count')
            ->withMax('komunikasiLogs', 'created_at')
            ->visibleFor($request->user());

        if ($request->user()->unit_bisnis_id) {
            $query->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('kode_proyek', 'like', "%{$search}%")
                    ->orWhere('nama', 'like', "%{$search}%")
                    ->orWhere('client', 'like', "%{$search}%");
            });
        }

        $proyeks = $query
            ->orderByDesc('komunikasi_logs_max_created_at')
            ->orderBy('nama')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Core/Komunikasi/Index', [
            'proyeks' => $proyeks,
            'filters' => $request->only('search'),
        ]);
    }

    public function show(Request $request, Proyek $proyek)
    {
        $this->authorize('view', $proyek);

        if (! Proyek::visibleFor($request->user())->whereKey($proyek->id)->exists()) {
            abort(403, 'Akses ditolak.');
        }

        $komunikasiLogs = $proyek->komunikasiLogs()
            ->with('user:id,name,nama_lengkap')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn (KomunikasiLog $log) => [
                'id' => $log->id,
                'pengirim' => $log->user ? ($log->user->nama_lengkap ?? $log->user->name) : 'Sistem',
                'pengirim_role' => $log->pengirim_role,
                'pesan' => $log->pesan,
                'waktu' => $log->created_at ? $log->created_at->format('d/m/Y H:i') : '',
            ]);

        return Inertia::render('Core/Komunikasi/Show', [
            'proyek' => [
                'id' => $proyek->id,
                'kode_proyek' => $proyek->kode_proyek,
                'nama' => $proyek->nama,
                'client' => $proyek->client,
                'lokasi' => $proyek->lokasi,
                'status' => $proyek->status,
                'tipe_proyek' => $proyek->tipe_proyek,
                'unit_bisnis' => $proyek->unitBisnis?->nama,
            ],
            'komunikasiLogs' => $komunikasiLogs,
        ]);
    }

    public function sendMessage(Request $request, Proyek $proyek)
    {
        $this->authorize('view', $proyek);

        if (! Proyek::visibleFor($request->user())->whereKey($proyek->id)->exists()) {
            abort(403, 'Akses ditolak.');
        }

        $validated = $request->validate([
            'pesan' => 'required|string|max:1000',
        ]);

        $proyek->komunikasiLogs()->create([
            'user_id' => $request->user()->id,
            'pengirim_role' => 'kantor',
            'pesan' => $validated['pesan'],
        ]);

        return redirect()->route('komunikasi.show', $proyek)
            ->with('success', 'Pesan berhasil terkirim.');
    }
}