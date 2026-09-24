<?php

namespace App\Http\Controllers;

use App\Domain\Core\Services\OwnerDashboardAggregatorService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request, OwnerDashboardAggregatorService $aggregatorService)
    {
        $ownerData = $aggregatorService->aggregate($request->user());

        return Inertia::render('Dashboard', [
            'ownerData' => $ownerData,
        ]);
    }
}
