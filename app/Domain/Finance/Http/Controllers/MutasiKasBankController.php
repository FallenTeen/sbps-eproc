<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Http\Controllers\Controller;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MutasiKasBankController extends Controller
{
    use FilterableTable;

    public function index(Request $request)
    {
        $this->authorize('viewAny', MutasiKasBank::class);

        $query = MutasiKasBank::with(['akunKasBank', 'referensi']);

        $columns = [
            'tanggal' => ['type' => 'date'],
            'akun' => ['relation' => 'akunKasBank', 'column' => 'id', 'type' => 'exact'],
            'kategori' => ['type' => 'like'],
            'tipe' => ['type' => 'exact'],
            'jumlah' => ['type' => 'exact', 'searchable' => false],
            'referensi' => ['sortable' => false],
        ];

        $sort = $this->applyTableQuery($query, $request, $columns, ['tanggal' => 'desc', 'created_at' => 'desc']);

        $mutasis = $query->paginate($this->tablePerPage($request))->withQueryString();

        $akunList = AkunKasBank::where('aktif', true)->get();

        return Inertia::render('Finance/MutasiKas/Index', [
            'mutasis' => $mutasis,
            'akunList' => $akunList,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
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
