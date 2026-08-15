<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MutasiKasBankController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', MutasiKasBank::class);

        $query = MutasiKasBank::with(['akunKasBank', 'referensi']);

        // Filter by akun
        if ($request->filled('akun_kas_bank_id')) {
            $query->where('akun_kas_bank_id', $request->akun_kas_bank_id);
        }

        // Filter by tipe (masuk/keluar)
        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }

        // Filter by tanggal range
        if ($request->filled('tanggal_from')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_from);
        }
        if ($request->filled('tanggal_to')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_to);
        }

        // Filter kategori
        if ($request->filled('kategori')) {
            $query->where('kategori', $request->kategori);
        }

        $mutasis = $query->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $akunList = AkunKasBank::where('aktif', true)->get();

        return Inertia::render('Finance/MutasiKas/Index', [
            'mutasis' => $mutasis,
            'akunList' => $akunList,
            'filters' => $request->only(['akun_kas_bank_id', 'tipe', 'tanggal_from', 'tanggal_to', 'kategori']),
        ]);
    }

    /**
     * Store a new mutasi (manual).
     */
    public function store(Request $request)
    {
        $this->authorize('store', MutasiKasBank::class);

        $request->validate([
            'akun_kas_bank_id' => 'required|exists:akun_kas_banks,id',
            'kategori' => 'required|string|max:255',
            'tipe' => 'required|in:masuk,keluar',
            'jumlah' => 'required|numeric|min:0.01',
            'tanggal' => 'required|date',
            'catatan' => 'nullable|string',
        ]);

        $mutasi = MutasiKasBank::create([
            'akun_kas_bank_id' => $request->akun_kas_bank_id,
            'kategori' => $request->kategori,
            'tipe' => $request->tipe,
            'jumlah' => $request->jumlah,
            'tanggal' => $request->tanggal,
            'catatan' => $request->catatan,
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('finance.mutasi-kas.index')
            ->with('success', 'Mutasi kas berhasil dicatat.');
    }

    /**
     * Display the specified mutasi.
     */
    public function show(MutasiKasBank $mutasiKasBank)
    {
        $mutasiKasBank->load(['akunKasBank', 'referensi']);

        return Inertia::render('Finance/MutasiKas/Show', [
            'mutasi' => $mutasiKasBank,
        ]);
    }

    /**
     * Generate report per periode.
     */
    public function report(Request $request)
    {
        $this->authorize('report', MutasiKasBank::class);

        $request->validate([
            'akun_kas_bank_id' => 'required|exists:akun_kas_banks,id',
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000|max:2100',
        ]);

        $akun = AkunKasBank::findOrFail($request->akun_kas_bank_id);

        $mutasis = MutasiKasBank::where('akun_kas_bank_id', $akun->id)
            ->whereMonth('tanggal', $request->bulan)
            ->whereYear('tanggal', $request->tahun)
            ->get();

        $totalMasuk = $mutasis->where('tipe', 'masuk')->sum('jumlah');
        $totalKeluar = $mutasis->where('tipe', 'keluar')->sum('jumlah');
        $saldoAwal = $akun->saldo_awal + MutasiKasBank::where('akun_kas_bank_id', $akun->id)
            ->where(function ($q) use ($request) {
                $q->whereYear('tanggal', '<', $request->tahun)
                    ->orWhere(function ($q2) use ($request) {
                        $q2->whereYear('tanggal', $request->tahun)
                            ->whereMonth('tanggal', '<', $request->bulan);
                    });
            })
            ->sum(\DB::raw('CASE WHEN tipe = "masuk" THEN jumlah ELSE -jumlah END'));

        $saldoAkhir = $saldoAwal + $totalMasuk - $totalKeluar;

        return Inertia::render('Finance/MutasiKas/Report', [
            'akun' => $akun,
            'mutasis' => $mutasis,
            'totalMasuk' => $totalMasuk,
            'totalKeluar' => $totalKeluar,
            'saldoAwal' => $saldoAwal,
            'saldoAkhir' => $saldoAkhir,
            'bulan' => $request->bulan,
            'tahun' => $request->tahun,
        ]);
    }

    /**
     * Get current saldo for an akun.
     */
    public function saldo(Request $request, $akunKasBankId)
    {
        $akun = AkunKasBank::findOrFail($akunKasBankId);

        $saldo = $akun->saldo_awal + MutasiKasBank::where('akun_kas_bank_id', $akun->id)
            ->sum(\DB::raw('CASE WHEN tipe = "masuk" THEN jumlah ELSE -jumlah END'));

        return response()->json([
            'akun' => $akun->nama,
            'saldo' => $saldo,
        ]);
    }
}