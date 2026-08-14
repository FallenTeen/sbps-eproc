<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\RecordChecklistHarianAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\HR\Models\Karyawan;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ChecklistHarianController extends Controller
{
    /**
     * Map tipe checkable dari URL (string pendek) ke Eloquent class.
     * Dipakai supaya URL tidak perlu membawa FQCN penuh.
     */
    protected const CHECKABLE_MAP = [
        'armada' => Armada::class,
        'mesin' => MesinProduksi::class,
        'mesin_produksi' => MesinProduksi::class,
        'mesin-produksi' => MesinProduksi::class,
    ];

    /**
     * Display a listing of checklist dengan filter (tanggal, tipe, status).
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ArmadaChecklistHarian::class);

        $query = ArmadaChecklistHarian::with(['checkable', 'dicatatOleh']);

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->tanggal);
        }

        if ($request->filled('tipe')) {
            $modelClass = self::CHECKABLE_MAP[$request->tipe] ?? null;
            if ($modelClass) {
                $query->where('checkable_type', $modelClass);
            }
        }

        if ($request->filled('status')) {
            $query->where('kondisi_baik', $request->status === 'baik');
        }

        if ($request->user()->unit_bisnis_id) {
            $unitId = $request->user()->unit_bisnis_id;
            $query->whereHasMorph('checkable', [Armada::class, MesinProduksi::class], function ($q) use ($unitId) {
                $q->where('unit_bisnis_id', $unitId);
            });
        }

        $checklists = $query->orderBy('tanggal', 'desc')->paginate(20)->withQueryString();

        return Inertia::render('Fleet/Checklist/Index', [
            'checklists' => $checklists,
            'filters' => $request->only(['tanggal', 'tipe', 'status']),
        ]);
    }

    /**
     * Show form untuk mengisi checklist armada/mesin tertentu.
     */
    public function create(string $checkableType, string $checkableId)
    {
        $checkable = $this->resolveCheckable($checkableType, $checkableId);

        $this->authorize('recordChecklist', $checkable);

        $existingToday = $checkable->checklists()->whereDate('tanggal', now())->first();

        return Inertia::render('Fleet/Checklist/Create', [
            'checkable' => $checkable,
            'checkableType' => $checkableType,
            'existingToday' => $existingToday,
        ]);
    }

    /**
     * Store checklist baru. Jika sudah ada checklist untuk checkable ini
     * hari ini, checklist yang ada akan DI-UPDATE (bukan dobel), supaya
     * pencatatan tetap satu record per checkable per hari.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'checkable_type' => 'required|string|in:' . implode(',', array_keys(self::CHECKABLE_MAP)),
            'checkable_id' => 'required|string',
            'tanggal' => 'nullable|date|before_or_equal:today',
            'kondisi_baik' => 'required|boolean',
            'item_bermasalah' => 'nullable|string',
        ]);

        if (!$validated['kondisi_baik'] && empty($validated['item_bermasalah'])) {
            return back()
                ->withErrors(['item_bermasalah' => 'Item bermasalah wajib diisi jika kondisi tidak baik.'])
                ->withInput();
        }

        $checkable = $this->resolveCheckable($validated['checkable_type'], $validated['checkable_id']);

        $this->authorize('recordChecklist', $checkable);

        $karyawan = $this->resolveKaryawanAktif();
        if (!$karyawan) {
            return back()->with('error', 'Akun Anda tidak terhubung ke data karyawan aktif, tidak bisa mencatat checklist.');
        }

        $tanggal = $validated['tanggal'] ?? now();

        $existing = $checkable->checklists()->whereDate('tanggal', $tanggal)->first();

        $data = [
            'tanggal' => $tanggal,
            'kondisi_baik' => $validated['kondisi_baik'],
            'item_bermasalah' => $validated['item_bermasalah'] ?? null,
            'dicatat_oleh_karyawan_id' => $karyawan->id,
        ];

        if ($existing) {
            $existing->update($data);
            $checklist = $existing;
        } else {
            $checklist = app(RecordChecklistHarianAction::class)->execute($checkable, $data);
        }

        return back()->with('success', $existing
            ? 'Checklist hari ini berhasil diperbarui.'
            : 'Checklist berhasil dicatat.');
    }

    /**
     * Display the specified checklist.
     */
    public function show(ArmadaChecklistHarian $checklistHarian)
    {
        $this->authorize('view', $checklistHarian);

        $checklistHarian->load(['checkable', 'dicatatOleh']);

        return Inertia::render('Fleet/Checklist/Show', [
            'checklist' => $checklistHarian,
        ]);
    }

    /**
     * Update checklist yang sudah ada (mis. koreksi hari yang sama).
     */
    public function update(Request $request, ArmadaChecklistHarian $checklistHarian)
    {
        $checklistHarian->loadMissing('checkable');

        $this->authorize('recordChecklist', $checklistHarian->checkable);

        $validated = $request->validate([
            'kondisi_baik' => 'required|boolean',
            'item_bermasalah' => 'nullable|string',
        ]);

        if (!$validated['kondisi_baik'] && empty($validated['item_bermasalah'])) {
            return back()
                ->withErrors(['item_bermasalah' => 'Item bermasalah wajib diisi jika kondisi tidak baik.'])
                ->withInput();
        }

        $checklistHarian->update($validated);

        return back()->with('success', 'Checklist berhasil diperbarui.');
    }

    /**
     * Tampilkan semua checklist pada tanggal tertentu (untuk laporan harian).
     */
    public function byDate(string $date)
    {
        $this->authorize('byDate', ArmadaChecklistHarian::class);

        $tanggal = Carbon::parse($date);

        $query = ArmadaChecklistHarian::with(['checkable', 'dicatatOleh'])
            ->whereDate('tanggal', $tanggal);

        if (Auth::user()->unit_bisnis_id) {
            $unitId = Auth::user()->unit_bisnis_id;
            $query->whereHasMorph('checkable', [Armada::class, MesinProduksi::class], function ($q) use ($unitId) {
                $q->where('unit_bisnis_id', $unitId);
            });
        }

        $checklists = $query->orderBy('kondisi_baik')->get();

        return Inertia::render('Fleet/Checklist/ByDate', [
            'tanggal' => $tanggal->toDateString(),
            'checklists' => $checklists,
        ]);
    }

    /**
     * Riwayat checklist untuk armada/mesin tertentu.
     */
    public function byCheckable(string $checkableType, string $checkableId)
    {
        $checkable = $this->resolveCheckable($checkableType, $checkableId);

        $this->authorize('view', $checkable);

        $checklists = $checkable->checklists()
            ->with('dicatatOleh')
            ->orderBy('tanggal', 'desc')
            ->paginate(20);

        return Inertia::render('Fleet/Checklist/Index', [
            'checkable' => $checkable,
            'checkableType' => $checkableType,
            'checklists' => $checklists,
        ]);
    }

    /**
     * Simpan beberapa checklist sekaligus (mis. dari halaman rekap harian
     * yang menampilkan semua armada/mesin dalam satu form).
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'nullable|date|before_or_equal:today',
            'items' => 'required|array|min:1',
            'items.*.checkable_type' => 'required|string|in:' . implode(',', array_keys(self::CHECKABLE_MAP)),
            'items.*.checkable_id' => 'required|string',
            'items.*.kondisi_baik' => 'required|boolean',
            'items.*.item_bermasalah' => 'nullable|string',
        ]);

        $karyawan = $this->resolveKaryawanAktif();
        if (!$karyawan) {
            return back()->with('error', 'Akun Anda tidak terhubung ke data karyawan aktif, tidak bisa mencatat checklist.');
        }

        $tanggal = $validated['tanggal'] ?? now();
        $saved = 0;
        $skipped = [];

        foreach ($validated['items'] as $item) {
            if (!$item['kondisi_baik'] && empty($item['item_bermasalah'])) {
                $skipped[] = $item['checkable_id'];
                continue;
            }

            $checkable = $this->resolveCheckable($item['checkable_type'], $item['checkable_id']);

            if (!Auth::user()->can('recordChecklist', $checkable)) {
                $skipped[] = $item['checkable_id'];
                continue;
            }

            $data = [
                'tanggal' => $tanggal,
                'kondisi_baik' => $item['kondisi_baik'],
                'item_bermasalah' => $item['item_bermasalah'] ?? null,
                'dicatat_oleh_karyawan_id' => $karyawan->id,
            ];

            $existing = $checkable->checklists()->whereDate('tanggal', $tanggal)->first();
            if ($existing) {
                $existing->update($data);
            } else {
                app(RecordChecklistHarianAction::class)->execute($checkable, $data);
            }
            $saved++;
        }

        $message = "{$saved} checklist berhasil disimpan.";
        if (!empty($skipped)) {
            $message .= ' ' . count($skipped) . ' item dilewati (tidak lengkap/tidak diizinkan).';
        }

        return back()->with('success', $message);
    }

    /**
     * Resolve model checkable (Armada|MesinProduksi) dari tipe singkat di URL.
     */
    protected function resolveCheckable(string $type, string $id)
    {
        $modelClass = self::CHECKABLE_MAP[$type] ?? null;

        if (!$modelClass) {
            abort(404, "Tipe checkable '{$type}' tidak dikenal.");
        }

        return $modelClass::findOrFail($id);
    }

    /**
     * Resolve karyawan aktif milik user yang sedang login,
     * lewat relasi User::karyawan().
     */
    protected function resolveKaryawanAktif(): ?Karyawan
    {
        $karyawan = Auth::user()->karyawan;

        if (!$karyawan || $karyawan->status !== 'aktif') {
            return null;
        }

        return $karyawan;
    }
}
