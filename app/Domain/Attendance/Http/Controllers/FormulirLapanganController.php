<?php

namespace App\Domain\Attendance\Http\Controllers;

use App\Domain\Attendance\Actions\SubmitFieldFormAction;
use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Attendance\Models\Presensi;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FormulirLapanganController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', FormulirLapangan::class);

        $query = FormulirLapangan::with('presensi.karyawan');

        if ($request->filled('tanggal')) {
            $query->whereHas('presensi', fn ($q) => $q->whereDate('check_in', $request->tanggal));
        }

        $formulirs = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        return Inertia::render('Attendance/Formulir/Index', [
            'formulirs' => $formulirs,
            'filters' => $request->only(['tanggal']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', FormulirLapangan::class);

        $presensis = Presensi::with(['karyawan', 'titik'])
            ->doesntHave('formulir')
            ->whereNotNull('check_in')
            ->orderByDesc('check_in')
            ->get(['id', 'karyawan_id', 'titik_id', 'check_in']);

        return Inertia::render('Attendance/Formulir/Create', [
            'presensis' => $presensis,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', FormulirLapangan::class);

        $validated = $request->validate([
            'presensi_id' => 'required|exists:presensis,id',
            'kondisi_area' => 'nullable|string',
            'aktivitas_dilakukan' => 'required|string',
            'kendala' => 'nullable|string',
            'foto' => 'nullable|string',
            'catatan_tambahan' => 'nullable|string',
        ]);

        (new SubmitFieldFormAction())->execute($validated);

        return redirect()->route('attendance.formulir.index')
            ->with('success', 'Formulir lapangan berhasil dikirim.');
    }

    public function show(FormulirLapangan $formulir)
    {
        $this->authorize('view', $formulir);

        return Inertia::render('Attendance/Formulir/Show', [
            'formulir' => $formulir->load('presensi.karyawan', 'presensi.titik'),
        ]);
    }
}