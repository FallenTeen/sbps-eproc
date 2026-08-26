<?php

namespace App\Domain\Core\Http\Controllers;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TitikController extends Controller
{
    public function index(Request $request, Proyek $proyek)
    {
        $this->authorize('viewAny', Titik::class);

        $query = Titik::with(['proyek'])->where('proyek_id', $proyek->id);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('nama', 'like', "%{$search}%");
        }

        $titiks = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Core/Titik/Index', [
            'proyek' => $proyek->load('unitBisnis'),
            'titiks' => $titiks,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Titik::class);

        $proyeksQuery = Proyek::where('status', 'aktif');
        if ($request->user()->unit_bisnis_id) {
            $proyeksQuery->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
        }
        $proyeks = $proyeksQuery->get();
        $selectedProyek = $request->proyek_id ?? null;

        return Inertia::render('Core/Titik/Create', [
            'proyeks' => $proyeks,
            'selectedProyek' => $selectedProyek,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Titik::class);

        $validated = $request->validate([
            'proyek_id' => 'required|exists:proyeks,id',
            'nama' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'radius_presensi_meter' => 'nullable|integer|min:0',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $titik = Titik::create($validated);

        return redirect()->route('core.titik.index', $titik->proyek_id)
            ->with('success', 'Titik berhasil dibuat.');
    }

    public function show(Titik $titik)
    {
        $this->authorize('view', $titik);

        $titik->load(['proyek', 'rab', 'armadas', 'mesinProduksis', 'karyawanAssignments.karyawan']);

        return Inertia::render('Core/Titik/Show', [
            'titik' => $titik,
        ]);
    }

    public function edit(Titik $titik)
    {
        $this->authorize('update', $titik);

        $proyeksQuery = Proyek::where('status', 'aktif');
        if (auth()->user()->unit_bisnis_id) {
            $proyeksQuery->where('unit_bisnis_id', auth()->user()->unit_bisnis_id);
        }
        $proyeks = $proyeksQuery->get();

        return Inertia::render('Core/Titik/Edit', [
            'titik' => $titik,
            'proyeks' => $proyeks,
        ]);
    }

    public function update(Request $request, Titik $titik)
    {
        $this->authorize('update', $titik);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'radius_presensi_meter' => 'nullable|integer|min:0',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $titik->update($validated);

        return redirect()->route('core.titik.show', $titik)
            ->with('success', 'Titik berhasil diperbarui.');
    }

    public function destroy(Titik $titik)
    {
        $this->authorize('delete', $titik);

        $proyekId = $titik->proyek_id;

        if ($titik->rab()->exists()) {
            return back()->with('error', 'Titik memiliki RAB, tidak bisa dihapus.');
        }
        if ($titik->armadas()->exists()) {
            return back()->with('error', 'Titik memiliki Armada, tidak bisa dihapus.');
        }
        if ($titik->mesinProduksis()->exists()) {
            return back()->with('error', 'Titik memiliki Mesin Produksi, tidak bisa dihapus.');
        }

        $titik->delete();

        return redirect()->route('core.titik.index', $proyekId)
            ->with('success', 'Titik berhasil dihapus.');
    }
}
