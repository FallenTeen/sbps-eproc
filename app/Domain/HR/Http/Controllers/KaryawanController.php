<?php

namespace App\Domain\HR\Http\Controllers;

use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class KaryawanController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Karyawan::class);

        $query = Karyawan::with(['user', 'assignments' => function ($q) {
            $q->where('status', 'aktif')->with('titik');
        }]);

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('nama', 'like', '%'.$request->search.'%')
                ->orWhere('jabatan', 'like', '%'.$request->search.'%');
        }

        $karyawans = $query->orderBy('nama')->paginate(15)->withQueryString();

        $user = $request->user();
        $canManageHr = $user && ($user->hasRole(['Owner', 'Koordinator SDM']) || $user->hasPermissionTo('manage hr'));

        // Sembunyikan field gaji untuk role yang tidak berhak
        if (! $canManageHr) {
            $karyawans->getCollection()->transform(function ($karyawan) {
                $karyawan->makeHidden(['rate_gaji_pokok', 'rate_harian', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_ketenagakerjaan']);

                return $karyawan;
            });
        }

        return Inertia::render('HR/Karyawan/Index', [
            'karyawans' => $karyawans,
            'filters' => $request->only(['tipe', 'status', 'search']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Karyawan::class);

        return Inertia::render('HR/Karyawan/Create');
    }

    public function store(Request $request)
    {
        $this->authorize('create', Karyawan::class);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tipe' => ['required', Rule::in(['tetap', 'harian', 'borongan_rit'])],
            'jabatan' => 'required|string|max:255',
            'rate_gaji_pokok' => 'nullable|numeric|min:0',
            'rate_harian' => 'nullable|numeric|min:0',
            'npwp' => 'nullable|string|max:50',
            'no_bpjs_kesehatan' => 'nullable|string|max:50',
            'no_bpjs_ketenagakerjaan' => 'nullable|string|max:50',
            'status_ptkp' => 'nullable|string|max:20',
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ]);

        Karyawan::create($validated);

        return redirect()->route('hr.karyawan.index')
            ->with('success', 'Data karyawan berhasil ditambahkan.');
    }

    public function show(Karyawan $karyawan)
    {
        $this->authorize('view', $karyawan);

        $karyawan->load(['user', 'assignments' => function ($q) {
            $q->with('titik')->orderBy('tanggal_mulai', 'desc');
        }]);

        $user = auth()->user();
        $isSelf = $user && (string) $karyawan->user_id === (string) $user->id;
        $canManageHr = $user && ($user->hasRole(['Owner', 'Koordinator SDM']) || $user->hasPermissionTo('manage hr'));

        if (! $canManageHr && ! $isSelf) {
            $karyawan->makeHidden(['rate_gaji_pokok', 'rate_harian', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_ketenagakerjaan']);
        }

        return Inertia::render('HR/Karyawan/Show', [
            'karyawan' => $karyawan,
            'titiks' => Titik::aktif()->get(),
        ]);
    }

    public function edit(Karyawan $karyawan)
    {
        $this->authorize('update', $karyawan);

        return Inertia::render('HR/Karyawan/Edit', [
            'karyawan' => $karyawan,
        ]);
    }

    public function update(Request $request, Karyawan $karyawan)
    {
        $this->authorize('update', $karyawan);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tipe' => ['required', Rule::in(['tetap', 'harian', 'borongan_rit'])],
            'jabatan' => 'required|string|max:255',
            'rate_gaji_pokok' => 'nullable|numeric|min:0',
            'rate_harian' => 'nullable|numeric|min:0',
            'npwp' => 'nullable|string|max:50',
            'no_bpjs_kesehatan' => 'nullable|string|max:50',
            'no_bpjs_ketenagakerjaan' => 'nullable|string|max:50',
            'status_ptkp' => 'nullable|string|max:20',
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ]);

        $karyawan->update($validated);

        return redirect()->route('hr.karyawan.index')
            ->with('success', 'Data karyawan berhasil diperbarui.');
    }

    public function destroy(Karyawan $karyawan)
    {
        $this->authorize('delete', $karyawan);

        $karyawan->delete();

        return redirect()->route('hr.karyawan.index')
            ->with('success', 'Data karyawan berhasil dihapus.');
    }

    public function updateStatus(Request $request, Karyawan $karyawan)
    {
        $this->authorize('updateStatus', $karyawan);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ]);

        $karyawan->update(['status' => $validated['status']]);

        return back()->with('success', 'Status karyawan diperbarui.');
    }

    public function assignTitik(Request $request, Karyawan $karyawan)
    {
        $this->authorize('assignTitik', $karyawan);

        $request->validate([
            'titik_id' => 'required|exists:titiks,id',
            'tanggal_mulai' => 'required|date',
        ]);

        // Tutup assignment lama yang masih aktif
        $karyawan->assignments()->where('status', 'aktif')->update([
            'status' => 'selesai',
            'tanggal_selesai' => Carbon::parse($request->tanggal_mulai)->subDay(),
        ]);

        // Buat assignment baru
        $karyawan->assignments()->create([
            'titik_id' => $request->titik_id,
            'tanggal_mulai' => $request->tanggal_mulai,
            'status' => 'aktif',
        ]);

        return back()->with('success', 'Karyawan berhasil ditugaskan ke Titik baru.');
    }

    public function removeTitik(Request $request, Karyawan $karyawan)
    {
        $this->authorize('removeTitik', $karyawan);

        $request->validate([
            'assignment_id' => 'required|exists:karyawan_titik_assignments,id',
            'tanggal_selesai' => 'required|date',
        ]);

        $karyawan->assignments()->where('id', $request->assignment_id)->update([
            'status' => 'selesai',
            'tanggal_selesai' => $request->tanggal_selesai,
        ]);

        return back()->with('success', 'Penugasan Titik berhasil diakhiri.');
    }
}
