<?php

namespace App\Domain\Production\Http\Controllers;

use App\Domain\Production\Services\ProductionDashboardAggregator;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

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
