<?php

namespace App\Http\Controllers;

use App\Domain\Core\Services\OwnerDashboardAggregatorService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(OwnerDashboardAggregatorService $aggregatorService)
    {
        $ownerData = $aggregatorService->aggregate();

        return Inertia::render('Dashboard', [
            'ownerData' => $ownerData,
        ]);
    }
}
