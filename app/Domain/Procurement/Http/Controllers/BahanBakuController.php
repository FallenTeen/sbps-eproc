<?php
namespace App\Domain\Procurement\Http\Controllers;

use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Actions\SetHargaBeliAction;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class BahanBakuController extends Controller
{
    public function index()
    {
        $bahanBakus = BahanBaku::with([
            'hargaBeli' => function ($q) {
                $q->whereNull('berlaku_sampai')->orWhere('berlaku_sampai', '>=', now());
            }
        ])->paginate(10);
        return Inertia::render('Procurement/BahanBaku/Index', ['bahanBakus' => $bahanBakus]);
    }

    public function create()
    {
        return Inertia::render('Procurement/BahanBaku/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|unique:bahan_baku',
            'nama' => 'required|string',
            'kategori' => 'required|in:bahan_baku,sparepart',
            'sparepart_untuk' => 'nullable|string',
            'satuan' => 'required|string',
        ]);
        BahanBaku::create($validated);
        return redirect()->route('procurement.bahan-baku.index')->with('success', 'Bahan baku berhasil ditambahkan.');
    }

    public function edit(BahanBaku $bahanBaku)
    {
        return Inertia::render('Procurement/BahanBaku/Edit', ['bahanBaku' => $bahanBaku]);
    }

    public function update(Request $request, BahanBaku $bahanBaku)
    {
        $validated = $request->validate([
            'nama' => 'required|string',
            'kategori' => 'required|in:bahan_baku,sparepart',
            'sparepart_untuk' => 'nullable|string',
            'satuan' => 'required|string',
            'aktif' => 'boolean',
        ]);
        $bahanBaku->update($validated);
        return redirect()->route('procurement.bahan-baku.index')->with('success', 'Bahan baku diperbarui.');
    }

    public function setHarga(Request $request, BahanBaku $bahanBaku)
    {
        $request->validate([
            'supplier_id' => 'required|exists:supplier,id',
            'harga' => 'required|numeric|min:0',
            'berlaku_dari' => 'required|date',
        ]);
        (new SetHargaBeliAction())->execute($bahanBaku, $request->supplier_id, $request->harga, $request->berlaku_dari);
        return back()->with('success', 'Harga berhasil ditambahkan.');
    }
}
