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
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SewaAlatJam::with(['armada', 'proyek']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('penyewa_eksternal', 'like', "%{$search}%")
                  ->orWhereHas('armada', fn ($a) => $a->where('nama_unit', 'like', "%{$search}%")->orWhere('nomor_polisi', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('armada_id')) {
            $query->where('armada_id', $request->armada_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sewaList = $query->orderByDesc('tanggal')->orderByDesc('created_at')->paginate(15)->withQueryString();

        $totalAktif = SewaAlatJam::where('status', 'disetujui')->count();
        $hmBulan = SewaAlatJam::whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year)->sum('jumlah_jam');
        $pendapatanBulan = SewaAlatJam::whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year)
            ->get()->sum(fn ($s) => $s->jumlah_jam * $s->harga_per_jam_snapshot);
        $alatTersewa = SewaAlatJam::whereNull('hm_akhir')->distinct('armada_id')->count('armada_id');

        $armadaList = Armada::select('id', 'nama_unit', 'nomor_polisi')->orderBy('nama_unit')->get();

        return Inertia::render('Fleet/SewaAlat/Index', [
            'sewaList' => $sewaList,
            'filters' => $request->only(['search', 'armada_id', 'status']),
            'armadaList' => $armadaList,
            'stats' => [
                'total_aktif' => $totalAktif,
                'hm_bulan' => $hmBulan,
                'pendapatan_bulan' => $pendapatanBulan,
                'alat_tersewa' => $alatTersewa,
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $armadaList = Armada::select('id', 'nama_unit', 'nomor_polisi', 'jenis')->orderBy('nama_unit')->get();
        $proyekList = Proyek::select('id', 'nama_proyek')->get();

        return Inertia::render('Fleet/SewaAlat/Create', [
            'armadaList' => $armadaList,
            'proyekList' => $proyekList,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
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

    public function show(string $id)
    {
        $sewa = SewaAlatJam::with(['armada', 'proyek'])->findOrFail($id);
        return response()->json($sewa);
    }
}
