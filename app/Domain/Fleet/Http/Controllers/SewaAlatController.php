<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Core\Models\Proyek;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SewaAlatController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', SewaAlatJam::class);

        $query = SewaAlatJam::with(['armada', 'proyek']);

        if ($request->user()->unit_bisnis_id) {
            $query->whereHas('armada', function ($q) use ($request) {
                $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('penyewa_eksternal', 'like', "%{$search}%")
                    ->orWhereHas('armada', fn ($a) => $a->where('kode_unit', 'like', "%{$search}%")->orWhere('plat_nomor', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('armada_id')) {
            $query->where('armada_id', $request->armada_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sewaList = $query->orderByDesc('tanggal')->orderByDesc('created_at')->paginate(15)->withQueryString();

        $baseStatsQuery = SewaAlatJam::query();
        if ($request->user()->unit_bisnis_id) {
            $baseStatsQuery->whereHas('armada', function ($q) use ($request) {
                $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
            });
        }
        $statsMonthQuery = (clone $baseStatsQuery)
            ->whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year);

        $totalAktif = (clone $baseStatsQuery)->where('status', 'disetujui')->count();
        $hmBulan = (clone $statsMonthQuery)->sum('jumlah_jam');
        $pendapatanBulan = (clone $statsMonthQuery)->get()->sum(fn ($s) => $s->jumlah_jam * $s->harga_per_jam_snapshot);
        $alatTersewa = (clone $baseStatsQuery)->whereNull('hm_akhir')->distinct('armada_id')->count('armada_id');

        $armadaListQuery = Armada::query();
        if ($request->user()->unit_bisnis_id) {
            $armadaListQuery->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
        }
        $armadaList = $armadaListQuery->select('id', 'kode_unit', 'plat_nomor')->orderBy('kode_unit')->get();

        return Inertia::render('Fleet/SewaAlat/Index', [
            'sewaList' => $sewaList,
            'filters' => $request->only(['search', 'armada_id', 'status']),
            'armadaList' => $armadaList,
            'stats' => [
                'total_aktif' => $totalAktif,
                'hm_bulan' => $hmBulan,
                'pendapatan_bulan' => $pendapatanBulan,
                'alat_tersewa' => $alatTersewa,
            ],
            'can' => [
                'create' => $request->user()->can('create', SewaAlatJam::class),
            ],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', SewaAlatJam::class);

        $user = $request->user();
        $armadaQuery = Armada::query();
        if ($user->unit_bisnis_id) {
            $armadaQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }
        $armadaList = $armadaQuery->select('id', 'kode_unit', 'plat_nomor', 'jenis')->orderBy('kode_unit')->get();
        $proyekQuery = Proyek::query();
        if ($user->unit_bisnis_id) {
            $proyekQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }
        $proyekList = $proyekQuery->select('id', 'nama')->get();

        return Inertia::render('Fleet/SewaAlat/Create', [
            'armadaList' => $armadaList,
            'proyekList' => $proyekList,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', SewaAlatJam::class);

        $validated = $request->validate([
            'armada_id' => 'required|exists:armadas,id',
            'tipe_sewa' => 'required|in:internal,eksternal',
            'proyek_id' => 'nullable|required_if:tipe_sewa,internal|exists:proyeks,id',
            'nama_pelanggan' => 'required|string|max:255',
            'penyewa_pt' => 'nullable|string|max:255',
            'penyewa_alamat' => 'nullable|string|max:255',
            'penyewa_penanggung_jawab' => 'nullable|string|max:255',
            'penyewa_no_hp' => 'nullable|string|max:50',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'hm_awal' => 'required|numeric|min:0',
            'hm_akhir' => 'nullable|numeric|gte:hm_awal',
            'tarif_per_jam' => 'required|numeric|min:0',
            'catatan' => 'nullable|string',
        ]);

        $jumlahJam = 0;
        if (! empty($validated['hm_akhir']) && ! empty($validated['hm_awal'])) {
            $jumlahJam = max(0, floatval($validated['hm_akhir']) - floatval($validated['hm_awal']));
        }

        SewaAlatJam::create([
            'armada_id' => $validated['armada_id'],
            'tipe_sewa' => $validated['tipe_sewa'],
            'proyek_id' => $validated['tipe_sewa'] === 'internal' ? ($validated['proyek_id'] ?? null) : null,
            'penyewa_eksternal' => $validated['nama_pelanggan'],
            'penyewa_nama' => $validated['nama_pelanggan'],
            'penyewa_pt' => $validated['penyewa_pt'] ?? null,
            'penyewa_alamat' => $validated['penyewa_alamat'] ?? null,
            'penyewa_penanggung_jawab' => $validated['penyewa_penanggung_jawab'] ?? null,
            'penyewa_no_hp' => $validated['penyewa_no_hp'] ?? null,
            'tanggal' => $validated['tanggal_mulai'],
            'hm_awal' => $validated['hm_awal'],
            'hm_akhir' => $validated['hm_akhir'] ?? null,
            'jumlah_jam' => $jumlahJam,
            'harga_per_jam_snapshot' => $validated['tarif_per_jam'],
            'status' => 'disetujui',
            'catatan' => $validated['catatan'] ?? null,
        ]);

        return redirect()->route('fleet.sewa-alat.index')->with('success', 'Pencatatan sewa alat berat berhasil disimpan.');
    }

    public function show(Request $request, string $id)
    {
        $sewa = SewaAlatJam::with(['armada', 'proyek'])->findOrFail($id);
        $this->authorize('view', $sewa);

        return response()->json($sewa);
    }

    /**
     * Setujui pencatatan sewa alat.
     */
    public function approve(Request $request, SewaAlatJam $sewaAlat)
    {
        $this->authorize('update', $sewaAlat);

        $sewaAlat->update(['status' => 'disetujui']);

        return back()->with('success', 'Sewa alat disetujui.');
    }

    /**
     * Simpan beberapa pencatatan sewa alat sekaligus (bulk).
     */
    public function bulkStore(Request $request)
    {
        $this->authorize('create', SewaAlatJam::class);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.armada_id' => 'required|exists:armadas,id',
            'items.*.tipe_sewa' => 'required|in:internal,eksternal',
            'items.*.proyek_id' => 'nullable|exists:proyeks,id',
            'items.*.nama_pelanggan' => 'required|string|max:255',
            'items.*.penyewa_pt' => 'nullable|string|max:255',
            'items.*.penyewa_alamat' => 'nullable|string|max:255',
            'items.*.penyewa_penanggung_jawab' => 'nullable|string|max:255',
            'items.*.penyewa_no_hp' => 'nullable|string|max:50',
            'items.*.tanggal_mulai' => 'required|date',
            'items.*.hm_awal' => 'required|numeric|min:0',
            'items.*.hm_akhir' => 'nullable|numeric|gte:hm_awal',
            'items.*.tarif_per_jam' => 'required|numeric|min:0',
            'items.*.catatan' => 'nullable|string',
        ]);

        $saved = 0;
        foreach ($validated['items'] as $item) {
            if ($item['tipe_sewa'] === 'internal' && empty($item['proyek_id'])) {
                return back()->withErrors(['items' => 'Sewa internal wajib memilih proyek.']);
            }

            $jumlahJam = 0;
            if (! empty($item['hm_akhir']) && ! empty($item['hm_awal'])) {
                $jumlahJam = max(0, floatval($item['hm_akhir']) - floatval($item['hm_awal']));
            }

            SewaAlatJam::create([
                'armada_id' => $item['armada_id'],
                'tipe_sewa' => $item['tipe_sewa'],
                'proyek_id' => $item['tipe_sewa'] === 'internal' ? ($item['proyek_id'] ?? null) : null,
                'penyewa_eksternal' => $item['nama_pelanggan'],
                'penyewa_nama' => $item['nama_pelanggan'],
                'penyewa_pt' => $item['penyewa_pt'] ?? null,
                'penyewa_alamat' => $item['penyewa_alamat'] ?? null,
                'penyewa_penanggung_jawab' => $item['penyewa_penanggung_jawab'] ?? null,
                'penyewa_no_hp' => $item['penyewa_no_hp'] ?? null,
                'tanggal' => $item['tanggal_mulai'],
                'hm_awal' => $item['hm_awal'],
                'hm_akhir' => $item['hm_akhir'] ?? null,
                'jumlah_jam' => $jumlahJam,
                'harga_per_jam_snapshot' => $item['tarif_per_jam'],
                'status' => 'disetujui',
                'catatan' => $item['catatan'] ?? null,
            ]);
            $saved++;
        }

        return back()->with('success', "{$saved} pencatatan sewa alat berhasil disimpan.");
    }

    /**
     * Laporan sewa alat mingguan.
     */
    public function reportMingguan(Request $request)
    {
        $this->authorize('viewAny', SewaAlatJam::class);

        $start = Carbon::parse($request->input('mulai', Carbon::now()->startOfWeek()->toDateString()));
        $end = Carbon::parse($request->input('selesai', Carbon::now()->endOfWeek()->toDateString()));

        $query = SewaAlatJam::with(['armada', 'proyek'])
            ->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()]);

        if ($request->user()->unit_bisnis_id) {
            $query->whereHas('armada', fn ($q) => $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id));
        }

        $rows = $query->get();

        $perHari = $rows->groupBy(fn ($s) => Carbon::parse($s->tanggal)->toDateString())
            ->map(function ($group, $day) {
                return [
                    'tanggal' => $day,
                    'total_jam' => $group->sum('jumlah_jam'),
                    'pendapatan' => $group->sum(fn ($s) => $s->jumlah_jam * $s->harga_per_jam_snapshot),
                ];
            })->values();

        return Inertia::render('Fleet/SewaAlat/ReportMingguan', [
            'mulai' => $start->toDateString(),
            'selesai' => $end->toDateString(),
            'perHari' => $perHari,
            'total_jam' => $rows->sum('jumlah_jam'),
            'pendapatan' => $rows->sum(fn ($s) => $s->jumlah_jam * $s->harga_per_jam_snapshot),
        ]);
    }
}
