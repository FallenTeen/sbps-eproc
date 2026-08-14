<?php

namespace App\Domain\Core\Http\Controllers;

use App\Domain\Core\Models\UnitBisnis;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UnitBisnisController extends Controller
{
    /**
     * Display a listing of unit bisnis (master data).
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', UnitBisnis::class);

        $query = UnitBisnis::query();

        if ($request->filled('status')) {
            // status=aktif | nonaktif
            $query->where('aktif', $request->status === 'aktif');
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                    ->orWhere('nama', 'like', "%{$search}%");
            });
        }

        $unitBisnis = $query->orderBy('kode')->paginate(15)->withQueryString();

        return Inertia::render('Core/UnitBisnis/Index', [
            'unitBisnis' => $unitBisnis,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Show form to create a new unit bisnis.
     */
    public function create()
    {
        $this->authorize('create', UnitBisnis::class);

        return Inertia::render('Core/UnitBisnis/Create');
    }

    /**
     * Store a newly created unit bisnis.
     */
    public function store(Request $request)
    {
        $this->authorize('create', UnitBisnis::class);

        $validated = $this->validatedData($request);

        $unitBisnis = UnitBisnis::create($validated);

        return redirect()->route('core.unit-bisnis.index')
            ->with('success', 'Unit bisnis berhasil dibuat.');
    }

    /**
     * Display the specified unit bisnis with statistics.
     */
    public function show(UnitBisnis $unitBisnis)
    {
        $this->authorize('view', $unitBisnis);

        $unitBisnis->loadCount([
            'proyeks',
            'armadas',
            'mesinProduksis',
            'akunKasBanks',
        ]);

        $stats = [
            'total_proyek' => $unitBisnis->proyeks_count,
            'total_armada' => $unitBisnis->armadas_count,
            'total_mesin' => $unitBisnis->mesin_produksis_count,
            'total_akun_kas' => $unitBisnis->akun_kas_banks_count,
        ];

        return Inertia::render('Core/UnitBisnis/Show', [
            'unitBisnis' => $unitBisnis,
            'stats' => $stats,
        ]);
    }

    /**
     * Show form to edit unit bisnis.
     */
    public function edit(UnitBisnis $unitBisnis)
    {
        $this->authorize('update', $unitBisnis);

        return Inertia::render('Core/UnitBisnis/Edit', [
            'unitBisnis' => $unitBisnis,
        ]);
    }

    /**
     * Update the specified unit bisnis.
     */
    public function update(Request $request, UnitBisnis $unitBisnis)
    {
        $this->authorize('update', $unitBisnis);

        $validated = $this->validatedData($request, $unitBisnis->id);

        $unitBisnis->update($validated);

        return redirect()->route('core.unit-bisnis.show', $unitBisnis)
            ->with('success', 'Unit bisnis berhasil diperbarui.');
    }

    /**
     * Remove the specified unit bisnis, if it has no dependent records.
     * Jika ingin "menonaktifkan" saja tanpa menghapus, gunakan update()
     * dengan aktif=false (data historis tetap tersimpan).
     */
    public function destroy(UnitBisnis $unitBisnis)
    {
        $this->authorize('delete', $unitBisnis);

        if ($unitBisnis->proyeks()->exists()) {
            return back()->with('error', 'Unit bisnis memiliki Proyek, tidak bisa dihapus. Nonaktifkan saja jika perlu.');
        }

        if ($unitBisnis->armadas()->exists()) {
            return back()->with('error', 'Unit bisnis memiliki Armada, tidak bisa dihapus. Nonaktifkan saja jika perlu.');
        }

        if ($unitBisnis->mesinProduksis()->exists()) {
            return back()->with('error', 'Unit bisnis memiliki Mesin Produksi, tidak bisa dihapus. Nonaktifkan saja jika perlu.');
        }

        if ($unitBisnis->akunKasBanks()->exists()) {
            return back()->with('error', 'Unit bisnis memiliki Akun Kas/Bank, tidak bisa dihapus. Nonaktifkan saja jika perlu.');
        }

        $unitBisnis->delete();

        return redirect()->route('core.unit-bisnis.index')
            ->with('success', 'Unit bisnis berhasil dihapus.');
    }

    /**
     * Shared validation rules for store() and update().
     */
    protected function validatedData(Request $request, ?string $ignoreId = null): array
    {
        return $request->validate([
            'kode' => [
                'required',
                'string',
                // Hanya 3 karakter huruf kapital, mis. GCS, CBP, AMP
                'regex:/^[A-Z]{3}$/',
                Rule::unique('unit_bisnis', 'kode')->ignore($ignoreId),
            ],
            'nama' => [
                'required',
                'string',
                'max:255',
                Rule::unique('unit_bisnis', 'nama')->ignore($ignoreId),
            ],
            'deskripsi' => 'nullable|string',
            'aktif' => 'boolean',
        ], [
            'kode.regex' => 'Kode unit bisnis harus 3 huruf kapital, contoh: GCS, CBP, AMP.',
        ]);
    }
}
