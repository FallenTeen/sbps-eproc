<?php

namespace App\Domain\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\HR\Models\Cuti;
use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Actions\SubmitCutiAction;
use App\Domain\HR\Actions\ApproveCutiAction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CutiController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'diajukan'); // default diajukan

        $query = Cuti::with(['karyawan', 'disetujuiOleh'])->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $cutis = $query->get();
        $karyawan = Karyawan::where('status', 'aktif')->get();

        return Inertia::render('HR/Cuti/Index', [
            'cutis' => $cutis,
            'karyawan' => $karyawan,
            'filters' => [
                'status' => $status
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'tipe' => 'required|string',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'catatan' => 'nullable|string'
        ]);

        (new SubmitCutiAction())->execute($request->all());

        return back()->with('success', 'Pengajuan cuti berhasil dibuat.');
    }

    public function approve(Request $request, Cuti $cuti)
    {
        (new ApproveCutiAction())->execute($cuti, 'disetujui', $request->input('catatan'));
        return back()->with('success', 'Cuti berhasil disetujui.');
    }

    public function reject(Request $request, Cuti $cuti)
    {
        (new ApproveCutiAction())->execute($cuti, 'ditolak', $request->input('catatan'));
        return back()->with('success', 'Cuti berhasil ditolak.');
    }
}
