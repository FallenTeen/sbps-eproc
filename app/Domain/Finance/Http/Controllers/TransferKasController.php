<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Domain\Finance\Actions\RecordTransferAntarKasAction;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\TransferAntarKas;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TransferKasController extends Controller
{
    /**
     * Display a listing of transfers.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', TransferAntarKas::class);
        $query = TransferAntarKas::with(['dariAkun', 'keAkun']);

        if ($request->filled('dari_akun')) {
            $query->where('dari_akun_kas_bank_id', $request->dari_akun);
        }

        if ($request->filled('ke_akun')) {
            $query->where('ke_akun_kas_bank_id', $request->ke_akun);
        }

        if ($request->filled('tanggal_from')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_from);
        }

        if ($request->filled('tanggal_to')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_to);
        }

        $transfers = $query->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $akunList = AkunKasBank::where('aktif', true)->get();

        return Inertia::render('Finance/TransferKas/Index', [
            'transfers' => $transfers,
            'akunList' => $akunList,
            'filters' => $request->only(['dari_akun', 'ke_akun', 'tanggal_from', 'tanggal_to']),
        ]);
    }

    /**
     * Show form to create a transfer.
     */
    public function create()
    {
        $this->authorize('create', TransferAntarKas::class);

        $akunList = AkunKasBank::where('aktif', true)->get();

        return Inertia::render('Finance/TransferKas/Create', [
            'akunList' => $akunList,
        ]);
    }

    /**
     * Store a new transfer.
     */
    public function store(Request $request)
    {
        $this->authorize('store', TransferAntarKas::class);

        $request->validate([
            'dari_akun_kas_bank_id' => 'required|exists:akun_kas_banks,id',
            'ke_akun_kas_bank_id' => 'required|exists:akun_kas_banks,id|different:dari_akun_kas_bank_id',
            'jumlah' => 'required|numeric|min:0.01',
            'tanggal' => 'required|date',
            'catatan' => 'nullable|string',
        ]);

        // Validasi saldo sumber cukup
        $dariAkun = AkunKasBank::find($request->dari_akun_kas_bank_id);
        $saldoSumber = $dariAkun->saldo_awal + MutasiKasBank::where('akun_kas_bank_id', $dariAkun->id)
            ->sum(\DB::raw('CASE WHEN tipe = "masuk" THEN jumlah ELSE -jumlah END'));

        if ($saldoSumber < $request->jumlah) {
            return back()->withErrors(['jumlah' => 'Saldo sumber tidak mencukupi.']);
        }

        $transfer = (new RecordTransferAntarKasAction)->execute($request->all(), Auth::id());

        return redirect()->route('finance.transfer-kas.index')
            ->with('success', 'Transfer kas berhasil.');
    }

    /**
     * Display the specified transfer.
     */
    public function show(TransferAntarKas $transfer)
    {
        $this->authorize('view', $transfer);

        $transfer->load(['dariAkun', 'keAkun']);

        return Inertia::render('Finance/TransferKas/Show', [
            'transfer' => $transfer,
        ]);
    }

    /**
     * Get transfers by unit bisnis.
     */
    public function byUnit(Request $request, $unitBisnisId)
    {
        $this->authorize('byUnit', TransferAntarKas::class);

        $akunIds = AkunKasBank::where('unit_bisnis_id', $unitBisnisId)->pluck('id');

        $transfers = TransferAntarKas::whereIn('dari_akun_kas_bank_id', $akunIds)
            ->orWhereIn('ke_akun_kas_bank_id', $akunIds)
            ->with(['dariAkun', 'keAkun'])
            ->orderBy('tanggal', 'desc')
            ->paginate(15);

        return Inertia::render('Finance/TransferKas/ByUnit', [
            'transfers' => $transfers,
            'unitBisnisId' => $unitBisnisId,
        ]);
    }
}
