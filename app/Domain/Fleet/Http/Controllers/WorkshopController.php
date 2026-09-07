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
 * Bagian 21.9 — dashboard Workshop: ajuan sparepart (rutin + insidental),
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
}