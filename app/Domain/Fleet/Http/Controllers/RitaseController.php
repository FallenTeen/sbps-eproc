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
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Ritase::with(['armada', 'driver', 'ruteTarif', 'proyek']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('driver', fn ($d) => $d->where('nama', 'like', "%{$search}%"))
                  ->orWhereHas('armada', fn ($a) => $a->where('nama_unit', 'like', "%{$search}%")->orWhere('nomor_polisi', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('armada_id')) {
            $query->where('armada_id', $request->armada_id);
        }

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->tanggal);
        }

        $ritase = $query->orderByDesc('tanggal')->orderByDesc('created_at')->paginate(15)->withQueryString();

        // Calculate statistics for dashboard header
        $today = Carbon::today();
        $totalTripToday = Ritase::whereDate('tanggal', $today)->sum('jumlah_rit');
        $totalUpahBulan = Ritase::whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year)
            ->get()->sum(fn ($r) => $r->total_upah_rit);
        $armadaBeroperasi = Ritase::whereDate('tanggal', $today)->distinct('armada_id')->count('armada_id');

        $armadaList = Armada::select('id', 'nama_unit', 'nomor_polisi')->orderBy('nama_unit')->get();

        return Inertia::render('Fleet/Ritase/Index', [
            'ritase' => $ritase,
            'filters' => $request->only(['search', 'armada_id', 'tanggal']),
            'armadaList' => $armadaList,
            'stats' => [
                'total_trip_today' => $totalTripToday,
                'total_volume_today' => 0,
                'total_upah_bulan' => $totalUpahBulan,
                'armada_beroperasi' => $armadaBeroperasi,
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $armadaList = Armada::select('id', 'nama_unit', 'nomor_polisi', 'jenis')->orderBy('nama_unit')->get();
        $ruteList = RuteTarif::select('id', 'nama_rute', 'tarif_per_trip', 'lokasi_muat', 'lokasi_bongkar')->get();
        $driverList = Karyawan::select('id', 'nama as nama_lengkap')->where('status', 'aktif')->get();
        $proyekList = Proyek::select('id', 'nama_proyek')->get();

        return Inertia::render('Fleet/Ritase/Create', [
            'armadaList' => $armadaList,
            'ruteList'   => $ruteList,
            'driverList' => $driverList,
            'proyekList' => $proyekList,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
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
            'tarif_per_rit_snapshot' => $rute->tarif_per_trip,
            'status'                 => 'disetujui',
            'catatan'                => $validated['catatan'] ?? null,
        ]);

        return redirect()->route('fleet.ritase.index')->with('success', 'Ritase harian berhasil dicatat.');
    }

    public function show(string $id)
    {
        $ritase = Ritase::with(['armada', 'driver', 'ruteTarif', 'proyek', 'biayaLain'])->findOrFail($id);
        return response()->json($ritase);
    }
}
