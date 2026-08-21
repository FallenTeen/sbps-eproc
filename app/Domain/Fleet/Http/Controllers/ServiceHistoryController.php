<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\RecordServiceHistoryAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Production\Models\MesinProduksi;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceHistoryController extends Controller
{
    /**
     * Map tipe serviceable dari URL (string pendek) ke Eloquent class.
     */
    protected const SERVICEABLE_MAP = [
        'armada' => Armada::class,
        'mesin' => MesinProduksi::class,
        'mesin_produksi' => MesinProduksi::class,
        'mesin-produksi' => MesinProduksi::class,
    ];

    /**
     * Resolve model serviceable (Armada|MesinProduksi) dari tipe singkat di URL.
     */
    protected function resolveServiceable(string $type, string $id)
    {
        $modelClass = self::SERVICEABLE_MAP[$type] ?? null;

        if (! $modelClass) {
            abort(404, "Tipe serviceable '{$type}' tidak dikenal.");
        }

        return $modelClass::findOrFail($id);
    }

    /**
     * Riwayat servis untuk armada/mesin tertentu (polymorphic).
     */
    public function index(Request $request, string $type, string $id)
    {
        $serviceable = $this->resolveServiceable($type, $id);

        $this->authorize('view', $serviceable);

        $histories = $serviceable->serviceHistories()
            ->with('purchaseOrder')
            ->orderBy('tanggal', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Fleet/ServiceHistory/Index', [
            'serviceable' => $serviceable,
            'serviceableType' => $type,
            'histories' => $histories,
            'can' => [
                'create' => $request->user()->can('create', ServiceHistory::class),
            ],
        ]);
    }

    /**
     * Show the form for creating a new service history.
     */
    public function create(Request $request)
    {
        $this->authorize('create', ServiceHistory::class);

        $type = $request->query('type');
        $id = $request->query('id');
        $serviceable = $type && $id ? $this->resolveServiceable($type, $id) : null;

        $purchaseOrders = PurchaseOrder::query()
            ->where('status', 'disetujui')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id', 'kode_po', 'supplier_id']);

        return Inertia::render('Fleet/ServiceHistory/Create', [
            'serviceable' => $serviceable,
            'serviceableType' => $type,
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    /**
     * Store a newly created service history.
     */
    public function store(Request $request)
    {
        $this->authorize('create', ServiceHistory::class);

        $validated = $request->validate([
            'serviceable_type' => 'required|string|in:'.implode(',', array_keys(self::SERVICEABLE_MAP)),
            'serviceable_id' => 'required|string',
            'tanggal' => 'required|date',
            'jenis_servis' => 'nullable|string|max:255',
            'biaya' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);

        $serviceable = $this->resolveServiceable($validated['serviceable_type'], $validated['serviceable_id']);

        (new RecordServiceHistoryAction)->execute($serviceable, $validated);

        return redirect()->route('fleet.service-history.index', [
            'type' => $validated['serviceable_type'],
            'id' => $validated['serviceable_id'],
        ])->with('success', 'Riwayat servis berhasil dicatat.');
    }

    /**
     * Display the specified service history.
     */
    public function show(ServiceHistory $serviceHistory)
    {
        $this->authorize('view', $serviceHistory);

        $serviceHistory->load(['serviceable', 'purchaseOrder']);

        return Inertia::render('Fleet/ServiceHistory/Show', ['history' => $serviceHistory]);
    }

    /**
     * Show the form for editing the specified service history.
     */
    public function edit(ServiceHistory $serviceHistory)
    {
        $this->authorize('update', $serviceHistory);

        $purchaseOrders = PurchaseOrder::query()
            ->where('status', 'disetujui')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id', 'kode_po', 'supplier_id']);

        return Inertia::render('Fleet/ServiceHistory/Edit', [
            'history' => $serviceHistory->load('serviceable'),
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    /**
     * Update the specified service history.
     */
    public function update(Request $request, ServiceHistory $serviceHistory)
    {
        $this->authorize('update', $serviceHistory);

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'jenis_servis' => 'nullable|string|max:255',
            'biaya' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
        ]);

        $serviceHistory->update($validated);

        return redirect()->route('fleet.service-history.show', $serviceHistory)
            ->with('success', 'Riwayat servis diperbarui.');
    }

    /**
     * Remove the specified service history.
     */
    public function destroy(ServiceHistory $serviceHistory)
    {
        $this->authorize('delete', $serviceHistory);

        $serviceHistory->delete();

        return back()->with('success', 'Riwayat servis dihapus.');
    }
}
