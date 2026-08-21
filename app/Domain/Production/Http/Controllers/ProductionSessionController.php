<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Production\Actions\CalculateProductionCostAction;
use App\Domain\Production\Actions\CalculateProductionRevenueAction;
use App\Domain\Production\Actions\EndProductionSessionAction;
use App\Domain\Production\Actions\StartProductionSessionAction;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\ResepProduksi;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductionSessionController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ProductionSession::class);

        $query = ProductionSession::with(['mesin', 'produk', 'operator', 'titik']);

        $user = $request->user();
        if ($user && ! $user->hasRole('Owner') && $user->unit_bisnis_id) {
            $query->where(function ($q) use ($user) {
                $q->whereHas('mesin', fn ($mq) => $mq->where('unit_bisnis_id', $user->unit_bisnis_id))
                    ->orWhereHas('produk', fn ($pq) => $pq->where('unit_bisnis_id', $user->unit_bisnis_id));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('produk_id')) {
            $query->where('produk_id', $request->produk_id);
        }

        if ($request->filled('tanggal')) {
            $query->whereDate('mulai', $request->tanggal);
        }

        if ($request->filled('search')) {
            $query->whereHas('mesin', fn ($q) => $q->where('nama', 'like', '%'.$request->search.'%'))
                ->orWhereHas('produk', fn ($q) => $q->where('nama', 'like', '%'.$request->search.'%'));
        }

        $sessions = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        // Append margin untuk tampilan index
        $sessions->getCollection()->transform(function ($session) {
            if ($session->status === 'selesai') {
                $biaya = (new CalculateProductionCostAction)->execute($session);
                $pendapatan = (new CalculateProductionRevenueAction)->execute($session);
                $session->margin = $pendapatan - $biaya;
            } else {
                $session->margin = null;
            }

            return $session;
        });

        $produksQuery = Produk::aktif();
        if ($user && ! $user->hasRole('Owner') && $user->unit_bisnis_id) {
            $produksQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }

        return Inertia::render('Production/Sessions/Index', [
            'sessions' => $sessions,
            'produks' => $produksQuery->get(),
            'filters' => $request->only('status', 'produk_id', 'tanggal', 'search'),
        ]);
    }

    public function active(Request $request)
    {
        $this->authorize('viewAny', ProductionSession::class);

        $query = ProductionSession::with(['mesin', 'produk', 'operator', 'titik'])->berjalan();

        $user = $request->user();
        if ($user && ! $user->hasRole('Owner') && $user->unit_bisnis_id) {
            $query->where(function ($q) use ($user) {
                $q->whereHas('mesin', fn ($mq) => $mq->where('unit_bisnis_id', $user->unit_bisnis_id))
                    ->orWhereHas('produk', fn ($pq) => $pq->where('unit_bisnis_id', $user->unit_bisnis_id));
            });
        }

        $sessions = $query->orderBy('mulai', 'desc')->get();

        return Inertia::render('Production/Sessions/Active', [
            'sessions' => $sessions,
        ]);
    }

    public function reportHarian(Request $request)
    {
        $this->authorize('viewAny', ProductionSession::class);

        $tanggal = $request->input('tanggal', now()->toDateString());

        $query = ProductionSession::with(['mesin', 'produk', 'operator', 'titik', 'items.bahanBaku'])
            ->whereDate('mulai', $tanggal);

        $user = $request->user();
        if ($user && ! $user->hasRole('Owner') && $user->unit_bisnis_id) {
            $query->where(function ($q) use ($user) {
                $q->whereHas('mesin', fn ($mq) => $mq->where('unit_bisnis_id', $user->unit_bisnis_id))
                    ->orWhereHas('produk', fn ($pq) => $pq->where('unit_bisnis_id', $user->unit_bisnis_id));
            });
        }

        $sessions = $query->orderBy('mulai')->get();

        $aggregate = [
            'total_output' => $sessions->sum('hasil_output'),
            'sesi_selesai' => $sessions->where('status', 'selesai')->count(),
            'sesi_berjalan' => $sessions->where('status', 'berjalan')->count(),
            'per_produk' => $sessions->groupBy('produk.nama')->map(fn ($group) => [
                'sesi' => $group->count(),
                'output' => $group->sum('hasil_output'),
            ]),
            'biaya' => $sessions->where('status', 'selesai')->sum(
                fn ($s) => (new CalculateProductionCostAction)->execute($s)
            ),
            'pendapatan' => $sessions->where('status', 'selesai')->sum(
                fn ($s) => (new CalculateProductionRevenueAction)->execute($s)
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
        $this->authorize('create', ProductionSession::class);

        $user = auth()->user();
        $mesinsQuery = MesinProduksi::with('produkDefault')->where('status', 'aktif');
        $produksQuery = Produk::where('aktif', true);

        if ($user && ! $user->hasRole('Owner') && $user->unit_bisnis_id) {
            $mesinsQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
            $produksQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }

        $mesins = $mesinsQuery->get();
        $produks = $produksQuery->get();
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
        $this->authorize('create', ProductionSession::class);

        $validated = $request->validate([
            'mesin_id' => 'required|exists:mesin_produksis,id',
            'titik_id' => 'required|exists:titiks,id',
            'produk_id' => 'required|exists:produks,id',
            'operator_karyawan_id' => 'required|exists:karyawans,id',
            'catatan' => 'nullable|string',
        ]);

        $session = (new StartProductionSessionAction)->execute($validated);

        return redirect()->route('production.sessions.show', ['session' => $session->id])
            ->with('success', 'Sesi produksi dimulai.');
    }

    public function show(ProductionSession $session)
    {
        $this->authorize('view', $session);

        $session = $session->load([
            'mesin',
            'produk',
            'operator',
            'titik',
            'items.bahanBaku',
            'qcSamples',
            'pengirimans' => fn ($q) => $q->with(['armada', 'driver']),
        ]);

        $biaya = $session->status === 'selesai'
            ? (new CalculateProductionCostAction)->execute($session) : null;
        $pendapatan = $session->status === 'selesai'
            ? (new CalculateProductionRevenueAction)->execute($session) : null;
        $margin = $biaya !== null && $pendapatan !== null ? $pendapatan - $biaya : null;

        $resep = ResepProduksi::where('produk_id', $session->produk_id)->with('bahanBaku')->get();

        return Inertia::render('Production/Sessions/Show', [
            'session' => $session,
            'biaya' => $biaya,
            'pendapatan' => $pendapatan,
            'margin' => $margin,
            'resep' => $resep,
            'bahanBakus' => BahanBaku::aktif()->bahanBaku()->get(),
            'can' => [
                'update' => auth()->user()?->can('update', $session) ?? false,
                'delete' => auth()->user()?->can('delete', $session) ?? false,
                'start' => auth()->user()?->can('startSession', $session) ?? false,
                'end' => auth()->user()?->can('endSession', $session) ?? false,
                'recordQC' => auth()->user()?->can('recordQC', $session) ?? false,
            ],
        ]);
    }

    public function start(Request $request, ProductionSession $session)
    {
        $this->authorize('startSession', $session);

        if ($session->status !== 'dibatalkan' && $session->status !== 'selesai') {
            return back()->with('error', 'Sesi sedang berjalan.');
        }

        $session->update([
            'status' => 'berjalan',
            'mulai' => now(),
            'selesai' => null,
            'hasil_output' => null,
        ]);

        return back()->with('success', 'Sesi produksi dimulai ulang.');
    }

    public function edit(ProductionSession $session)
    {
        $this->authorize('update', $session);

        $session = $session->load(['mesin', 'produk', 'operator', 'titik']);

        return Inertia::render('Production/Sessions/Edit', [
            'session' => $session,
            'mesins' => MesinProduksi::where('status', 'aktif')->get(),
            'produks' => Produk::where('aktif', true)->get(),
            'operator' => Karyawan::where('status', 'aktif')->whereIn('tipe', ['tetap', 'harian'])->get(),
            'titiks' => Titik::where('status', 'aktif')->get(),
        ]);
    }

    public function update(Request $request, ProductionSession $session)
    {
        $this->authorize('update', $session);

        $validated = $request->validate([
            'mesin_id' => 'required|exists:mesin_produksis,id',
            'titik_id' => 'required|exists:titiks,id',
            'produk_id' => 'required|exists:produks,id',
            'operator_karyawan_id' => 'required|exists:karyawans,id',
            'catatan' => 'nullable|string',
        ]);

        $session->update($validated);

        return redirect()->route('production.sessions.show', $session)
            ->with('success', 'Sesi produksi diperbarui.');
    }

    public function end(Request $request, ProductionSession $session)
    {
        $this->authorize('endSession', $session);

        $validated = $request->validate([
            'hasil_output' => 'required|numeric|min:0.01',
            'items' => 'nullable|array',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.jumlah_terpakai' => 'required|numeric|min:0.01',
            'catatan' => 'nullable|string',
        ]);

        $sessionResult = (new EndProductionSessionAction)->execute($session, $validated);

        return redirect()->route('production.sessions.show', ['session' => $sessionResult->id])
            ->with('success', 'Sesi produksi selesai.');
    }

    public function cancel(ProductionSession $session)
    {
        $this->authorize('delete', $session);

        if ($session->status === 'selesai') {
            return back()->with('error', 'Sesi sudah selesai, tidak bisa dibatalkan.');
        }

        $session->update(['status' => 'dibatalkan', 'selesai' => now()]);

        return back()->with('success', 'Sesi produksi dibatalkan.');
    }

    public function destroy(ProductionSession $session)
    {
        $this->authorize('delete', $session);

        if ($session->status === 'berjalan') {
            return back()->with('error', 'Sesi sedang berjalan, tidak bisa dihapus.');
        }
        $session->delete();

        return redirect()->route('production.sessions.index')
            ->with('success', 'Sesi produksi dihapus.');
    }
}
