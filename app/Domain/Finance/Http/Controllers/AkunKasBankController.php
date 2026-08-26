<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Actions\RecordTransferAntarKasAction;
use App\Domain\Finance\Models\AkunKasBank;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AkunKasBankController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', AkunKasBank::class);

        $user = $request->user();
        $unitBisnisId = $request->input('unit_bisnis_id');

        if ($user && ! $user->hasRole(['Owner', 'Admin Keuangan']) && $user->unit_bisnis_id) {
            $unitBisnisId = $user->unit_bisnis_id;
        } elseif (! $unitBisnisId) {
            $unitBisnis = UnitBisnis::first();
            $unitBisnisId = $unitBisnis ? $unitBisnis->id : null;
        }

        $akunKas = AkunKasBank::query()
            ->when($unitBisnisId, function ($q, $unitBisnisId) {
                return $q->where('unit_bisnis_id', $unitBisnisId);
            })
            ->withSum(['mutasis as total_masuk' => function ($q) {
                $q->where('tipe', 'masuk');
            }], 'jumlah')
            ->withSum(['mutasis as total_keluar' => function ($q) {
                $q->where('tipe', 'keluar');
            }], 'jumlah')
            ->get()
            ->map(function ($akun) {
                $akun->saldo_saat_ini = $akun->saldo_awal + ($akun->total_masuk ?? 0) - ($akun->total_keluar ?? 0);

                return $akun;
            });

        $unitBisnisList = UnitBisnis::all(['id', 'nama']);
        if ($user && ! $user->hasRole(['Owner', 'Admin Keuangan']) && $user->unit_bisnis_id) {
            $unitBisnisList = UnitBisnis::where('id', $user->unit_bisnis_id)->get(['id', 'nama']);
        }

        return Inertia::render('Finance/AkunKas/Index', [
            'akunKas' => $akunKas,
            'unit_bisnis_id' => $unitBisnisId,
            'unitBisnisList' => $unitBisnisList,
        ]);
    }

    public function create()
    {
        $this->authorize('create', AkunKasBank::class);

        $user = auth()->user();
        $unitBisnisList = UnitBisnis::all(['id', 'nama']);
        if ($user && ! $user->hasRole(['Owner', 'Admin Keuangan']) && $user->unit_bisnis_id) {
            $unitBisnisList = UnitBisnis::where('id', $user->unit_bisnis_id)->get(['id', 'nama']);
        }

        return Inertia::render('Finance/AkunKas/Create', [
            'unitBisnisList' => $unitBisnisList,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', AkunKasBank::class);

        $validated = $request->validate([
            'unit_bisnis_id' => 'required|exists:unit_bisnis,id',
            'nama' => 'required|string|max:255',
            'jenis_kas' => 'required|in:kas_kecil,kas_besar,kas_operasional,bank',
            'saldo_awal' => 'nullable|numeric|min:0',
            'aktif' => 'boolean',
        ]);

        if (! isset($validated['saldo_awal'])) {
            $validated['saldo_awal'] = 0;
        }
        if (! isset($validated['aktif'])) {
            $validated['aktif'] = true;
        }

        AkunKasBank::create($validated);

        return redirect()->route('finance.akun-kas.index', ['unit_bisnis_id' => $validated['unit_bisnis_id']])->with('success', 'Akun Kas berhasil ditambahkan.');
    }

    public function edit(AkunKasBank $akun_ka)
    {
        $this->authorize('update', $akun_ka);

        return Inertia::render('Finance/AkunKas/Edit', [
            'akunKas' => $akun_ka,
            'unitBisnisList' => UnitBisnis::all(['id', 'nama']),
        ]);
    }

    public function update(Request $request, AkunKasBank $akun_ka)
    {
        $this->authorize('update', $akun_ka);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'jenis_kas' => 'required|in:kas_kecil,kas_besar,kas_operasional,bank',
            'aktif' => 'boolean',
        ]);

        $akun_ka->update($validated);

        return redirect()->route('finance.akun-kas.index', ['unit_bisnis_id' => $akun_ka->unit_bisnis_id])->with('success', 'Akun Kas berhasil diupdate.');
    }

    public function mutasi(Request $request, AkunKasBank $akunKasBank)
    {
        $this->authorize('view', $akunKasBank);

        $bulan = $request->input('bulan', date('m'));
        $tahun = $request->input('tahun', date('Y'));

        $mutasis = $akunKasBank->mutasis()
            ->whereYear('tanggal', $tahun)
            ->whereMonth('tanggal', $bulan)
            ->with('referensi')
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate summary for the period
        $akunKasBank->loadSum(['mutasis as total_masuk_all' => function ($q) {
            $q->where('tipe', 'masuk');
        }], 'jumlah');
        $akunKasBank->loadSum(['mutasis as total_keluar_all' => function ($q) {
            $q->where('tipe', 'keluar');
        }], 'jumlah');

        $saldoSaatIni = $akunKasBank->saldo_awal + ($akunKasBank->total_masuk_all ?? 0) - ($akunKasBank->total_keluar_all ?? 0);

        return Inertia::render('Finance/AkunKas/Mutasi', [
            'akunKas' => $akunKasBank,
            'mutasis' => $mutasis,
            'filter' => [
                'bulan' => (string) $bulan,
                'tahun' => (string) $tahun,
            ],
            'summary' => [
                'saldo_awal_akun' => $akunKasBank->saldo_awal,
                'total_masuk' => $akunKasBank->total_masuk_all ?? 0,
                'total_keluar' => $akunKasBank->total_keluar_all ?? 0,
                'saldo_saat_ini' => $saldoSaatIni,
            ],
        ]);
    }

    public function transfer(Request $request)
    {
        $this->authorize('create', AkunKasBank::class);

        $validated = $request->validate([
            'dari_akun_kas_bank_id' => 'required|exists:akun_kas_banks,id',
            'ke_akun_kas_bank_id' => 'required|exists:akun_kas_banks,id|different:dari_akun_kas_bank_id',
            'jumlah' => 'required|numeric|min:1',
            'tanggal' => 'required|date',
            'catatan' => 'nullable|string',
        ]);

        (new RecordTransferAntarKasAction)->execute($validated, auth()->id());

        return redirect()->back()->with('success', 'Transfer berhasil dicatat.');
    }
}
