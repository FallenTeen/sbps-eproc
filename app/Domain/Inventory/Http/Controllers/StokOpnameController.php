<?php

namespace App\Domain\Inventory\Http\Controllers;

use App\Domain\Core\Models\Titik;
use App\Domain\Inventory\Actions\CreateStokOpnameAction;
use App\Domain\Inventory\Models\StokOpname;
use App\Domain\Procurement\Actions\GetStokSaldoAction;
use App\Domain\Procurement\Models\BahanBaku;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StokOpnameController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', StokOpname::class);

        $query = StokOpname::with(['bahanBaku', 'titik', 'dicatatOleh']);
        $filters = $request->only(['tanggal', 'titik_id', 'kategori']);

        if (! empty($filters['tanggal'])) {
            $query->whereDate('tanggal', $filters['tanggal']);
        }

        if (! empty($filters['titik_id'])) {
            $query->where('titik_id', $filters['titik_id']);
        }

        if (! empty($filters['kategori'])) {
            $query->whereHas('bahanBaku', fn ($q) => $q->where('kategori', $filters['kategori']));
        }

        $opnames = $query->latest('tanggal')->latest('created_at')->paginate(15)->withQueryString();

        return Inertia::render('Inventory/StokOpname/Index', [
            'opnames' => $opnames,
            'titiks' => Titik::aktif()->orderBy('nama')->get(),
            'filters' => $filters,
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', StokOpname::class);

        $titikId = $request->query('titik_id');
        $tanggal = $request->query('tanggal', now()->toDateString());
        $kategori = $request->query('kategori', '');

        $bahanBakus = BahanBaku::where('aktif', true)
            ->when($kategori, fn ($q) => $q->where('kategori', $kategori))
            ->orderBy('nama')
            ->get();

        $existing = collect();
        $getSaldo = new GetStokSaldoAction;

        foreach ($bahanBakus as $bahanBaku) {
            $bahanBaku->setAttribute('stok_sistem', null);
            $bahanBaku->setAttribute('opname_lama', null);
        }

        if ($titikId && $tanggal) {
            $existing = StokOpname::where('titik_id', $titikId)
                ->whereDate('tanggal', $tanggal)
                ->get()
                ->keyBy('bahan_baku_id');

            foreach ($bahanBakus as $bahanBaku) {
                $bahanBaku->setAttribute('stok_sistem', (float) $getSaldo->execute($bahanBaku, $titikId, $tanggal));
                if ($opname = $existing->get($bahanBaku->id)) {
                    $bahanBaku->setAttribute('opname_lama', $opname);
                }
            }
        }

        return Inertia::render('Inventory/StokOpname/Create', [
            'titiks' => Titik::aktif()->orderBy('nama')->get(),
            'bahanBakus' => $bahanBakus,
            'titik_id' => $titikId,
            'tanggal' => $tanggal,
            'kategori' => $kategori,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', StokOpname::class);

        $validated = $request->validate([
            'titik_id' => 'required|exists:titiks,id',
            'tanggal' => 'required|date|before_or_equal:today',
            'items' => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.saldo_fisik' => 'required|numeric|min:0',
            'items.*.catatan' => 'nullable|string|max:1000',
        ]);

        app(CreateStokOpnameAction::class)->execute(
            $request->user(),
            $validated['titik_id'],
            $validated['tanggal'],
            $validated['items']
        );

        return redirect()->route('inventory.stok-opname.index')
            ->with('success', 'Stok opname berhasil dicatat.');
    }

    public function destroy(StokOpname $stokOpname)
    {
        $this->authorize('delete', $stokOpname);

        $stokOpname->delete();

        return back()->with('success', 'Stok opname dihapus.');
    }
}