<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Core\Models\Proyek;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class RitaseController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Ritase::class);

        $query = Ritase::with(['armada', 'driver', 'ruteTarif', 'proyek']);

        if ($request->user()->unit_bisnis_id) {
            $query->whereHas('armada', function ($q) use ($request) {
                $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('driver', fn ($d) => $d->where('nama', 'like', "%{$search}%"))
                  ->orWhereHas('armada', fn ($a) => $a->where('kode_unit', 'like', "%{$search}%")->orWhere('plat_nomor', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('armada_id')) {
            $query->where('armada_id', $request->armada_id);
        }

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->tanggal);
        }

        $ritase = $query->orderByDesc('tanggal')->orderByDesc('created_at')->paginate(15)->withQueryString();

        $today = Carbon::today();
        $baseStatsQuery = Ritase::query();
        if ($request->user()->unit_bisnis_id) {
            $baseStatsQuery->whereHas('armada', function ($q) use ($request) {
                $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
            });
        }

        $statsTodayQuery = (clone $baseStatsQuery)->whereDate('tanggal', $today);
        $statsMonthQuery = (clone $baseStatsQuery)
            ->whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year);

        $totalTripToday = (clone $statsTodayQuery)->sum('jumlah_rit');
        $totalUpahBulan = (clone $statsMonthQuery)->get()->sum(fn ($r) => $r->total_upah_rit);
        $armadaBeroperasi = (clone $statsTodayQuery)->distinct('armada_id')->count('armada_id');

        $armadaListQuery = Armada::query();
        if ($request->user()->unit_bisnis_id) {
            $armadaListQuery->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
        }
        $armadaList = $armadaListQuery->select('id', 'kode_unit', 'plat_nomor')->orderBy('kode_unit')->get();

        return Inertia::render('Fleet/Ritase/Index', [
            'ritase' => $ritase,
            'filters' => $request->only(['search', 'armada_id', 'tanggal']),
            'armadaList' => $armadaList,
            'stats' => [
                'total_trip_today' => $totalTripToday,
                'total_volume_today' => 0,
                'total_upah_bulan' => $totalUpahBulan,
                'armada_beroperasi' => $armadaBeroperasi,
            ],
            'can' => [
                'create' => $request->user()->can('create', Ritase::class),
            ],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Ritase::class);

        $user = $request->user();
        $armadaQuery = Armada::query();
        if ($user->unit_bisnis_id) {
            $armadaQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }
        $armadaList = $armadaQuery->select('id', 'kode_unit', 'plat_nomor', 'jenis')->orderBy('kode_unit')->get();
        $ruteList = RuteTarif::select('id', 'lokasi_asal', 'lokasi_tujuan', 'tarif_per_rit')->get();
        $driverList = Karyawan::select('id', 'nama')->where('status', 'aktif')->get();
        $proyekQuery = Proyek::query();
        if ($user->unit_bisnis_id) {
            $proyekQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }
        $proyekList = $proyekQuery->select('id', 'nama')->get();

        return Inertia::render('Fleet/Ritase/Create', [
            'armadaList' => $armadaList,
            'ruteList'   => $ruteList,
            'driverList' => $driverList,
            'proyekList' => $proyekList,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Ritase::class);

        $validated = $request->validate([
            'armada_id'     => 'required|exists:armadas,id',
            'karyawan_id'   => 'required|exists:karyawans,id',
            'rute_tarif_id' => 'required|exists:rute_tarifs,id',
            'proyek_id'     => 'nullable|exists:proyeks,id',
            'tanggal'       => 'required|date',
            'jumlah_trip'   => 'required|integer|min:1',
            'catatan'       => 'nullable|string',
        ]);

        $rute = RuteTarif::findOrFail($validated['rute_tarif_id']);

        Ritase::create([
            'armada_id'              => $validated['armada_id'],
            'driver_karyawan_id'     => $validated['karyawan_id'],
            'rute_tarif_id'          => $validated['rute_tarif_id'],
            'proyek_id'              => $validated['proyek_id'] ?? null,
            'tanggal'                => $validated['tanggal'],
            'jumlah_rit'             => $validated['jumlah_trip'],
            'tarif_per_rit_snapshot' => $rute->tarif_per_rit,
            'status'                 => 'disetujui',
            'catatan'                => $validated['catatan'] ?? null,
        ]);

        return redirect()->route('fleet.ritase.index')->with('success', 'Ritase harian berhasil dicatat.');
    }

    public function show(Request $request, string $id)
    {
        $ritase = Ritase::with(['armada', 'driver', 'ruteTarif', 'proyek', 'biayaLain'])->findOrFail($id);
        $this->authorize('view', $ritase);
        return response()->json($ritase);
    }
}
