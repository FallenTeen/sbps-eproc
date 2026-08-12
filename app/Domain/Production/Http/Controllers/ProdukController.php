<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Production\Models\HargaJual;
use App\Domain\Production\Models\MixDesignTemplate;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\ResepProduksi;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProdukController extends Controller
{
    public function index(Request $request)
    {
        $query = Produk::with(['unitBisnis', 'hargaJual' => function ($q) {
            $q->orderBy('berlaku_dari', 'desc');
        }]);

        if ($request->has('unit_bisnis_id') && $request->unit_bisnis_id) {
            $query->where('unit_bisnis_id', $request->unit_bisnis_id);
        }

        if ($request->has('search') && $request->search) {
            $query->where('nama', 'like', '%' . $request->search . '%')
                ->orWhere('kategori', 'like', '%' . $request->search . '%');
        }

        $produks = $query->orderBy('nama')->paginate(15)->withQueryString();

        return Inertia::render('Production/Products/Index', [
            'produks' => $produks,
            'unitBisnis' => UnitBisnis::aktif()->get(),
            'filters' => $request->only(['unit_bisnis_id', 'search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Production/Products/Create', [
            'unitBisnis' => UnitBisnis::aktif()->get(),
            'mixDesigns' => MixDesignTemplate::orderBy('mutu_beton')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'nama' => 'required|string|max:255|unique:produks,nama',
            'kategori' => 'required|string|max:100',
            'satuan_output' => 'required|in:ton,m3',
            'aktif' => 'boolean',
            'harga_awal' => 'nullable|numeric|min:0',
        ]);

        $produk = Produk::create([
            'unit_bisnis_id' => $validated['unit_bisnis_id'],
            'nama' => $validated['nama'],
            'kategori' => $validated['kategori'],
            'satuan_output' => $validated['satuan_output'],
            'aktif' => $validated['aktif'] ?? true,
        ]);

        if ($request->filled('harga_awal')) {
            $this->simpanHarga($produk, $request->harga_awal, $request->berlaku_dari ?? now());
        }

        // Auto-generate resep dari mix design (khusus beton CBP)
        if ($request->filled('mix_design_template_id')) {
            $template = MixDesignTemplate::find($request->mix_design_template_id);
            if ($template) {
                foreach ($template->items as $item) {
                    ResepProduksi::create([
                        'produk_id' => $produk->id,
                        'bahan_baku_id' => $item->bahan_baku_id,
                        'jumlah_per_unit_output' => $item->jumlah_per_m3,
                    ]);
                }
            }
        }

        return redirect()->route('production.produk.index')
            ->with('success', 'Produk berhasil ditambahkan.');
    }

    public function show(Produk $produk)
    {
        $produk->load([
            'unitBisnis',
            'hargaJual' => fn ($q) => $q->orderBy('berlaku_dari', 'desc'),
            'resepProduksis.bahanBaku',
        ]);

        return Inertia::render('Production/Products/Show', [
            'produk' => $produk,
        ]);
    }

    public function edit(Produk $produk)
    {
        return Inertia::render('Production/Products/Edit', [
            'produk' => $produk,
            'unitBisnis' => UnitBisnis::aktif()->get(),
        ]);
    }

    public function update(Request $request, Produk $produk)
    {
        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'nama' => 'required|string|max:255|unique:produks,nama,' . $produk->id,
            'kategori' => 'required|string|max:100',
            'satuan_output' => 'required|in:ton,m3',
            'aktif' => 'boolean',
        ]);

        $produk->update($validated);

        return redirect()->route('production.produk.index')
            ->with('success', 'Produk diperbarui.');
    }

    public function destroy(Produk $produk)
    {
        if ($produk->productionSessions()->exists()) {
            return back()->with('error', 'Produk sudah dipakai di sesi produksi, tidak bisa dihapus.');
        }
        $produk->resepProduksis()->delete();
        $produk->hargaJual()->delete();
        $produk->delete();

        return redirect()->route('production.produk.index')
            ->with('success', 'Produk dihapus.');
    }

    public function setHarga(Request $request, Produk $produk)
    {
        $request->validate([
            'harga' => 'required|numeric|min:0',
            'berlaku_dari' => 'required|date',
        ]);

        $this->simpanHarga($produk, $request->harga, $request->berlaku_dari);

        return back()->with('success', 'Harga jual berhasil ditambahkan.');
    }

    protected function simpanHarga(Produk $produk, $harga, $berlakuDari)
    {
        DB::transaction(function () use ($produk, $harga, $berlakuDari) {
            // Tutup range harga lama yang belum punya akhir
            HargaJual::where('produk_id', $produk->id)
                ->whereNull('berlaku_sampai')
                ->update(['berlaku_sampai' => \Carbon\Carbon::parse($berlakuDari)->subDay()]);

            HargaJual::create([
                'produk_id' => $produk->id,
                'harga' => $harga,
                'berlaku_dari' => $berlakuDari,
                'berlaku_sampai' => null,
            ]);
        });
    }
}