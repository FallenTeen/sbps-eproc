<?php

namespace App\Domain\Inventory\Http\Controllers;

use App\Domain\Core\Models\Titik;
use App\Domain\Inventory\Services\InventoryDashboardAggregator;
use App\Domain\Procurement\Models\BahanBaku;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(InventoryDashboardAggregator $aggregator, Request $request)
    {
        if (! $request->user()->hasAnyPermission(['manage inventory', 'view inventory', 'manage procurement', 'view procurement'])) {
            abort(403);
        }

        $filter = [
            'rentang' => (int) $request->input('rentang', 30) === 7 ? 7 : 30,
            'sumber' => $this->normalisasi($request->input('sumber'), 'semua'),
            'titik' => $this->normalisasi($request->input('titik'), 'semua'),
            'kategori' => $this->normalisasi($request->input('kategori'), 'semua'),
        ];

        $filter['sumber_options'] = collect([
            'semua' => 'Semua sumber',
            'pembelian' => 'Pembelian',
            'produksi' => 'Produksi',
            'request_sparepart' => 'Request sparepart',
            'opname' => 'Opname',
            'manual' => 'Manual',
        ])->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values()->all();

        $filter['titik_options'] = Titik::query()
            ->orderBy('nama')
            ->get(['id', 'nama'])
            ->map(fn (Titik $titik) => ['value' => $titik->id, 'label' => $titik->nama])
            ->prepend(['value' => 'semua', 'label' => 'Semua titik'])
            ->values()
            ->all();

        $filter['kategori_options'] = BahanBaku::query()
            ->where('aktif', true)
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori')
            ->map(fn (string $kategori) => [
                'value' => $kategori,
                'label' => $kategori === 'sparepart' ? 'Suku cadang' : 'Bahan baku',
            ])
            ->prepend(['value' => 'semua', 'label' => 'Semua kategori'])
            ->values()
            ->all();

        return Inertia::render('Inventory/Dashboard/Index', [
            'metrics' => $aggregator->getMetrics(),
            'dashboard' => [
                'trend' => $aggregator->getTrend($filter['rentang']),
                'kanban' => $aggregator->getKanban($filter),
                'mutasi' => $aggregator->getMutasi($filter),
                'saldo' => $aggregator->getSaldo(),
                'opname' => $aggregator->getOpname(),
                'actions' => $aggregator->getActions($filter),
                'filter' => $filter,
            ],
        ]);
    }

    private function normalisasi(mixed $nilai, string $default): string
    {
        $nilai = is_scalar($nilai) ? trim((string) $nilai) : '';

        return $nilai === '' ? $default : $nilai;
    }
}
