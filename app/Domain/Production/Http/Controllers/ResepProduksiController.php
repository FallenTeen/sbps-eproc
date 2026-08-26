<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\ResepProduksi;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResepProduksiController extends Controller
{
    public function index(Produk $produk)
    {
        $produk->load(['resepProduksis.bahanBaku']);

        return Inertia::render('Production/Resep/Index', [
            'produk' => $produk,
            'resep' => $produk->resepProduksis,
        ]);
    }

    public function create(Produk $produk)
    {
        return Inertia::render('Production/Resep/Create', [
            'produk' => $produk,
            'bahanBakus' => BahanBaku::aktif()->bahanBaku()->orderBy('nama')->get(),
        ]);
    }

    public function store(Request $request, Produk $produk)
    {
        $validated = $request->validate([
            'bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'jumlah_per_unit_output' => 'required|numeric|min:0.0001',
        ]);

        ResepProduksi::create([
            'produk_id' => $produk->id,
            'bahan_baku_id' => $validated['bahan_baku_id'],
            'jumlah_per_unit_output' => $validated['jumlah_per_unit_output'],
        ]);

        return redirect()->route('production.resep.index', $produk)
            ->with('success', 'Item resep ditambahkan.');
    }

    public function edit(ResepProduksi $resep)
    {
        $resep->load('produk');

        return Inertia::render('Production/Resep/Edit', [
            'resep' => $resep,
            'bahanBakus' => BahanBaku::aktif()->bahanBaku()->orderBy('nama')->get(),
        ]);
    }

    public function update(Request $request, ResepProduksi $resep)
    {
        $validated = $request->validate([
            'bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'jumlah_per_unit_output' => 'required|numeric|min:0.0001',
        ]);

        $resep->update($validated);

        return redirect()->route('production.resep.index', $resep->produk_id)
            ->with('success', 'Item resep diperbarui.');
    }

    public function destroy(ResepProduksi $resep)
    {
        $resep->delete();

        return redirect()->route('production.resep.index', $resep->produk_id)
            ->with('success', 'Item resep dihapus.');
    }
}
