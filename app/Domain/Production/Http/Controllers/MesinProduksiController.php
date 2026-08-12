<?php

namespace App\Domain\Production\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Core\Models\Titik;
use App\Domain\Production\Models\Produk;
use App\Domain\Fleet\Models\DowntimeLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MesinProduksiController extends Controller
{
    public function index(Request $request)
    {
        $mesin = MesinProduksi::with(['unitBisnis', 'titik', 'produkDefault'])
            ->when($request->search, function ($query, $search) {
                $query->where('nama', 'like', "%{$search}%")
                      ->orWhere('jenis', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Production/Mesin/Index', [
            'mesin' => $mesin,
            'filters' => $request->only(['search'])
        ]);
    }

    public function create()
    {
        return Inertia::render('Production/Mesin/Create', [
            'unitBisnis' => UnitBisnis::aktif()->get(),
            'titiks' => Titik::aktif()->get(),
            'produks' => Produk::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'produk_id' => 'nullable|exists:produks,id',
            'nama' => 'required|string|max:255',
            'jenis' => 'required|string|max:255',
            'kapasitas' => 'nullable|string|max:255',
            'status' => 'required|in:aktif,rusak,maintenance,nonaktif',
            'biaya_per_jam' => 'nullable|numeric|min:0'
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
            'downtimes' => fn($q) => $q->latest('mulai')->take(10)
        ])->findOrFail($id);

        return Inertia::render('Production/Mesin/Show', [
            'mesin' => $mesin
        ]);
    }

    public function edit($id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        
        return Inertia::render('Production/Mesin/Edit', [
            'mesin' => $mesin,
            'unitBisnis' => UnitBisnis::aktif()->get(),
            'titiks' => Titik::aktif()->get(),
            'produks' => Produk::all()
        ]);
    }

    public function update(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);

        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'produk_id' => 'nullable|exists:produks,id',
            'nama' => 'required|string|max:255',
            'jenis' => 'required|string|max:255',
            'kapasitas' => 'nullable|string|max:255',
            'status' => 'required|in:aktif,rusak,maintenance,nonaktif',
            'biaya_per_jam' => 'nullable|numeric|min:0'
        ]);

        $mesin->update($validated);

        return redirect()->route('production.mesin.index')->with('success', 'Mesin produksi berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        $mesin->delete();

        return redirect()->route('production.mesin.index')->with('success', 'Mesin produksi berhasil dihapus.');
    }

    public function updateStatus(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'required|in:aktif,rusak,maintenance,nonaktif'
        ]);

        $mesin->update(['status' => $validated['status']]);

        return back()->with('success', 'Status mesin berhasil diperbarui.');
    }

    // --- Specific Actions ---

    public function recordService(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'jenis_servis' => 'required|string|max:255',
            'biaya' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id'
        ]);

        DB::transaction(function () use ($mesin, $validated) {
            $mesin->serviceHistories()->create($validated);
            if ($mesin->status !== 'maintenance') {
                $mesin->update(['status' => 'maintenance']);
            }
        });

        return back()->with('success', 'Service history berhasil dicatat.');
    }

    public function recordChecklist(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'kondisi_baik' => 'required|boolean',
            'item_bermasalah' => 'nullable|string',
            'dicatat_oleh_karyawan_id' => 'nullable|exists:karyawans,id'
        ]);

        $mesin->checklists()->create($validated);

        return back()->with('success', 'Checklist harian berhasil dicatat.');
    }

    public function recordBbm(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'liter' => 'required|numeric|min:0',
            'biaya' => 'required|numeric|min:0',
            'jam_operasional_saat_isi' => 'nullable|numeric|min:0',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id'
        ]);

        $validated['dicatat_oleh'] = auth()->id();

        $mesin->bbmLogs()->create($validated);

        return back()->with('success', 'Log BBM berhasil dicatat.');
    }

    public function startDowntime(Request $request, $id)
    {
        $mesin = MesinProduksi::findOrFail($id);

        $validated = $request->validate([
            'mulai' => 'required|date',
            'penyebab' => 'required|string',
            'kategori' => 'required|string',
            'catatan' => 'nullable|string'
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
        $downtime = $mesin->downtimes()->findOrFail($downtimeId);

        $validated = $request->validate([
            'selesai' => 'required|date|after_or_equal:'.$downtime->mulai
        ]);

        DB::transaction(function () use ($mesin, $downtime, $validated) {
            $downtime->update(['selesai' => $validated['selesai']]);
            // Revert status to aktif
            $mesin->update(['status' => 'aktif']);
        });

        return back()->with('success', 'Downtime mesin diakhiri.');
    }
}