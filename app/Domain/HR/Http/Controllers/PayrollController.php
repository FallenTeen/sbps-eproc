<?php

namespace App\Domain\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\HR\Models\GajiPeriode;
use App\Domain\HR\Models\KomponenGaji;
use App\Domain\HR\Services\GeneratePayrollPeriodService;
use App\Domain\HR\Actions\CalculateNetSalaryAction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PayrollController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', GajiPeriode::class);

        $periodes = GajiPeriode::select('periode_bulan', 'periode_tahun', 'status')
            ->selectRaw('count(id) as jumlah_karyawan')
            ->groupBy('periode_bulan', 'periode_tahun', 'status')
            ->orderBy('periode_tahun', 'desc')
            ->orderBy('periode_bulan', 'desc')
            ->get();
            
        $calc = new CalculateNetSalaryAction();
        $periodes->transform(function ($item) use ($calc) {
            $gajis = GajiPeriode::with('komponen')
                ->where('periode_bulan', $item->periode_bulan)
                ->where('periode_tahun', $item->periode_tahun)
                ->where('status', $item->status)
                ->get();
            $item->total_gaji = $gajis->sum(fn($g) => $calc->execute($g));
            return $item;
        });

        return Inertia::render('HR/Payroll/Index', [
            'periodes' => $periodes
        ]);
    }

    public function generate(Request $request)
    {
        $this->authorize('create', GajiPeriode::class);

        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000'
        ]);

        (new GeneratePayrollPeriodService())->generate($request->bulan, $request->tahun);

        return back()->with('success', "Payroll periode {$request->bulan}/{$request->tahun} berhasil digenerate.");
    }

    public function show($bulan, $tahun)
    {
        $this->authorize('viewAny', GajiPeriode::class);

        $gajis = GajiPeriode::with(['karyawan', 'komponen'])
            ->where('periode_bulan', $bulan)
            ->where('periode_tahun', $tahun)
            ->get();

        if ($gajis->isEmpty()) {
            return redirect()->route('hr.payroll.index')->with('error', 'Data periode tidak ditemukan.');
        }

        $calc = new CalculateNetSalaryAction();
        $gajis->transform(function($g) use ($calc) {
            $g->netto = $calc->execute($g);
            return $g;
        });

        $status = $gajis->first()->status;
        $total_gaji = $gajis->sum('netto');

        return Inertia::render('HR/Payroll/Show', [
            'bulan' => $bulan,
            'tahun' => $tahun,
            'status' => $status,
            'gajis' => $gajis,
            'total_gaji' => $total_gaji
        ]);
    }

    public function review(GajiPeriode $periode)
    {
        $this->authorize('view', $periode);

        $periode->load(['karyawan', 'komponen']);
        $netto = (new CalculateNetSalaryAction())->execute($periode);

        return Inertia::render('HR/Payroll/Review', [
            'periode' => $periode,
            'netto' => $netto
        ]);
    }

    public function addKomponen(Request $request, GajiPeriode $periode)
    {
        $this->authorize('update', $periode);

        $request->validate([
            'jenis' => 'required|string|in:tunjangan,potongan',
            'jumlah' => 'required|numeric|min:0',
            'keterangan' => 'required|string|max:255',
        ]);

        $periode->komponen()->create($request->only(['jenis', 'jumlah', 'keterangan']));

        return back()->with('success', 'Komponen gaji berhasil ditambahkan.');
    }

    public function deleteKomponen(KomponenGaji $komponen)
    {
        $periode = $komponen->gajiPeriode;
        if ($periode) {
            $this->authorize('update', $periode);
        }

        $komponen->delete();
        return back()->with('success', 'Komponen gaji berhasil dihapus.');
    }

    public function pay(Request $request, $bulan, $tahun)
    {
        $this->authorize('create', GajiPeriode::class);

        GajiPeriode::where('periode_bulan', $bulan)
            ->where('periode_tahun', $tahun)
            ->update([
                'status' => 'dibayar',
                'tanggal_dibayar' => now()
            ]);

        return back()->with('success', 'Payroll berhasil ditandai sebagai dibayar.');
    }
}
