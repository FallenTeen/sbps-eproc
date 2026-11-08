<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\RecordTodoSparepartAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Fleet\Models\WorkshopTodo;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Bagian 21.9 - dashboard Workshop: ajuan sparepart (rutin + insidental),
 * riwayat servis gabungan, monitoring kondisi alat produksi.
 */
class WorkshopController extends Controller
{
    public function sparepartIndex(Request $request)
    {
        $this->authorize('viewAny', WorkshopTodo::class);

        $query = PengajuanServisSparepart::with(['pengajuan.armada', 'workshopTodo.armada', 'workshopTodo.mesin'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('q'), function ($q) use ($request) {
                $q->where('nama_item', 'like', '%'.$request->input('q').'%');
            });

        $items = $query->latest('created_at')->paginate(20)->withQueryString();

        $user = $request->user();

        return Inertia::render('Fleet/Workshop/Sparepart', [
            'items' => $items,
            'filters' => $request->only(['status', 'q']),
            'canRecord' => $user->can('recordSparepart', WorkshopTodo::class),
        ]);
    }

    public function sparepartRecord(Request $request)
    {
        $this->authorize('recordSparepart', WorkshopTodo::class);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:pengajuan_servis_spareparts,id',
            'items.*.nominal' => 'nullable|numeric|min:0',
            'items.*.jumlah' => 'nullable|numeric|min:0',
            'items.*.tanggal' => 'nullable|date',
            'items.*.foto_nota' => 'nullable|string|max:255',
            'items.*.catatan' => 'nullable|string|max:1000',
        ]);

        app(RecordTodoSparepartAction::class)->execute($request->user(), $validated);

        return back()->with('success', 'Pengadaan sparepart rutin dicatat.');
    }

    public function riwayat(Request $request)
    {
        $this->authorize('viewAny', WorkshopTodo::class);

        $pengajuans = PengajuanServisArmada::with(['armada', 'diajukanOleh', 'disetujuiOleh', 'personels', 'spareparts'])
            ->byStatus('selesai')
            ->latest('tanggal_selesai')
            ->take(100)
            ->get();

        $histories = ServiceHistory::with('serviceable')
            ->latest('tanggal')
            ->take(100)
            ->get();

        return Inertia::render('Fleet/Workshop/Riwayat', [
            'pengajuans' => $pengajuans,
            'histories' => $histories,
        ]);
    }

    public function monitoring()
    {
        $this->authorize('viewAny', WorkshopTodo::class);

        $kondisiBuruk = ArmadaChecklistHarian::with('checkable')
            ->where('kondisi_baik', false)
            ->whereDate('tanggal', '>=', now()->subDay())
            ->orderByDesc('tanggal')
            ->take(50)
            ->get();

        $armadas = Armada::aktif()->orderBy('plat_nomor')->get();
        $today = now()->toDateString();
        $checklistTodayIds = ArmadaChecklistHarian::where('checkable_type', Armada::class)
            ->whereDate('tanggal', $today)
            ->pluck('checkable_id');
        $belumChecklist = $armadas->whereNotIn('id', $checklistTodayIds)->values();

        return Inertia::render('Fleet/Workshop/Monitoring', [
            'kondisi_buruk' => $kondisiBuruk,
            'belum_checklist' => $belumChecklist,
            'stats' => [
                'unit_bermasalah' => $kondisiBuruk->pluck('checkable_id')->unique()->count(),
                'belum_checklist_hari_ini' => $belumChecklist->count(),
                'total_armada' => $armadas->count(),
            ],
        ]);
    }

    /**
     * TD-B6 - Web verifikasi servis eksternal: daftar servis yang dikerjakan
     * bengkel luar beserta status verifikasi Workshop.
     */
    public function servisEksternal(Request $request)
    {
        $this->authorize('viewAny', PengajuanServisArmada::class);

        $verifikasi = $request->query('verifikasi');

        $query = PengajuanServisArmada::with([
            'armada',
            'diajukanOleh',
            'eksternalDetail.verifikasiWorkshopOleh',
            'eksternalNotas',
        ])->where('tipe_servis', 'eksternal')->latest('created_at');

        if (in_array($verifikasi, ['belum', 'terverifikasi', 'bermasalah'], true)) {
            $query->whereHas('eksternalDetail', function ($q) use ($verifikasi) {
                $verifikasi === 'belum'
                    ? $q->whereNull('verifikasi_workshop')
                    : $q->where('verifikasi_workshop', $verifikasi);
            });
        }

        $items = $query->paginate(20)->withQueryString();

        $base = PengajuanServisArmada::where('tipe_servis', 'eksternal');
        $counts = [
            'belum' => (clone $base)->whereHas('eksternalDetail', fn ($q) => $q->whereNull('verifikasi_workshop'))->count(),
            'terverifikasi' => (clone $base)->whereHas('eksternalDetail', fn ($q) => $q->where('verifikasi_workshop', 'terverifikasi'))->count(),
            'bermasalah' => (clone $base)->whereHas('eksternalDetail', fn ($q) => $q->where('verifikasi_workshop', 'bermasalah'))->count(),
        ];

        $user = $request->user();

        return Inertia::render('Fleet/Workshop/ServisEksternal', [
            'items' => $items,
            'filters' => ['verifikasi' => $verifikasi],
            'counts' => $counts,
            'canVerify' => $user->hasRole('Owner') || $user->hasPermissionTo('manage fleet service'),
        ]);
    }

    /**
     * TD-B6/B7 - Workshop menandai servis eksternal terverifikasi / bermasalah.
     */
    public function verifikasiServisEksternal(Request $request, PengajuanServisArmada $pengajuan)
    {
        $this->authorize('verifikasiEksternal', $pengajuan);

        $validated = $request->validate([
            'status' => 'required|in:terverifikasi,bermasalah',
            'catatan' => 'nullable|string|max:2000',
        ]);

        $detail = $pengajuan->eksternalDetail;

        if (! $detail) {
            return back()->with('error', 'Detail servis eksternal tidak ditemukan.');
        }

        $detail->update([
            'verifikasi_workshop' => $validated['status'],
            'verifikasi_workshop_oleh' => $request->user()->id,
            'verifikasi_workshop_pada' => now(),
            'verifikasi_workshop_catatan' => $validated['catatan'] ?? null,
        ]);

        return back()->with('success', $validated['status'] === 'terverifikasi'
            ? 'Servis eksternal terverifikasi.'
            : 'Servis eksternal ditandai bermasalah.');
    }
}