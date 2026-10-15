<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\ApprovePengajuanServisAction;
use App\Domain\Fleet\Actions\AssignWorkshopPengerjaanAction;
use App\Domain\Fleet\Actions\CompletePengajuanServisAction;
use App\Domain\Fleet\Actions\RecordPengadaanSparepartAction;
use App\Domain\Fleet\Actions\RejectPengajuanServisAction;
use App\Domain\Fleet\Actions\RequestSparepartAction;
use App\Domain\Fleet\Actions\SubmitPengajuanServisAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Http\Controllers\Controller;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengajuanServisArmadaController extends Controller
{
    use FilterableTable;

    public function index(Request $request)
    {
        $this->authorize('viewAny', PengajuanServisArmada::class);

        $query = PengajuanServisArmada::with(['armada', 'diajukanOleh', 'disetujuiOleh', 'spareparts']);

        $columns = [
            'kode_pengajuan' => ['type' => 'like'],
            'armada' => ['relation' => 'armada', 'column' => 'plat_nomor', 'type' => 'like'],
            'diajukan_oleh' => ['relation' => 'diajukanOleh', 'column' => 'name', 'type' => 'like'],
            'tanggal_ajuan' => ['type' => 'date'],
            'status' => ['type' => 'exact'],
            'total_biaya' => ['searchable' => false],
        ];

        $sort = $this->applyTableQuery($query, $request, $columns, ['tanggal_ajuan' => 'desc', 'created_at' => 'desc']);

        $pengajuans = $query->paginate($this->tablePerPage($request))->withQueryString();

        return Inertia::render('Fleet/ServisArmada/Index', [
            'pengajuans' => $pengajuans,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('submit', PengajuanServisArmada::class);

        return Inertia::render('Fleet/ServisArmada/Create', [
            'armadas' => Armada::aktif()->orderBy('plat_nomor')->get(['id', 'plat_nomor', 'kode_unit', 'jenis']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('submit', PengajuanServisArmada::class);

        $validated = $request->validate([
            'armada_id' => 'required|exists:armadas,id',
            'tanggal_ajuan' => 'nullable|date',
            'catatan_ajuan' => 'nullable|string|max:2000',
            'foto_armada' => 'nullable|string|max:255',
        ]);

        $pengajuan = app(SubmitPengajuanServisAction::class)->execute($request->user(), $validated);

        return redirect()->route('fleet.servis-armada.show', $pengajuan->id)
            ->with('success', 'Ajuan servis armada dibuat.');
    }

    public function show(PengajuanServisArmada $pengajuan)
    {
        $this->authorize('view', $pengajuan);

        $user = request()->user();

        return Inertia::render('Fleet/ServisArmada/Show', [
            'pengajuan' => $pengajuan->load(['armada', 'diajukanOleh', 'disetujuiOleh', 'personels', 'spareparts']),
            'can' => [
                'approve' => $user->can('approve', $pengajuan),
                'assignWorkshop' => $user->can('assignWorkshop', $pengajuan),
                'requestSparepart' => $user->can('requestSparepart', $pengajuan),
                'recordSparepart' => $user->can('recordSparepart', $pengajuan),
                'complete' => $user->can('complete', $pengajuan),
            ],
        ]);
    }

    public function approve(Request $request, PengajuanServisArmada $pengajuan)
    {
        $this->authorize('approve', $pengajuan);

        $validated = $request->validate(['catatan_acc' => 'nullable|string|max:2000']);
        app(ApprovePengajuanServisAction::class)->execute($pengajuan, $request->user(), $validated['catatan_acc'] ?? null);

        return back()->with('success', 'Ajuan servis disetujui.');
    }

    public function reject(Request $request, PengajuanServisArmada $pengajuan)
    {
        $this->authorize('approve', $pengajuan);

        $validated = $request->validate(['catatan_acc' => 'required|string|max:2000']);
        app(RejectPengajuanServisAction::class)->execute($pengajuan, $request->user(), $validated['catatan_acc']);

        return back()->with('success', 'Ajuan servis ditolak.');
    }

    public function assignWorkshop(Request $request, PengajuanServisArmada $pengajuan)
    {
        $this->authorize('assignWorkshop', $pengajuan);

        $validated = $request->validate([
            'tanggal_mulai_kerja' => 'nullable|date',
            'tanggal_selesai_kerja' => 'nullable|date|after_or_equal:tanggal_mulai_kerja',
            'catatan_pengerjaan' => 'nullable|string|max:2000',
            'butuh_sparepart' => 'boolean',
            'personels' => 'array',
            'personels.*.nama_personel' => 'nullable|string|max:255',
            'personels.*.peran' => 'nullable|string|max:255',
        ]);

        app(AssignWorkshopPengerjaanAction::class)->execute($pengajuan, $request->user(), $validated);

        return back()->with('success', 'Pengerjaan workshop dimulai.');
    }

    public function requestSparepart(Request $request, PengajuanServisArmada $pengajuan)
    {
        $this->authorize('requestSparepart', $pengajuan);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.nama_item' => 'required|string|max:255',
            'items.*.jumlah' => 'nullable|numeric|min:0',
            'items.*.satuan' => 'nullable|string|max:50',
            'items.*.nominal' => 'nullable|numeric|min:0',
        ]);

        app(RequestSparepartAction::class)->execute($request->user(), $validated['items'], $pengajuan);

        return back()->with('success', 'Permintaan sparepart diajukan ke Inventory.');
    }

    public function recordSparepart(Request $request, PengajuanServisArmada $pengajuan)
    {
        $this->authorize('recordSparepart', $pengajuan);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:pengajuan_servis_spareparts,id',
            'items.*.nominal' => 'nullable|numeric|min:0',
            'items.*.jumlah' => 'nullable|numeric|min:0',
            'items.*.tanggal' => 'nullable|date',
            'items.*.foto_nota' => 'nullable|string|max:255',
            'items.*.catatan' => 'nullable|string|max:1000',
        ]);

        app(RecordPengadaanSparepartAction::class)->execute($pengajuan, $request->user(), $validated);

        return back()->with('success', 'Pengadaan sparepart dicatat.');
    }

    public function complete(Request $request, PengajuanServisArmada $pengajuan)
    {
        $this->authorize('complete', $pengajuan);

        $validated = $request->validate([
            'tanggal_selesai_kerja' => 'nullable|date',
            'catatan_pengerjaan' => 'nullable|string|max:2000',
            'total_biaya' => 'nullable|numeric|min:0',
        ]);

        app(CompletePengajuanServisAction::class)->execute($pengajuan, $request->user(), $validated);

        return back()->with('success', 'Servis armada selesai.');
    }
}
