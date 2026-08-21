<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Production\Actions\GenerateResepFromMixDesignAction;
use App\Domain\Production\Models\MixDesignTemplate;
use App\Domain\Production\Models\MixDesignTemplateItem;
use App\Domain\Production\Models\Produk;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MixDesignController extends Controller
{
    public function index()
    {
        $mixDesigns = MixDesignTemplate::with(['items.bahanBaku'])->orderBy('mutu_beton')->get();

        return Inertia::render('Production/MixDesign/Index', [
            'mixDesigns' => $mixDesigns,
        ]);
    }

    public function create()
    {
        return Inertia::render('Production/MixDesign/Create', [
            'bahanBakus' => BahanBaku::aktif()->bahanBaku()->orderBy('nama')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mutu_beton' => 'required|string|max:50|unique:mix_design_templates,mutu_beton',
            'nama' => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.jumlah_per_m3' => 'required|numeric|min:0.0001',
        ]);

        $template = MixDesignTemplate::create([
            'mutu_beton' => $validated['mutu_beton'],
            'nama' => $validated['nama'] ?? null,
            'deskripsi' => $validated['deskripsi'] ?? null,
        ]);

        foreach ($validated['items'] ?? [] as $item) {
            $template->items()->create([
                'bahan_baku_id' => $item['bahan_baku_id'],
                'jumlah_per_m3' => $item['jumlah_per_m3'],
            ]);
        }

        return redirect()->route('production.mix-design.show', $template)
            ->with('success', 'Mix design berhasil dibuat.');
    }

    public function show(MixDesignTemplate $mixDesign)
    {
        $mixDesign->load(['items.bahanBaku']);

        return Inertia::render('Production/MixDesign/Show', [
            'mixDesign' => $mixDesign,
            'produks' => Produk::aktif()->get(),
        ]);
    }

    public function edit(MixDesignTemplate $mixDesign)
    {
        $mixDesign->load(['items.bahanBaku']);

        return Inertia::render('Production/MixDesign/Edit', [
            'mixDesign' => $mixDesign,
            'bahanBakus' => BahanBaku::aktif()->bahanBaku()->orderBy('nama')->get(),
        ]);
    }

    public function update(Request $request, MixDesignTemplate $mixDesign)
    {
        $validated = $request->validate([
            'mutu_beton' => 'required|string|max:50|unique:mix_design_templates,mutu_beton,'.$mixDesign->id,
            'nama' => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.jumlah_per_m3' => 'required|numeric|min:0.0001',
            'items.*.id' => 'nullable|exists:mix_design_template_items,id',
        ]);

        $mixDesign->update([
            'mutu_beton' => $validated['mutu_beton'],
            'nama' => $validated['nama'] ?? null,
            'deskripsi' => $validated['deskripsi'] ?? null,
        ]);

        // Sinkronisasi item: update yang ada, hapus yang tidak diinput
        $keptIds = collect($validated['items'] ?? [])->pluck('id')->filter()->all();
        $mixDesign->items()->whereNotIn('id', $keptIds)->delete();

        foreach ($validated['items'] ?? [] as $item) {
            MixDesignTemplateItem::updateOrCreate(
                ['id' => $item['id'] ?? null],
                [
                    'mix_design_template_id' => $mixDesign->id,
                    'bahan_baku_id' => $item['bahan_baku_id'],
                    'jumlah_per_m3' => $item['jumlah_per_m3'],
                ],
            );
        }

        return redirect()->route('production.mix-design.show', $mixDesign)
            ->with('success', 'Mix design diperbarui.');
    }

    public function destroy(MixDesignTemplate $mixDesign)
    {
        $mixDesign->items()->delete();
        $mixDesign->delete();

        return redirect()->route('production.mix-design.index')
            ->with('success', 'Mix design dihapus.');
    }

    public function generateResep(MixDesignTemplate $mixDesign, Produk $produk)
    {
        (new GenerateResepFromMixDesignAction)->execute($produk, $mixDesign->mutu_beton);

        return redirect()->route('production.resep.index', $produk)
            ->with('success', 'Resep berhasil digenerate dari mix design.');
    }
}
