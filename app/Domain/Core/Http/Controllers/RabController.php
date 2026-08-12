<?php

namespace App\Domain\Core\Http\Controllers;

use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Actions\SetRABAction;
use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Actions\CompareRABRealisasiAction;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RabController extends Controller
{
    public function index(Request $request)
    {
        $query = Rab::with(['proyek', 'titik']);

        if ($request->has('proyek_id')) {
            $query->where('proyek_id', $request->proyek_id);
        }

        $rabs = $query->paginate(15)->withQueryString();
        $proyeks = Proyek::where('status', 'aktif')->get();

        return Inertia::render('Core/Rab/Index', [
            'rabs' => $rabs,
            'proyeks' => $proyeks,
            'filters' => $request->only('proyek_id'),
        ]);
    }

    public function create(Request $request)
    {
        $proyeks = Proyek::where('status', 'aktif')->get();
        $selectedProyek = $request->proyek_id ?? null;
        return Inertia::render('Core/Rab/Create', [
            'proyeks' => $proyeks,
            'selectedProyek' => $selectedProyek,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'proyek_id' => 'required|exists:proyeks,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'kategori' => 'required|in:bahan_baku,sparepart,sdm_tetap,sdm_kondisional,lainnya',
            'rencana' => 'required|numeric|min:0',
            'catatan' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();
        (new SetRABAction())->execute($validated);

        return redirect()->route('core.rab.index')
            ->with('success', 'RAB berhasil ditambahkan.');
    }

    public function show(Rab $rab)
    {
        $realisasi = (new GetRABRealisasiAction())->execute($rab);
        $perbandingan = (new CompareRABRealisasiAction())->execute($rab);

        return Inertia::render('Core/Rab/Show', [
            'rab' => $rab->load(['proyek', 'titik']),
            'realisasi' => $realisasi,
            'perbandingan' => $perbandingan,
        ]);
    }

    public function edit(Rab $rab)
    {
        $proyeks = Proyek::where('status', 'aktif')->get();
        return Inertia::render('Core/Rab/Edit', [
            'rab' => $rab,
            'proyeks' => $proyeks,
        ]);
    }

    public function update(Request $request, Rab $rab)
    {
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
        $rab->delete();
        return redirect()->route('core.rab.index')
            ->with('success', 'RAB dihapus.');
    }
}
