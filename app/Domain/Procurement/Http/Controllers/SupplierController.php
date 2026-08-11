<?php
namespace App\Domain\Procurement\Http\Controllers;

use App\Domain\Procurement\Models\Supplier;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        return Inertia::render('Procurement/Suppliers/Index', ['suppliers' => Supplier::paginate(10)]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|unique:supplier',
            'nama' => 'required|string',
            'kontak' => 'nullable|string',
            'telepon' => 'nullable|string',
            'alamat' => 'nullable|string',
        ]);
        Supplier::create($validated);
        return redirect()->route('procurement.suppliers.index')->with('success', 'Supplier ditambahkan.');
    }
    // ... update, delete similar
}
