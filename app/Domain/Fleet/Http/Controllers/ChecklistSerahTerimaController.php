<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\GenerateChecklistSerahTerimaPdfAction;
use App\Domain\Fleet\Actions\RecordChecklistSerahTerimaAction;
use App\Domain\Fleet\Models\ChecklistSerahTerima;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Bagian 21.10 - Checklist Armada Major (Serah Terima Sewa).
 * Tab "Serah Terima" pada transaksi Sewa Alat Berat (21.5).
 */
class ChecklistSerahTerimaController extends Controller
{
    public function show(Request $request, SewaAlatJam $sewaAlat)
    {
        $this->authorize('view', $sewaAlat);

        $sewa = $sewaAlat->load(['armada', 'proyek', 'checklists.details', 'checklists.dicatatOleh']);

        $berangkat = $sewa->checklists->firstWhere('tipe', 'berangkat');
        $kembali = $sewa->checklists->firstWhere('tipe', 'kembali');
        $itemTemplate = ChecklistSerahTerima::canonicalTemplate($berangkat, $kembali);

        // pemakaian dihitung on-the-fly (prinsip Bagian 0 #1): bukan kolom tersimpan
        $pemakaian = ($berangkat && $kembali)
            ? max(0, (float) $kembali->odo_atau_hm - (float) $berangkat->odo_atau_hm)
            : null;

        return Inertia::render('Fleet/SewaAlat/SerahTerima', [
            'sewa' => $sewa,
            'berangkat' => $berangkat,
            'kembali' => $kembali,
            'pemakaian' => $pemakaian,
            'defaultItems' => ChecklistSerahTerima::DEFAULT_ITEMS,
            'itemTemplate' => $itemTemplate,
            'can' => [
                'record' => $request->user()->can('update', $sewaAlat),
                'print' => $berangkat && $kembali,
            ],
        ]);
    }

    public function store(Request $request, SewaAlatJam $sewaAlat)
    {
        $this->authorize('update', $sewaAlat);

        $validated = $request->validate([
            'tipe' => ['required', Rule::in(['berangkat', 'kembali'])],
            'odo_atau_hm' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
            'catatan' => 'nullable|string|max:2000',
            'ditandatangani_oleh' => 'nullable|string|max:255',
            'item_template' => 'nullable|array|min:1|max:50',
            'item_template.*' => 'required|string|max:255|distinct',
            'items' => 'required|array|min:1',
            'items.*.item' => 'required|string|max:255',
            'items.*.kondisi' => ['required', Rule::in(['baik', 'rusak'])],
            'items.*.catatan' => 'nullable|string|max:1000',
            'existing_fotos' => 'nullable|array|max:6',
            'existing_fotos.*' => 'string|max:500',
            'foto_kondisi' => 'nullable|array|max:6',
            'foto_kondisi.*' => 'image|mimes:jpeg,png,jpg|max:4096',
        ]);

        $fotoPaths = collect($validated['existing_fotos'] ?? [])
            ->filter(fn($path) => is_string($path) && str_starts_with($path, 'armada/serah-terima/'))
            ->values()
            ->all();

        foreach ($request->file('foto_kondisi', []) as $foto) {
            if ($foto && count($fotoPaths) < 6) {
                $fotoPaths[] = $foto->store('armada/serah-terima', 'public');
            }
        }

        app(RecordChecklistSerahTerimaAction::class)->execute($sewaAlat, $validated['tipe'], [
            'odo_atau_hm' => $validated['odo_atau_hm'],
            'tanggal' => $validated['tanggal'],
            'catatan' => $validated['catatan'] ?? null,
            'ditandatangani_oleh' => $validated['ditandatangani_oleh'] ?? null,
            'item_template' => $validated['item_template'] ?? null,
            'items' => $validated['items'],
            'foto_kondisi' => $fotoPaths,
        ], $request->user());

        return back()->with('success', 'Checklist ' . $validated['tipe'] . ' berhasil disimpan.');
    }

    public function print(Request $request, SewaAlatJam $sewaAlat)
    {
        $this->authorize('view', $sewaAlat);

        $pdf = app(GenerateChecklistSerahTerimaPdfAction::class)->execute($sewaAlat);

        return $pdf->stream('checklist-serah-terima-' . $sewaAlat->armada->kode_unit . '-' . $sewaAlat->tanggal->format('Ymd') . '.pdf');
    }
}
