<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Fleet\Models\Armada;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Production\Actions\CompleteDeliveryAction;
use App\Domain\Production\Actions\ScheduleDeliveryAction;
use App\Domain\Production\Models\Pengiriman;
use App\Domain\Production\Models\ProductionSession;
use App\Http\Controllers\Controller;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengirimanController extends Controller
{
    use FilterableTable;

    public function index(Request $request)
    {
        $query = Pengiriman::with(['session.produk', 'armada', 'driver']);

        $columns = [
            'waktu_muat' => ['type' => 'date'],
            'produk' => ['relation' => 'session.produk', 'column' => 'nama', 'type' => 'like'],
            'tujuan' => ['column' => 'tujuan_alamat', 'type' => 'like'],
            'armada' => ['relation' => 'armada', 'column' => 'nopol', 'type' => 'like'],
            'driver' => ['relation' => 'driver', 'column' => 'nama', 'type' => 'like'],
            'status' => ['type' => 'exact'],
        ];

        $sort = $this->applyTableQuery($query, $request, $columns, ['waktu_muat' => 'desc']);

        $pengirimen = $query->paginate($this->tablePerPage($request))->withQueryString();

        return Inertia::render('Production/Pengiriman/Index', [
            'pengirimen' => $pengirimen,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    public function today()
    {
        $today = now()->toDateString();

        return redirect()->route('production.pengiriman.index', [
            'filters' => ['waktu_muat' => ['from' => $today, 'to' => $today]],
        ]);
    }

    public function create()
    {
        return Inertia::render('Production/Pengiriman/Create', [
            'sessions' => ProductionSession::with(['produk', 'mesin'])
                ->where('status', 'selesai')
                ->latest('selesai')
                ->limit(50)
                ->get(),
            'armadas' => Armada::aktif()->where('model_tarif', 'internal')->get(),
            'drivers' => Karyawan::aktif()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'production_session_id' => 'required|exists:production_sessions,id',
            'armada_id' => 'nullable|exists:armadas,id',
            'driver_karyawan_id' => 'nullable|exists:karyawans,id',
            'tujuan_alamat' => 'required|string|max:255',
            'waktu_muat' => 'required|date',
            'catatan' => 'nullable|string',
        ]);

        $pengiriman = (new ScheduleDeliveryAction)->execute($validated);

        return redirect()->route('production.pengiriman.show', $pengiriman)
            ->with('success', 'Pengiriman dijadwalkan.');
    }

    public function show(Pengiriman $pengiriman)
    {
        $pengiriman->load(['session.produk', 'session.mesin', 'armada', 'driver']);

        return Inertia::render('Production/Pengiriman/Show', [
            'pengiriman' => $pengiriman,
        ]);
    }

    public function edit(Pengiriman $pengiriman)
    {
        if ($pengiriman->status !== 'dijadwalkan') {
            return back()->with('error', 'Hanya pengiriman berstatus dijadwalkan yang bisa diubah.');
        }

        $pengiriman->load(['session.produk', 'session.mesin', 'armada', 'driver']);

        return Inertia::render('Production/Pengiriman/Edit', [
            'pengiriman' => $pengiriman,
            'armadas' => Armada::aktif()->where('model_tarif', 'internal')->get(),
            'drivers' => Karyawan::aktif()->get(),
        ]);
    }

    public function update(Request $request, Pengiriman $pengiriman)
    {
        if ($pengiriman->status !== 'dijadwalkan') {
            return back()->with('error', 'Hanya pengiriman berstatus dijadwalkan yang bisa diubah.');
        }

        $validated = $request->validate([
            'armada_id' => 'nullable|exists:armadas,id',
            'driver_karyawan_id' => 'nullable|exists:karyawans,id',
            'tujuan_alamat' => 'required|string|max:255',
            'waktu_muat' => 'required|date',
            'catatan' => 'nullable|string',
        ]);

        $pengiriman->update($validated);

        return redirect()->route('production.pengiriman.show', $pengiriman)
            ->with('success', 'Pengiriman diperbarui.');
    }

    public function start(Pengiriman $pengiriman)
    {
        if ($pengiriman->status !== 'dijadwalkan') {
            return back()->with('error', 'Pengiriman sudah berjalan/selesai.');
        }

        $pengiriman->update(['status' => 'dalam_perjalanan']);

        return back()->with('success', 'Pengiriman mulai berjalan.');
    }

    public function complete(Request $request, Pengiriman $pengiriman)
    {
        $data = $request->validate([
            'waktu_tiba_tujuan' => 'nullable|date',
            'waktu_selesai_tuang' => 'nullable|date',
            'catatan' => 'nullable|string',
        ]);

        (new CompleteDeliveryAction)->execute($pengiriman, $data);

        return back()->with('success', 'Pengiriman selesai.');
    }

    public function cancel(Pengiriman $pengiriman)
    {
        if (in_array($pengiriman->status, ['selesai', 'dibatalkan'])) {
            return back()->with('error', 'Pengiriman tidak bisa dibatalkan.');
        }

        $pengiriman->update(['status' => 'dibatalkan']);

        return back()->with('success', 'Pengiriman dibatalkan.');
    }

    public function destroy(Pengiriman $pengiriman)
    {
        $pengiriman->delete();

        return redirect()->route('production.pengiriman.index')
            ->with('success', 'Pengiriman dihapus.');
    }
}
