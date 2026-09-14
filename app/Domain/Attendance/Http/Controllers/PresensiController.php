<?php

namespace App\Domain\Attendance\Http\Controllers;

use App\Domain\Attendance\Actions\ValidateLocationCheckInAction;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

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
            $validation = (new ValidateLocationCheckInAction)->execute(
                $titik,
                (float) $validated['check_in_lat'],
                (float) $validated['check_in_lng']
            );
            $statusValidasi = $validation['status_validasi'];
            $catatanOverride = $validation['catatan_override'];
        } else {
            $catatanOverride = null;
        }

        $presensi = Presensi::create([
            'karyawan_id' => $validated['karyawan_id'],
            'titik_id' => $validated['titik_id'] ?? null,
            'check_in' => $validated['check_in'],
            'check_in_lat' => $validated['check_in_lat'],
            'check_in_lng' => $validated['check_in_lng'],
            'status_validasi' => $statusValidasi,
            'catatan_override' => $catatanOverride,
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

    /**
     * Rekap / index presensi untuk dashboard — grup berdasarkan hari,
     * titik kerja, proyek, atau role, dalam rentang tanggal.
     */
    public function rekap(Request $request)
    {
        $this->authorize('viewAny', Presensi::class);

        $groupBy = in_array($request->input('group_by'), ['hari', 'titik', 'proyek', 'role'], true)
            ? $request->input('group_by')
            : 'hari';

        $from = Carbon::parse($request->filled('from') ? $request->input('from') : now()->startOfMonth()->toDateString())
            ->startOfDay();
        $to = Carbon::parse($request->filled('to') ? $request->input('to') : now()->toDateString())
            ->endOfDay();

        $query = Presensi::query()
            ->with(['karyawan.user.roles', 'titik.proyek'])
            ->whereBetween('check_in', [$from, $to]);

        if ($request->filled('titik_id')) {
            $query->where('titik_id', $request->input('titik_id'));
        }

        if ($request->filled('status_validasi')) {
            $query->where('status_validasi', $request->input('status_validasi'));
        }

        $presensis = $query->orderBy('check_in')->get();

        $summary = [
            'total' => $presensis->count(),
            'karyawan_uniq' => $presensis->pluck('karyawan_id')->unique()->count(),
            'selesai' => $presensis->filter(fn (Presensi $p) => $p->check_out !== null)->count(),
            'valid' => $presensis->where('status_validasi', 'valid')->count(),
            'luar_radius' => $presensis->where('status_validasi', 'luar_radius')->count(),
            'tidak_valid' => $presensis->where('status_validasi', 'tidak_valid')->count(),
        ];

        $groups = match ($groupBy) {
            'titik' => $this->rekapPerTitik($presensis),
            'proyek' => $this->rekapPerProyek($presensis),
            'role' => $this->rekapPerRole($presensis),
            default => $this->rekapPerHari($presensis, $from, $to),
        };

        return Inertia::render('Attendance/Presensi/Rekap', [
            'summary' => $summary,
            'groups' => $groups,
            'filters' => [
                'group_by' => $groupBy,
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'titik_id' => $request->input('titik_id'),
                'status_validasi' => $request->input('status_validasi'),
            ],
            'titiks' => Titik::aktif()
                ->with('proyek:id,nama,kode_proyek')
                ->orderBy('nama')
                ->get(['id', 'nama', 'proyek_id']),
            'roles' => Role::orderBy('name')->pluck('name'),
        ]);
    }

    /** Satu baris agregat sebuah kelompok. */
    private function groupRow(Collection $items, string $key, string $label, ?string $parent = null): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'parent' => $parent,
            'total' => $items->count(),
            'selesai' => $items->filter(fn (Presensi $p) => $p->check_out !== null)->count(),
            'valid' => $items->where('status_validasi', 'valid')->count(),
            'luar_radius' => $items->where('status_validasi', 'luar_radius')->count(),
            'tidak_valid' => $items->where('status_validasi', 'tidak_valid')->count(),
        ];
    }

    private function rekapPerHari(Collection $presensis, Carbon $from, Carbon $to): array
    {
        $perHari = $presensis->groupBy(
            fn (Presensi $p) => $p->check_in ? $p->check_in->toDateString() : 'tanpa_tanggal'
        );

        $rows = [];
        for ($date = $from->copy(); $date->lte($to); $date->addDay()) {
            $key = $date->toDateString();
            $items = $perHari->get($key, collect());
            $rows[] = $this->groupRow($items, $key, $date->translatedFormat('D, d M Y'));
        }

        return $rows;
    }

    private function rekapPerTitik(Collection $presensis): array
    {
        $per = $presensis->groupBy(fn (Presensi $p) => (string) ($p->titik_id ?? 'tanpa_titik'));

        $rows = Titik::aktif()->with('proyek:id,nama,kode_proyek')->orderBy('nama')->get()
            ->map(fn (Titik $titik) => $this->groupRow(
                $per->get((string) $titik->id, collect()),
                (string) $titik->id,
                $titik->nama,
                $titik->proyek?->nama
            ));

        if ($per->has('tanpa_titik')) {
            $rows->push($this->groupRow($per->get('tanpa_titik'), 'tanpa_titik', 'Tanpa Titik'));
        }

        return $rows->sortByDesc('total')->values()->all();
    }

    private function rekapPerProyek(Collection $presensis): array
    {
        $per = $presensis->groupBy(fn (Presensi $p) => (string) ($p->titik?->proyek_id ?? 'tanpa_proyek'));

        $rows = Proyek::orderBy('nama')->get()
            ->map(fn (Proyek $proyek) => $this->groupRow(
                $per->get((string) $proyek->id, collect()),
                (string) $proyek->id,
                $proyek->nama ?: $proyek->kode_proyek,
                $proyek->kode_proyek
            ));

        if ($per->has('tanpa_proyek')) {
            $rows->push($this->groupRow($per->get('tanpa_proyek'), 'tanpa_proyek', 'Tanpa Proyek'));
        }

        return $rows->sortByDesc('total')->values()->all();
    }

    private function rekapPerRole(Collection $presensis): array
    {
        $per = $presensis->groupBy(fn (Presensi $p) => $this->roleKeyFor($p));

        $rows = Role::orderBy('name')->pluck('name')
            ->map(fn (string $role) => $this->groupRow($per->get($role, collect()), $role, $role));

        if ($per->has('tanpa_user')) {
            $rows->push($this->groupRow($per->get('tanpa_user'), 'tanpa_user', 'Tanpa Akun User'));
        }

        return $rows->sortByDesc('total')->values()->all();
    }

    private function roleKeyFor(Presensi $presensi): string
    {
        $role = $presensi->karyawan?->user
            ? $presensi->karyawan->user->roles->first()
            : null;

        return $role ? (string) $role->name : 'tanpa_user';
    }
}
