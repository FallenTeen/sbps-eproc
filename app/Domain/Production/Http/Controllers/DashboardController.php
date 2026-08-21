<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Production\Services\ProductionDashboardAggregator;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(ProductionDashboardAggregator $aggregator, Request $request)
    {
        $metrics = $aggregator->getMetrics();

        return Inertia::render('Production/Dashboard/Index', [
            'metrics' => $metrics,
        ]);
    }
}
