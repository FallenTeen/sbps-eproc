<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\GetCurrentRuteTarifAction;
use App\Domain\Fleet\Models\RuteTarif;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RuteTarifController extends Controller
{
    /**
     * Display a listing of rute tarif.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', RuteTarif::class);

        $query = RuteTarif::with('unitBisnis');

        if ($request->user()->unit_bisnis_id) {
            $query->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('lokasi_asal', 'like', "%{$search}%")
                    ->orWhere('lokasi_tujuan', 'like', "%{$search}%");
            });
        }

        if ($request->filled('unit_bisnis_id')) {
            $query->where('unit_bisnis_id', $request->unit_bisnis_id);
        }

        $ruteTarifs = $query->orderBy('lokasi_asal')->orderBy('lokasi_tujuan')->paginate(15)->withQueryString();

        $unitBisnisQuery = UnitBisnis::where('aktif', true);
        if ($request->user()->unit_bisnis_id) {
            $unitBisnisQuery->where('id', $request->user()->unit_bisnis_id);
        }
        $unitBisnis = $unitBisnisQuery->get();

        return Inertia::render('Fleet/RuteTarif/Index', [
            'ruteTarifs' => $ruteTarifs,
            'unitBisnis' => $unitBisnis,
            'filters' => $request->only(['search', 'unit_bisnis_id']),
        ]);
    }

    /**
     * Show the form for creating a new rute tarif.
     */
    public function create(Request $request)
    {
        $this->authorize('create', RuteTarif::class);

        $unitBisnisQuery = UnitBisnis::where('aktif', true);
        if ($request->user()->unit_bisnis_id) {
            $unitBisnisQuery->where('id', $request->user()->unit_bisnis_id);
        }
        $unitBisnis = $unitBisnisQuery->get();

        return Inertia::render('Fleet/RuteTarif/Create', ['unitBisnis' => $unitBisnis]);
    }

    /**
     * Store a newly created rute tarif.
     */
    public function store(Request $request)
    {
        $this->authorize('create', RuteTarif::class);

        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'lokasi_asal' => 'required|string|max:255',
            'lokasi_tujuan' => 'required|string|max:255',
            'jarak_km' => 'required|numeric|min:0',
            'tarif_per_rit' => 'required|numeric|min:0',
            'indeks_liter_solar_per_km' => 'nullable|numeric|min:0',
            'berlaku_dari' => 'required|date',
            'berlaku_sampai' => 'nullable|date|after_or_equal:berlaku_dari',
        ]);

        RuteTarif::create($validated);

        return redirect()->route('fleet.rute-tarif.index')
            ->with('success', 'Rute tarif berhasil dibuat.');
    }

    /**
     * Display the specified rute tarif.
     */
    public function show(RuteTarif $ruteTarif)
    {
        $this->authorize('view', $ruteTarif);

        $ruteTarif->load('unitBisnis');

        return Inertia::render('Fleet/RuteTarif/Show', ['ruteTarif' => $ruteTarif]);
    }

    /**
     * Show the form for editing the specified rute tarif.
     */
    public function edit(RuteTarif $ruteTarif, Request $request)
    {
        $this->authorize('update', $ruteTarif);

        $unitBisnisQuery = UnitBisnis::where('aktif', true);
        if ($request->user()->unit_bisnis_id) {
            $unitBisnisQuery->where('id', $request->user()->unit_bisnis_id);
        }
        $unitBisnis = $unitBisnisQuery->get();

        return Inertia::render('Fleet/RuteTarif/Edit', [
            'ruteTarif' => $ruteTarif,
            'unitBisnis' => $unitBisnis,
        ]);
    }

    /**
     * Update the specified rute tarif.
     */
    public function update(Request $request, RuteTarif $ruteTarif)
    {
        $this->authorize('update', $ruteTarif);

        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'lokasi_asal' => 'required|string|max:255',
            'lokasi_tujuan' => 'required|string|max:255',
            'jarak_km' => 'required|numeric|min:0',
            'tarif_per_rit' => 'required|numeric|min:0',
            'indeks_liter_solar_per_km' => 'nullable|numeric|min:0',
            'berlaku_dari' => 'required|date',
            'berlaku_sampai' => 'nullable|date|after_or_equal:berlaku_dari',
        ]);

        $ruteTarif->update($validated);

        return redirect()->route('fleet.rute-tarif.index')
            ->with('success', 'Rute tarif berhasil diperbarui.');
    }

    /**
     * Remove the specified rute tarif.
     */
    public function destroy(RuteTarif $ruteTarif)
    {
        $this->authorize('delete', $ruteTarif);

        if ($ruteTarif->ritases()->exists()) {
            return back()->with('error', 'Rute tarif sudah dipakai pada ritase, tidak bisa dihapus.');
        }

        $ruteTarif->delete();

        return redirect()->route('fleet.rute-tarif.index')
            ->with('success', 'Rute tarif dihapus.');
    }

    /**
     * Update tarif per rit (harga) untuk rute tarif.
     */
    public function setHarga(Request $request, RuteTarif $ruteTarif)
    {
        $this->authorize('setHarga', $ruteTarif);

        $validated = $request->validate([
            'tarif_per_rit' => 'required|numeric|min:0',
            'berlaku_dari' => 'required|date',
        ]);

        $ruteTarif->update([
            'tarif_per_rit' => $validated['tarif_per_rit'],
            'berlaku_dari' => $validated['berlaku_dari'],
        ]);

        return back()->with('success', 'Tarif rute berhasil diperbarui.');
    }

    /**
     * Ambil tarif rute yang sedang berlaku untuk kombinasi asal-tujuan.
     */
    public function current(Request $request, string $asal, string $tujuan)
    {
        $this->authorize('viewAny', RuteTarif::class);

        $rute = (new GetCurrentRuteTarifAction)->execute($asal, $tujuan, $request->query('tanggal'));

        return response()->json([
            'found' => (bool) $rute,
            'ruteTarif' => $rute,
        ]);
    }
}
