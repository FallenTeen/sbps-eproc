<?php

namespace App\Domain\HR\Http\Controllers;

use App\Domain\HR\Actions\ApproveCutiAction;
use App\Domain\HR\Actions\SubmitCutiAction;
use App\Domain\HR\Models\Cuti;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Controller;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CutiController extends Controller
{
    use FilterableTable;

    public function index(Request $request)
    {
        $query = Cuti::with(['karyawan', 'disetujuiOleh']);

        $columns = [
            'karyawan' => ['relation' => 'karyawan', 'column' => 'nama', 'type' => 'like'],
            'tipe' => ['type' => 'exact'],
            'tanggal' => ['type' => 'date', 'column' => 'tanggal_mulai'],
            'status' => ['type' => 'exact'],
        ];

        $sort = $this->applyTableQuery($query, $request, $columns, ['created_at' => 'desc']);

        $cutis = $query->paginate($this->tablePerPage($request))->withQueryString();
        $karyawan = Karyawan::where('status', 'aktif')->get();

        return Inertia::render('HR/Cuti/Index', [
            'cutis' => $cutis,
            'karyawan' => $karyawan,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'tipe' => 'required|string',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'catatan' => 'nullable|string',
        ]);

        (new SubmitCutiAction)->execute($request->all());

        return back()->with('success', 'Pengajuan cuti berhasil dibuat.');
    }

    public function edit(Cuti $cuti)
    {
        return Inertia::render('HR/Cuti/Edit', [
            'cuti' => $cuti->load(['karyawan', 'disetujuiOleh']),
        ]);
    }

    public function update(Request $request, Cuti $cuti)
    {
        $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'tipe' => 'required|string',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'catatan' => 'nullable|string',
        ]);

        $cuti->update([
            'karyawan_id' => $request->karyawan_id,
            'tipe' => $request->tipe,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'catatan' => $request->catatan,
        ]);

        return back()->with('success', 'Pengajuan cuti berhasil diperbarui.');
    }

    public function destroy(Cuti $cuti)
    {
        $cuti->delete();

        return back()->with('success', 'Pengajuan cuti berhasil dihapus.');
    }

    public function approve(Request $request, Cuti $cuti)
    {
        (new ApproveCutiAction)->execute($cuti, 'disetujui', $request->input('catatan'));

        return back()->with('success', 'Cuti berhasil disetujui.');
    }

    public function reject(Request $request, Cuti $cuti)
    {
        (new ApproveCutiAction)->execute($cuti, 'ditolak', $request->input('catatan'));

        return back()->with('success', 'Cuti berhasil ditolak.');
    }
}
