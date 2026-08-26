<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Fleet\Models\Armada;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Production\Actions\CompleteDeliveryAction;
use App\Domain\Production\Actions\ScheduleDeliveryAction;
use App\Domain\Production\Models\Pengiriman;
use App\Domain\Production\Models\ProductionSession;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengirimanController extends Controller
{
    public function index(Request $request)
    {
        $query = Pengiriman::with(['session.produk', 'armada', 'driver']);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('tanggal') && $request->tanggal) {
            $query->whereDate('waktu_muat', $request->tanggal);
        }

        $pengirimen = $query->orderBy('waktu_muat', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Production/Pengiriman/Index', [
            'pengirimen' => $pengirimen,
            'filters' => $request->only(['status', 'tanggal']),
        ]);
    }

    public function today()
    {
        $pengirimen = Pengiriman::with(['session.produk', 'armada', 'driver'])
            ->whereDate('waktu_muat', now()->toDateString())
            ->orderBy('waktu_muat', 'desc')
            ->get();

        return Inertia::render('Production/Pengiriman/Index', [
            'pengirimen' => $pengirimen,
            'filters' => ['status' => null, 'tanggal' => now()->toDateString()],
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
