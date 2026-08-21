<?php

namespace App\Domain\Procurement\Http\Controllers;

use App\Domain\Procurement\Actions\SetHargaBeliAction;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\Supplier;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BahanBakuController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', BahanBaku::class);

        $query = BahanBaku::with([
            'hargaBeli' => function ($q) {
                $q->whereNull('berlaku_sampai')->orWhere('berlaku_sampai', '>=', now());
            },
        ]);

        if ($request->has('search')) {
            $query->where('nama', 'like', '%'.$request->search.'%')
                ->orWhere('kode', 'like', '%'.$request->search.'%');
        }

        $bahanBakus = $query->orderBy('nama')->paginate(10)->withQueryString();

        return Inertia::render('Procurement/BahanBaku/Index', [
            'bahanBakus' => $bahanBakus,
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        $this->authorize('create', BahanBaku::class);

        $suppliers = Supplier::where('aktif', true)->get();

        return Inertia::render('Procurement/BahanBaku/Create', ['suppliers' => $suppliers]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', BahanBaku::class);

        $validated = $request->validate([
            'kode' => 'required|unique:bahan_bakus',
            'nama' => 'required|string|max:255',
            'kategori' => 'required|in:bahan_baku,sparepart',
            'sparepart_untuk' => 'nullable|string|max:255',
            'satuan' => 'required|string|max:50',
            'aktif' => 'boolean',
        ]);

        $bahanBaku = BahanBaku::create($validated);

        // Jika ada harga awal
        if ($request->filled('harga_awal') && $request->filled('supplier_id')) {
            (new SetHargaBeliAction)->execute(
                $bahanBaku,
                $request->supplier_id,
                $request->harga_awal,
                $request->berlaku_dari ?? now()
            );
        }

        return redirect()->route('procurement.bahan-baku.index')
            ->with('success', 'Bahan baku berhasil ditambahkan.');
    }

    public function show(BahanBaku $bahanBaku)
    {
        $this->authorize('view', $bahanBaku);

        $bahanBaku->load(['hargaBeli.supplier']);

        $stokPerTitik = $bahanBaku->stokMutasis()
            ->with('titik')
            ->get()
            ->groupBy('titik_id')
            ->map(function ($mutasis, $titikId) {
                return [
                    'titik_id' => $titikId,
                    'titik' => $mutasis->first()->titik?->nama ?? '-',
                    'stok' => $mutasis->sum(fn ($m) => $m->tipe === 'masuk' ? $m->jumlah : -$m->jumlah),
                ];
            })
            ->values();

        $bahanBaku->setAttribute('stok_per_titik', $stokPerTitik);

        $suppliers = Supplier::where('aktif', true)->get();

        return Inertia::render('Procurement/BahanBaku/Show', [
            'bahanBaku' => $bahanBaku,
            'suppliers' => $suppliers,
        ]);
    }

    public function edit(BahanBaku $bahanBaku)
    {
        $this->authorize('update', $bahanBaku);

        $bahanBaku->load(['hargaBeli.supplier']);

        $suppliers = Supplier::where('aktif', true)->get();

        return Inertia::render('Procurement/BahanBaku/Edit', [
            'bahanBaku' => $bahanBaku,
            'suppliers' => $suppliers,
        ]);
    }

    public function update(Request $request, BahanBaku $bahanBaku)
    {
        $this->authorize('update', $bahanBaku);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'kategori' => 'required|in:bahan_baku,sparepart',
            'sparepart_untuk' => 'nullable|string|max:255',
            'satuan' => 'required|string|max:50',
            'aktif' => 'boolean',
        ]);

        $bahanBaku->update($validated);

        return redirect()->route('procurement.bahan-baku.index')
            ->with('success', 'Bahan baku diperbarui.');
    }

    public function destroy(BahanBaku $bahanBaku)
    {
        $this->authorize('delete', $bahanBaku);

        if ($bahanBaku->purchaseOrderItems()->exists()) {
            return back()->with('error', 'Bahan baku sudah digunakan di PO, tidak bisa dihapus.');
        }
        $bahanBaku->delete();

        return redirect()->route('procurement.bahan-baku.index')
            ->with('success', 'Bahan baku dihapus.');
    }

    public function stok(BahanBaku $bahanBaku)
    {
        $this->authorize('view', $bahanBaku);

        $perTitik = $bahanBaku->stokMutasis()
            ->get()
            ->groupBy('titik_id')
            ->map(function ($mutasis, $titikId) {
                return [
                    'titik_id' => $titikId,
                    'titik' => $mutasis->first()->titik?->nama ?? '-',
                    'stok' => $mutasis->sum(fn ($m) => $m->tipe === 'masuk' ? $m->jumlah : -$m->jumlah),
                ];
            })
            ->values();

        $mutasis = $bahanBaku->stokMutasis()
            ->with('titik')
            ->orderBy('tanggal', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Procurement/BahanBaku/Stok', [
            'bahanBaku' => $bahanBaku,
            'perTitik' => $perTitik,
            'mutasis' => $mutasis,
        ]);
    }

    public function setHarga(Request $request, BahanBaku $bahanBaku)
    {
        $this->authorize('setHarga', $bahanBaku);

        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'harga' => 'required|numeric|min:0',
            'berlaku_dari' => 'required|date',
        ]);

        (new SetHargaBeliAction)->execute(
            $bahanBaku,
            $request->supplier_id,
            $request->harga,
            $request->berlaku_dari
        );

        return back()->with('success', 'Harga berhasil ditambahkan.');
    }
}
