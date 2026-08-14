<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Core\Models\Proyek;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class SewaAlatController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', SewaAlatJam::class);

        $query = SewaAlatJam::with(['armada', 'proyek']);

        if ($request->user()->unit_bisnis_id) {
            $query->whereHas('armada', function ($q) use ($request) {
                $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('penyewa_eksternal', 'like', "%{$search}%")
                  ->orWhereHas('armada', fn ($a) => $a->where('kode_unit', 'like', "%{$search}%")->orWhere('plat_nomor', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('armada_id')) {
            $query->where('armada_id', $request->armada_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sewaList = $query->orderByDesc('tanggal')->orderByDesc('created_at')->paginate(15)->withQueryString();

        $baseStatsQuery = SewaAlatJam::query();
        if ($request->user()->unit_bisnis_id) {
            $baseStatsQuery->whereHas('armada', function ($q) use ($request) {
                $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
            });
        }
        $statsMonthQuery = (clone $baseStatsQuery)
            ->whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year);

        $totalAktif = (clone $baseStatsQuery)->where('status', 'disetujui')->count();
        $hmBulan = (clone $statsMonthQuery)->sum('jumlah_jam');
        $pendapatanBulan = (clone $statsMonthQuery)->get()->sum(fn ($s) => $s->jumlah_jam * $s->harga_per_jam_snapshot);
        $alatTersewa = (clone $baseStatsQuery)->whereNull('hm_akhir')->distinct('armada_id')->count('armada_id');

        $armadaListQuery = Armada::query();
        if ($request->user()->unit_bisnis_id) {
            $armadaListQuery->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
        }
        $armadaList = $armadaListQuery->select('id', 'kode_unit', 'plat_nomor')->orderBy('kode_unit')->get();

        return Inertia::render('Fleet/SewaAlat/Index', [
            'sewaList' => $sewaList,
            'filters' => $request->only(['search', 'armada_id', 'status']),
            'armadaList' => $armadaList,
            'stats' => [
                'total_aktif' => $totalAktif,
                'hm_bulan' => $hmBulan,
                'pendapatan_bulan' => $pendapatanBulan,
                'alat_tersewa' => $alatTersewa,
            ],
            'can' => [
                'create' => $request->user()->can('create', SewaAlatJam::class),
            ],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', SewaAlatJam::class);

        $user = $request->user();
        $armadaQuery = Armada::query();
        if ($user->unit_bisnis_id) {
            $armadaQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }
        $armadaList = $armadaQuery->select('id', 'kode_unit', 'plat_nomor', 'jenis')->orderBy('kode_unit')->get();
        $proyekQuery = Proyek::query();
        if ($user->unit_bisnis_id) {
            $proyekQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }
        $proyekList = $proyekQuery->select('id', 'nama')->get();

        return Inertia::render('Fleet/SewaAlat/Create', [
            'armadaList' => $armadaList,
            'proyekList' => $proyekList,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', SewaAlatJam::class);

        $validated = $request->validate([
            'armada_id'        => 'required|exists:armadas,id',
            'proyek_id'        => 'nullable|exists:proyeks,id',
            'nama_pelanggan'   => 'required|string|max:255',
            'tanggal_mulai'    => 'required|date',
            'tanggal_selesai'  => 'nullable|date|after_or_equal:tanggal_mulai',
            'hm_awal'          => 'required|numeric|min:0',
            'hm_akhir'         => 'nullable|numeric|gte:hm_awal',
            'tarif_per_jam'    => 'required|numeric|min:0',
            'catatan'          => 'nullable|string',
        ]);

        $jumlahJam = null;
        if (!empty($validated['hm_akhir']) && !empty($validated['hm_awal'])) {
            $jumlahJam = max(0, floatval($validated['hm_akhir']) - floatval($validated['hm_awal']));
        }

        SewaAlatJam::create([
            'armada_id'              => $validated['armada_id'],
            'proyek_id'              => $validated['proyek_id'] ?? null,
            'penyewa_eksternal'      => $validated['nama_pelanggan'],
            'tanggal'                => $validated['tanggal_mulai'],
            'hm_awal'                => $validated['hm_awal'],
            'hm_akhir'               => $validated['hm_akhir'] ?? null,
            'jumlah_jam'             => $jumlahJam,
            'harga_per_jam_snapshot' => $validated['tarif_per_jam'],
            'status'                 => 'disetujui',
            'catatan'                => $validated['catatan'] ?? null,
        ]);

        return redirect()->route('fleet.sewa-alat.index')->with('success', 'Pencatatan sewa alat berat berhasil disimpan.');
    }

    public function show(Request $request, string $id)
    {
        $sewa = SewaAlatJam::with(['armada', 'proyek'])->findOrFail($id);
        $this->authorize('view', $sewa);
        return response()->json($sewa);
    }
}
