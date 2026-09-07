<?php

namespace App\Domain\Inventory\Http\Controllers;

use App\Domain\Inventory\Services\InventoryDashboardAggregator;
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

        return Inertia::render('Inventory/Dashboard/Index', [
            'metrics' => $aggregator->getMetrics(),
        ]);
    }
}