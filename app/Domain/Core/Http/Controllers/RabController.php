<?php

namespace App\Domain\Core\Http\Controllers;

use App\Domain\Core\Actions\CompareRABRealisasiAction;
use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Actions\SetRABAction;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RabController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Rab::class);

        $query = Rab::with(['proyek', 'titik']);

        $query->whereHas('proyek', function ($q) use ($request) {
            $q->visibleFor($request->user());
            if ($request->user()->unit_bisnis_id) {
                $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
            }
        });

        if ($request->has('proyek_id')) {
            $query->where('proyek_id', $request->proyek_id);
        }

        $rabs = $query->paginate(15)->withQueryString();
        $proyeksQuery = Proyek::where('status', 'aktif')->visibleFor($request->user());
        if ($request->user()->unit_bisnis_id) {
            $proyeksQuery->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
        }
        $proyeks = $proyeksQuery->get();

        return Inertia::render('Core/Rab/Index', [
            'rabs' => $rabs,
            'proyeks' => $proyeks,
            'filters' => $request->only('proyek_id'),
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Rab::class);

        $proyeksQuery = Proyek::where('status', 'aktif')->visibleFor($request->user());
        if ($request->user()->unit_bisnis_id) {
            $proyeksQuery->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
        }
        $proyeks = $proyeksQuery->get();
        $selectedProyek = $request->proyek_id ?? null;

        return Inertia::render('Core/Rab/Create', [
            'proyeks' => $proyeks,
            'selectedProyek' => $selectedProyek,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Rab::class);

        $validated = $request->validate([
            'proyek_id' => 'required|exists:proyeks,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'kategori' => 'required|in:bahan_baku,sparepart,sdm_tetap,sdm_kondisional,lainnya',
            'rencana' => 'required|numeric|min:0',
            'catatan' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();
        (new SetRABAction)->execute($validated);

        return redirect()->route('core.rab.index')
            ->with('success', 'RAB berhasil ditambahkan.');
    }

    public function show(Rab $rab)
    {
        $this->authorize('view', $rab);

        $realisasi = (new GetRABRealisasiAction)->execute($rab);
        $perbandingan = (new CompareRABRealisasiAction)->execute($rab);

        return Inertia::render('Core/Rab/Show', [
            'rab' => $rab->load(['proyek', 'titik']),
            'realisasi' => $realisasi,
            'perbandingan' => $perbandingan,
        ]);
    }

    public function edit(Rab $rab)
    {
        $this->authorize('update', $rab);

        $proyeksQuery = Proyek::where('status', 'aktif')->visibleFor(auth()->user());
        if (auth()->user()->unit_bisnis_id) {
            $proyeksQuery->where('unit_bisnis_id', auth()->user()->unit_bisnis_id);
        }
        $proyeks = $proyeksQuery->get();

        return Inertia::render('Core/Rab/Edit', [
            'rab' => $rab,
            'proyeks' => $proyeks,
        ]);
    }

    public function update(Request $request, Rab $rab)
    {
        $this->authorize('update', $rab);

        $validated = $request->validate([
            'rencana' => 'required|numeric|min:0',
            'catatan' => 'nullable|string',
        ]);

        $rab->update($validated);

        return redirect()->route('core.rab.index')
            ->with('success', 'RAB diperbarui.');
    }

    public function destroy(Rab $rab)
    {
        $this->authorize('delete', $rab);

        $rab->delete();

        return redirect()->route('core.rab.index')
            ->with('success', 'RAB dihapus.');
    }
}
