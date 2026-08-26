<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\EndDowntimeAction;
use App\Domain\Fleet\Actions\StartDowntimeAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Production\Models\MesinProduksi;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DowntimeLogController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(DowntimeLog::class, 'downtime');
    }

    /**
     * Display a listing of downtime for a specific serviceable.
     */
    public function index(Request $request, $type, $id)
    {
        $model = $this->resolveServiceable($type, $id);
        if (! $model) {
            abort(404, 'Serviceable not found');
        }

        $downtimes = $model->downtimes()
            ->orderBy('mulai', 'desc')
            ->paginate(15);

        return Inertia::render('Fleet/Downtime/Index', [
            'downtimes' => $downtimes,
            'serviceable' => $model,
            'serviceableType' => $type,
        ]);
    }

    /**
     * Show form untuk memulai downtime. Tipe & unit opsional
     * (dipilih via dropdown), dipakai untuk preselect saat diakses
     * dari halaman armada/mesin tertentu.
     */
    public function create(Request $request)
    {
        $serviceableType = $request->query('type');
        $serviceableId = $request->query('id');

        return Inertia::render('Fleet/Downtime/Create', [
            'serviceableTypes' => [
                ['value' => 'armada', 'label' => 'Armada'],
                ['value' => 'mesin_produksi', 'label' => 'Mesin Produksi'],
            ],
            'serviceables' => [
                'armada' => Armada::query()->orderBy('kode_unit')->get(['id', 'kode_unit', 'plat_nomor']),
                'mesin_produksi' => MesinProduksi::query()->orderBy('nama')->get(['id', 'nama']),
            ],
            'serviceableType' => $serviceableType,
            'serviceableId' => $serviceableId,
        ]);
    }

    /**
     * Store a newly created downtime.
     */
    public function store(Request $request)
    {
        $request->validate([
            'serviceable_type' => 'required|in:armada,mesin,mesin_produksi,mesin-produksi',
            'serviceable_id' => 'required|string',
            'penyebab' => 'nullable|string|max:255',
            'kategori' => 'required|in:kerusakan,menunggu_sparepart,lainnya',
            'catatan' => 'nullable|string',
        ]);

        $model = $this->resolveServiceable($request->serviceable_type, $request->serviceable_id);
        if (! $model) {
            abort(404, 'Serviceable not found');
        }

        $this->authorize('create', [DowntimeLog::class, $model]);

        if ($model->downtimes()->whereNull('selesai')->exists()) {
            return back()->withErrors([
                'downtime' => 'Masih ada downtime aktif untuk unit ini.',
            ]);
        }

        $downtime = (new StartDowntimeAction)->execute($model, $request->all());

        return back()->with('success', 'Downtime dimulai.');
    }

    /**
     * Update the specified downtime.
     */
    public function update(Request $request, DowntimeLog $downtime)
    {
        $request->validate([
            'penyebab' => 'nullable|string|max:255',
            'kategori' => 'in:kerusakan,menunggu_sparepart,lainnya',
            'catatan' => 'nullable|string',
        ]);

        $this->authorize('update', $downtime);

        $downtime->update($request->only(['penyebab', 'kategori', 'catatan']));

        return back()->with('success', 'Downtime diperbarui.');
    }

    /**
     * End an active downtime.
     */
    public function end(Request $request, DowntimeLog $downtime)
    {
        $this->authorize('update', $downtime);

        (new EndDowntimeAction)->execute($downtime);

        return back()->with('success', 'Downtime selesai.');
    }

    /**
     * Remove the specified downtime.
     */
    public function destroy(DowntimeLog $downtime)
    {
        $this->authorize('delete', $downtime);

        $downtime->delete();

        return back()->with('success', 'Downtime dihapus.');
    }

    /**
     * Display active downtimes (global).
     */
    public function active(Request $request)
    {
        $this->authorize('viewAny', DowntimeLog::class);

        $downtimes = DowntimeLog::whereNull('selesai')
            ->with('serviceable')
            ->orderBy('mulai', 'desc')
            ->paginate(15);

        return Inertia::render('Fleet/Downtime/Active', [
            'downtimes' => $downtimes,
        ]);
    }

    /**
     * Resolve serviceable model from type and id.
     */
    private function resolveServiceable($type, $id)
    {
        $map = [
            'armada' => Armada::class,
            'mesin' => MesinProduksi::class,
            'mesin_produksi' => MesinProduksi::class,
            'mesin-produksi' => MesinProduksi::class,
        ];

        if (! isset($map[$type])) {
            return null;
        }

        return $map[$type]::find($id);
    }
}
