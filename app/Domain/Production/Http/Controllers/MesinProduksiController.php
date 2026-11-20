<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\Produk;
use App\Http\Controllers\Controller;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MesinProduksiController extends Controller
{
    use FilterableTable;

    public function index(Request $request)
    {
        $this->authorize('viewAny', MesinProduksi::class);

        $user = $request->user();
        $query = MesinProduksi::with(['unitBisnis', 'titik', 'produkDefault', 'serviceHistories' => fn($q) => $q->latest('tanggal')]);

        if ($user && ! $user->hasRole('Owner') && $user->unit_bisnis_id) {
            $query->where('unit_bisnis_id', $user->unit_bisnis_id);
        }

        $columns = [
            'nama' => ['type' => 'like'],
            'jenis' => ['type' => 'exact'],
            'unit_bisnis' => ['relation' => 'unitBisnis', 'column' => 'id', 'type' => 'exact'],
            'status' => ['type' => 'exact'],
        ];

        $sort = $this->applyTableQuery($query, $request, $columns, ['created_at' => 'desc']);

        $mesin = $query->paginate($this->tablePerPage($request))->withQueryString();

        $unitBisnisQuery = UnitBisnis::aktif();
        if ($user && ! $user->hasRole('Owner') && $user->unit_bisnis_id) {
            $unitBisnisQuery->where('id', $user->unit_bisnis_id);
        }

        return Inertia::render('Production/Mesin/Index', [
            'mesin' => $mesin,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
            'unitBisnis' => $unitBisnisQuery->get(),
            'jenisOptions' => MesinProduksi::select('jenis')->distinct()->pluck('jenis'),
        ]);
    }

    public function create()
    {
        $this->authorize('create', MesinProduksi::class);

        $user = auth()->user();
        $unitBisnisQuery = UnitBisnis::aktif();
        if ($user && ! $user->hasRole('Owner') && $user->unit_bisnis_id) {
            $unitBisnisQuery->where('id', $user->unit_bisnis_id);
        }

        return Inertia::render('Production/Mesin/Create', [
            'unitBisnis' => $unitBisnisQuery->get(),
            'titiks' => Titik::aktif()->get(),
            'produks' => Produk::all(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', MesinProduksi::class);

        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'produk_id' => 'nullable|exists:produks,id',
            'nama' => 'required|string|max:255',
            'jenis' => 'required|in:crusher,mixer_aspal,mixer_beton',
            'kapasitas' => 'nullable|string|max:255',
            'status' => 'required|in:aktif,servis,nonaktif',
            'biaya_per_jam' => 'nullable|numeric|min:0',
        ]);

        MesinProduksi::create($validated);

        return redirect()->route('production.mesin.index')->with('success', 'Mesin produksi berhasil ditambahkan.');
    }

    public function show($id)
    {
        $mesin = MesinProduksi::with([
            'unitBisnis',
            'titik',
            'produkDefault',
            'serviceHistories' => fn($q) => $q->latest('tanggal')->take(10),
            'checklists' => fn($q) => $q->latest('tanggal')->take(10),
            'bbmLogs' => fn($q) => $q->latest('tanggal')->take(10),
            'downtimes' => fn($q) => $q->latest('mulai')->take(10),
        ])->findOrFail($id);

        $this->authorize('view', $mesin);

        return Inertia::render('Production/Mesin/Show', [
            'mesin' => $mesin,
        ]);
    }

    public function edit($id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $this->authorize('update', $mesin);

        return Inertia::render('Production/Mesin/Edit', [
            'mesin' => $mesin,
            'unitBisnis' => UnitBisnis::aktif()->get(),
            'titiks' => Titik::aktif()->get(),
            'produks' => Produk::all(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $this->authorize('update', $mesin);

        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'produk_id' => 'nullable|exists:produks,id',
            'nama' => 'required|string|max:255',
            'jenis' => 'required|in:crusher,mixer_aspal,mixer_beton',
            'kapasitas' => 'nullable|string|max:255',
            'status' => 'required|in:aktif,servis,nonaktif',
            'biaya_per_jam' => 'nullable|numeric|min:0',
        ]);

        $mesin->update($validated);

        return redirect()->route('production.mesin.index')->with('success', 'Mesin produksi berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $this->authorize('delete', $mesin);
        $mesin->delete();

        return redirect()->route('production.mesin.index')->with('success', 'Mesin produksi berhasil dihapus.');
    }

    public function updateStatus(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $this->authorize('update', $mesin);

        $validated = $request->validate([
            'status' => 'required|in:aktif,servis,nonaktif',
        ]);

        $mesin->update(['status' => $validated['status']]);

        return back()->with('success', 'Status mesin berhasil diperbarui.');
    }

    // --- Specific Actions ---

    public function recordService(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $this->authorize('recordService', $mesin);

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'jenis_servis' => 'required|string|max:255',
            'biaya' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);

        DB::transaction(function () use ($mesin, $validated) {
            $mesin->serviceHistories()->create($validated);
            if ($mesin->status !== 'servis') {
                $mesin->update(['status' => 'servis']);
            }
        });

        return back()->with('success', 'Service history berhasil dicatat.');
    }

    public function recordChecklist(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $this->authorize('recordChecklist', $mesin);

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'kondisi_baik' => 'required|boolean',
            'item_bermasalah' => 'nullable|string',
            'dicatat_oleh_karyawan_id' => 'nullable|exists:karyawans,id',
        ]);

        $mesin->checklists()->create($validated);

        return back()->with('success', 'Checklist harian berhasil dicatat.');
    }

    public function recordBbm(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $this->authorize('recordBbm', $mesin);

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'liter' => 'required|numeric|min:0',
            'biaya' => 'required|numeric|min:0',
            'jam_operasional_saat_isi' => 'nullable|numeric|min:0',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);

        $validated['dicatat_oleh'] = auth()->id();

        $mesin->bbmLogs()->create($validated);

        return back()->with('success', 'Log BBM berhasil dicatat.');
    }

    public function startDowntime(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $this->authorize('startDowntime', $mesin);

        $validated = $request->validate([
            'mulai' => 'required|date',
            'penyebab' => 'required|string',
            'kategori' => 'required|string',
            'catatan' => 'nullable|string',
        ]);

        DB::transaction(function () use ($mesin, $validated) {
            $mesin->downtimes()->create($validated);
            $mesin->update(['status' => 'rusak']);
        });

        return back()->with('success', 'Downtime mesin dimulai.');
    }

    public function endDowntime(Request $request, $id, $downtimeId)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $this->authorize('endDowntime', $mesin);
        $downtime = $mesin->downtimes()->findOrFail($downtimeId);

        $validated = $request->validate([
            'selesai' => 'required|date|after_or_equal:' . $downtime->mulai,
        ]);

        DB::transaction(function () use ($mesin, $downtime, $validated) {
            $downtime->update(['selesai' => $validated['selesai']]);
            // Revert status to aktif
            $mesin->update(['status' => 'aktif']);
        });

        return back()->with('success', 'Downtime mesin diakhiri.');
    }
}
