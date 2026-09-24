<?php

namespace App\Domain\Core\Http\Controllers;

use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\UnitBisnis;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProyekController extends Controller
{
    /**
     * Display a listing of proyek.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Proyek::class);

        $query = Proyek::with(['unitBisnis', 'titik', 'rab']);

        // Defense-in-depth: scoping object-level (pivot proyek_user / unit bisnis).
        $query->visibleFor($request->user());

        if ($request->user()->unit_bisnis_id) {
            $query->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
        }

        if ($request->has('unit_bisnis_id') && $request->unit_bisnis_id) {
            $query->where('unit_bisnis_id', $request->unit_bisnis_id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('kode_proyek', 'like', "%{$search}%")
                    ->orWhere('nama', 'like', "%{$search}%")
                    ->orWhere('client', 'like', "%{$search}%");
            });
        }

        $proyeks = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        $unitBisnisQuery = UnitBisnis::where('aktif', true);
        if ($request->user()->unit_bisnis_id) {
            $unitBisnisQuery->where('id', $request->user()->unit_bisnis_id);
        }
        $unitBisnis = $unitBisnisQuery->get();

        return Inertia::render('Core/Proyek/Index', [
            'proyeks' => $proyeks,
            'unitBisnis' => $unitBisnis,
            'filters' => $request->only(['unit_bisnis_id', 'status', 'search']),
        ]);
    }

    /**
     * Show form to create a new proyek.
     */
    public function create()
    {
        $this->authorize('create', Proyek::class);

        $unitBisnisQuery = UnitBisnis::where('aktif', true);
        if (auth()->user()->unit_bisnis_id) {
            $unitBisnisQuery->where('id', auth()->user()->unit_bisnis_id);
        }
        $unitBisnis = $unitBisnisQuery->get();

        return Inertia::render('Core/Proyek/Create', [
            'unitBisnis' => $unitBisnis,
        ]);
    }

    /**
     * Store a newly created proyek.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Proyek::class);

        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'kode_proyek' => 'required|string|max:50|unique:proyeks',
            'nama' => 'required|string|max:255',
            'tipe_proyek' => 'required|in:internal,kontrak_klien',
            'client' => 'nullable|string|max:255|required_if:tipe_proyek,kontrak_klien',
            'lokasi' => 'nullable|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai_rencana' => 'nullable|date|after_or_equal:tanggal_mulai',
            'tanggal_selesai_aktual' => 'nullable|date|after_or_equal:tanggal_mulai',
            'status' => 'required|in:draft,aktif,selesai,dihentikan',
            'catatan' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();

        $proyek = Proyek::create($validated);

        return redirect()->route('core.proyek.index')
            ->with('success', 'Proyek berhasil dibuat.');
    }

    /**
     * Display the specified proyek with details.
     */
    public function show(Proyek $proyek)
    {
        $this->authorize('view', $proyek);

        $proyek->load([
            'unitBisnis',
            'titik',
            'rab',
            'purchaseOrders' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(10);
            },
        ]);

        // Hitung realisasi RAB per kategori (menggunakan action)
        $rabRealisasi = [];
        foreach ($proyek->rab as $rab) {
            $rabRealisasi[] = [
                'rab' => $rab,
                'realisasi' => app(GetRABRealisasiAction::class)->execute($rab),
            ];
        }

        // Statistik ringkas
        $stats = [
            'total_titik' => $proyek->titik->count(),
            'total_rab' => $proyek->rab->sum('rencana'),
            'total_po' => $proyek->purchaseOrders->count(),
            'total_po_nominal' => $proyek->purchaseOrders->sum('total'),
        ];

        return Inertia::render('Core/Proyek/Show', [
            'proyek' => $proyek,
            'rabRealisasi' => $rabRealisasi,
            'stats' => $stats,
        ]);
    }

    /**
     * Show form to edit proyek.
     */
    public function edit(Proyek $proyek)
    {
        $this->authorize('update', $proyek);

        $unitBisnis = UnitBisnis::where('aktif', true)->get();

        return Inertia::render('Core/Proyek/Edit', [
            'proyek' => $proyek,
            'unitBisnis' => $unitBisnis,
        ]);
    }

    /**
     * Update the specified proyek.
     */
    public function update(Request $request, Proyek $proyek)
    {
        $this->authorize('update', $proyek);

        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'kode_proyek' => 'required|string|max:50|unique:proyeks,kode_proyek,'.$proyek->id,
            'nama' => 'required|string|max:255',
            'tipe_proyek' => 'required|in:internal,kontrak_klien',
            'client' => 'nullable|string|max:255|required_if:tipe_proyek,kontrak_klien',
            'lokasi' => 'nullable|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai_rencana' => 'nullable|date|after_or_equal:tanggal_mulai',
            'tanggal_selesai_aktual' => 'nullable|date|after_or_equal:tanggal_mulai',
            'status' => 'required|in:draft,aktif,selesai,dihentikan',
            'catatan' => 'nullable|string',
        ]);

        $proyek->update($validated);

        return redirect()->route('core.proyek.show', $proyek)
            ->with('success', 'Proyek berhasil diperbarui.');
    }

    /**
     * Remove the specified proyek.
     */
    public function destroy(Proyek $proyek)
    {
        $this->authorize('delete', $proyek);

        if ($proyek->purchaseOrders()->exists()) {
            return back()->with('error', 'Proyek memiliki Purchase Order, tidak bisa dihapus.');
        }
        if ($proyek->titik()->exists()) {
            return back()->with('error', 'Proyek memiliki Titik, tidak bisa dihapus.');
        }
        if ($proyek->rab()->exists()) {
            return back()->with('error', 'Proyek memiliki RAB, tidak bisa dihapus.');
        }

        $proyek->delete();

        return redirect()->route('core.proyek.index')
            ->with('success', 'Proyek berhasil dihapus.');
    }
}
