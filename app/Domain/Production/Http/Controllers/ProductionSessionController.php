<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\ResepProduksi;
use App\Domain\Production\Actions\StartProductionSessionAction;
use App\Domain\Production\Actions\EndProductionSessionAction;
use App\Domain\Production\Actions\CalculateProductionCostAction;
use App\Domain\Production\Actions\CalculateProductionRevenueAction;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Core\Models\Titik;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductionSessionController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductionSession::with(['mesin', 'produk', 'operator', 'titik']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('produk_id') && $request->produk_id) {
            $query->where('produk_id', $request->produk_id);
        }

        $sessions = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Production/Sessions/Index', [
            'sessions' => $sessions,
            'produks' => Produk::aktif()->get(),
            'filters' => $request->only('status', 'produk_id'),
        ]);
    }

    public function active()
    {
        $sessions = ProductionSession::with(['mesin', 'produk', 'operator', 'titik'])
            ->berjalan()
            ->orderBy('mulai', 'desc')
            ->get();

        return Inertia::render('Production/Sessions/Active', [
            'sessions' => $sessions,
        ]);
    }

    public function reportHarian(Request $request)
    {
        $tanggal = $request->input('tanggal', now()->toDateString());

        $sessions = ProductionSession::with(['mesin', 'produk', 'operator', 'titik', 'items.bahanBaku'])
            ->whereDate('mulai', $tanggal)
            ->orderBy('mulai')
            ->get();

        $aggregate = [
            'total_output' => $sessions->sum('hasil_output'),
            'sesi_selesai' => $sessions->where('status', 'selesai')->count(),
            'sesi_berjalan' => $sessions->where('status', 'berjalan')->count(),
            'per_produk' => $sessions->groupBy('produk.nama')->map(fn ($group) => [
                'sesi' => $group->count(),
                'output' => $group->sum('hasil_output'),
            ]),
            'biaya' => $sessions->where('status', 'selesai')->sum(
                fn ($s) => (new CalculateProductionCostAction())->execute($s)
            ),
            'pendapatan' => $sessions->where('status', 'selesai')->sum(
                fn ($s) => (new CalculateProductionRevenueAction())->execute($s)
            ),
        ];

        return Inertia::render('Production/Sessions/Report', [
            'sessions' => $sessions,
            'aggregate' => $aggregate,
            'tanggal' => $tanggal,
        ]);
    }

    public function create()
    {
        $mesins = MesinProduksi::with('produkDefault')->where('status', 'aktif')->get();
        $produks = Produk::where('aktif', true)->get();
        $operator = Karyawan::where('status', 'aktif')->whereIn('tipe', ['tetap', 'harian'])->get();
        $titiks = Titik::where('status', 'aktif')->get();

        return Inertia::render('Production/Sessions/Create', [
            'mesins' => $mesins,
            'produks' => $produks,
            'operator' => $operator,
            'titiks' => $titiks,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesin_id' => 'required|exists:mesin_produksis,id',
            'titik_id' => 'required|exists:titiks,id',
            'produk_id' => 'required|exists:produks,id',
            'operator_karyawan_id' => 'required|exists:karyawans,id',
            'catatan' => 'nullable|string',
        ]);

        $session = (new StartProductionSessionAction())->execute($validated);

        return redirect()->route('production.sessions.show', $session)
            ->with('success', 'Sesi produksi dimulai.');
    }

    public function show(ProductionSession $productionSession)
    {
        $session = $productionSession->load([
            'mesin',
            'produk',
            'operator',
            'titik',
            'items.bahanBaku',
            'qcSamples',
            'pengirimans' => fn ($q) => $q->with(['armada', 'driver']),
        ]);

        $biaya = $session->status === 'selesai'
            ? (new CalculateProductionCostAction())->execute($session) : null;
        $pendapatan = $session->status === 'selesai'
            ? (new CalculateProductionRevenueAction())->execute($session) : null;
        $margin = $biaya !== null && $pendapatan !== null ? $pendapatan - $biaya : null;

        $resep = ResepProduksi::where('produk_id', $session->produk_id)->with('bahanBaku')->get();

        return Inertia::render('Production/Sessions/Show', [
            'session' => $session,
            'biaya' => $biaya,
            'pendapatan' => $pendapatan,
            'margin' => $margin,
            'resep' => $resep,
            'bahanBakus' => \App\Domain\Procurement\Models\BahanBaku::aktif()->bahanBaku()->get(),
        ]);
    }

    public function start(Request $request, ProductionSession $productionSession)
    {
        if ($productionSession->status !== 'dibatalkan' && $productionSession->status !== 'selesai') {
            return back()->with('error', 'Sesi sedang berjalan.');
        }

        $productionSession->update([
            'status' => 'berjalan',
            'mulai' => now(),
            'selesai' => null,
            'hasil_output' => null,
        ]);

        return back()->with('success', 'Sesi produksi dimulai ulang.');
    }

    public function edit(ProductionSession $productionSession)
    {
        $session = $productionSession->load(['mesin', 'produk', 'operator', 'titik']);

        return Inertia::render('Production/Sessions/Edit', [
            'session' => $session,
            'mesins' => MesinProduksi::where('status', 'aktif')->get(),
            'produks' => Produk::where('aktif', true)->get(),
            'operator' => Karyawan::where('status', 'aktif')->whereIn('tipe', ['tetap', 'harian'])->get(),
            'titiks' => Titik::where('status', 'aktif')->get(),
        ]);
    }

    public function update(Request $request, ProductionSession $productionSession)
    {
        $validated = $request->validate([
            'mesin_id' => 'required|exists:mesin_produksis,id',
            'titik_id' => 'required|exists:titiks,id',
            'produk_id' => 'required|exists:produks,id',
            'operator_karyawan_id' => 'required|exists:karyawans,id',
            'catatan' => 'nullable|string',
        ]);

        $productionSession->update($validated);

        return redirect()->route('production.sessions.show', $productionSession)
            ->with('success', 'Sesi produksi diperbarui.');
    }

    public function end(Request $request, ProductionSession $productionSession)
    {
        $validated = $request->validate([
            'hasil_output' => 'required|numeric|min:0.01',
            'items' => 'nullable|array',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.jumlah_terpakai' => 'required|numeric|min:0.01',
            'catatan' => 'nullable|string',
        ]);

        $session = (new EndProductionSessionAction())->execute($productionSession, $validated);

        return redirect()->route('production.sessions.show', $session)
            ->with('success', 'Sesi produksi selesai.');
    }

    public function cancel(ProductionSession $productionSession)
    {
        if ($productionSession->status === 'selesai') {
            return back()->with('error', 'Sesi sudah selesai, tidak bisa dibatalkan.');
        }

        $productionSession->update(['status' => 'dibatalkan', 'selesai' => now()]);

        return back()->with('success', 'Sesi produksi dibatalkan.');
    }

    public function destroy(ProductionSession $productionSession)
    {
        if ($productionSession->status === 'berjalan') {
            return back()->with('error', 'Sesi sedang berjalan, tidak bisa dihapus.');
        }
        $productionSession->delete();
        return redirect()->route('production.sessions.index')
            ->with('success', 'Sesi produksi dihapus.');
    }
}