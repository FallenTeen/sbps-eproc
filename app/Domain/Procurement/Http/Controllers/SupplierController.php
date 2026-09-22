<?php

namespace App\Domain\Procurement\Http\Controllers;

use App\Domain\Procurement\Models\Supplier;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Supplier::class);

        $query = Supplier::query();
        if ($request->has('search')) {
            $query->where('nama', 'like', '%'.$request->search.'%')
                ->orWhere('kode', 'like', '%'.$request->search.'%');
        }
        $suppliers = $query->orderBy('nama')->paginate(10)->withQueryString();

        return Inertia::render('Procurement/Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->only('search'),
        ]);
    }

    public function show(Supplier $supplier)
    {
        $this->authorize('view', $supplier);

        $purchaseOrders = $supplier->purchaseOrders()
            ->with(['proyek', 'titik', 'items.bahanBaku'])
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Procurement/Suppliers/Show', [
            'supplier' => $supplier,
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    public function create()
    {
        $this->authorize('create', Supplier::class);

        return Inertia::render('Procurement/Suppliers/Create');
    }

    public function store(Request $request)
    {
        $this->authorize('create', Supplier::class);

        $validated = $request->validate([
            'kode' => 'required|unique:suppliers',
            'nama' => 'required|string|max:255',
            'kontak' => 'nullable|string|max:255',
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'aktif' => 'boolean',
        ]);
        Supplier::create($validated);

        return redirect()->route('procurement.supplier.index')
            ->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function edit(Supplier $supplier)
    {
        $this->authorize('update', $supplier);

        return Inertia::render('Procurement/Suppliers/Edit', ['supplier' => $supplier]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $this->authorize('update', $supplier);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'kontak' => 'nullable|string|max:255',
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'aktif' => 'boolean',
        ]);
        $supplier->update($validated);

        return redirect()->route('procurement.supplier.index')
            ->with('success', 'Supplier diperbarui.');
    }

    public function destroy(Supplier $supplier)
    {
        $this->authorize('delete', $supplier);

        if ($supplier->purchaseOrders()->exists()) {
            return back()->with('error', 'Supplier sudah memiliki PO, tidak bisa dihapus.');
        }
        $supplier->delete();

        return redirect()->route('procurement.supplier.index')
            ->with('success', 'Supplier dihapus.');
    }
}
