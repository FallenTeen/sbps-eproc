<?php

namespace App\Domain\Attendance\Http\Controllers;

use App\Domain\Attendance\Actions\ValidateLocationCheckInAction;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PresensiController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Presensi::class);

        $query = Presensi::with(['karyawan', 'titik', 'formulir']);

        if ($request->filled('tanggal')) {
            $query->byTanggal($request->tanggal);
        }

        if ($request->filled('karyawan_id')) {
            $query->byKaryawan($request->karyawan_id);
        }

        if ($request->filled('status_validasi')) {
            $query->where('status_validasi', $request->status_validasi);
        }

        $presensis = $query->orderByDesc('check_in')->paginate(15)->withQueryString();

        return Inertia::render('Attendance/Presensi/Index', [
            'presensis' => $presensis,
            'karyawan' => Karyawan::aktif()->get(['id', 'nama']),
            'filters' => $request->only(['tanggal', 'karyawan_id', 'status_validasi']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Presensi::class);

        return Inertia::render('Attendance/Presensi/Create', [
            'karyawan' => Karyawan::aktif()->get(['id', 'nama', 'tipe', 'jabatan']),
            'titiks' => Titik::aktif()->get(['id', 'nama', 'latitude', 'longitude', 'radius_presensi_meter']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Presensi::class);

        $validated = $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'check_in' => 'required|date',
            'check_in_lat' => 'required|numeric',
            'check_in_lng' => 'required|numeric',
        ]);

        $statusValidasi = 'tidak_valid';
        $titik = Titik::find($validated['titik_id'] ?? null);

        if ($titik) {
            $statusValidasi = (new ValidateLocationCheckInAction)->execute(
                $titik,
                (float) $validated['check_in_lat'],
                (float) $validated['check_in_lng']
            );
        }

        $presensi = Presensi::create([
            'karyawan_id' => $validated['karyawan_id'],
            'titik_id' => $validated['titik_id'] ?? null,
            'check_in' => $validated['check_in'],
            'check_in_lat' => $validated['check_in_lat'],
            'check_in_lng' => $validated['check_in_lng'],
            'status_validasi' => $statusValidasi,
        ]);

        return redirect()->route('attendance.presensi.index')
            ->with('success', 'Presensi check-in berhasil dicatat.');
    }

    public function show(Presensi $presensi)
    {
        $this->authorize('view', $presensi);

        return Inertia::render('Attendance/Presensi/Show', [
            'presensi' => $presensi->load(['karyawan', 'titik', 'formulir']),
        ]);
    }

    public function checkOut(Request $request, Presensi $presensi)
    {
        $this->authorize('checkOut', $presensi);

        $validated = $request->validate([
            'check_out_lat' => 'required|numeric',
            'check_out_lng' => 'required|numeric',
        ]);

        $presensi->update([
            'check_out' => now(),
            'check_out_lat' => $validated['check_out_lat'],
            'check_out_lng' => $validated['check_out_lng'],
        ]);

        return back()->with('success', 'Check-out berhasil dicatat.');
    }

    public function review(Request $request, Presensi $presensi)
    {
        $this->authorize('review', $presensi);

        $validated = $request->validate([
            'status_validasi' => 'required|in:valid,tidak_valid,luar_radius',
            'catatan_override' => 'nullable|string',
        ]);

        $presensi->update([
            'status_validasi' => $validated['status_validasi'],
            'catatan_override' => $validated['catatan_override'] ?? null,
        ]);

        return back()->with('success', 'Status validasi presensi diperbarui.');
    }
}
