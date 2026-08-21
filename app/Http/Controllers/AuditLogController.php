<?php

namespace App\Http\Controllers;

use App\Exports\AuditLogExport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    /**
     * Display a listing of activity logs.
     */
    public function index(Request $request)
    {
        $query = Activity::with('causer');

        // Filter by model type
        if ($request->filled('model_type')) {
            $query->where('subject_type', $request->model_type);
        }

        // Filter by causer (user)
        if ($request->filled('user_id')) {
            $query->where('causer_id', $request->user_id);
        }

        // Filter by event (created/updated/deleted)
        if ($request->filled('event')) {
            $query->where('event', $request->event);
        }

        // Filter by date range
        if ($request->filled('tanggal_from')) {
            $query->whereDate('created_at', '>=', $request->tanggal_from);
        }
        if ($request->filled('tanggal_to')) {
            $query->whereDate('created_at', '<=', $request->tanggal_to);
        }

        // Search in properties (JSON)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('subject_type', 'like', "%{$search}%")
                    ->orWhere('log_name', 'like', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get list of unique model types for filter
        $modelTypes = Activity::select('subject_type')
            ->distinct()
            ->whereNotNull('subject_type')
            ->pluck('subject_type')
            ->toArray();

        return Inertia::render('Shared/AuditLog/Index', [
            'logs' => $logs,
            'modelTypes' => $modelTypes,
            'filters' => $request->only(['model_type', 'user_id', 'event', 'tanggal_from', 'tanggal_to', 'search']),
        ]);
    }

    /**
     * Display the specified activity log detail.
     */
    public function show(Activity $log)
    {
        $log->load('causer');

        return Inertia::render('Shared/AuditLog/Show', [
            'log' => $log,
        ]);
    }

    /**
     * Export logs to Excel.
     */
    public function export(Request $request)
    {
        // Gunakan Maatwebsite Excel
        $logs = Activity::with('causer');

        // Apply same filters as index
        if ($request->filled('model_type')) {
            $logs->where('subject_type', $request->model_type);
        }

        if ($request->filled('user_id')) {
            $logs->where('causer_id', $request->user_id);
        }

        if ($request->filled('event')) {
            $logs->where('event', $request->event);
        }

        if ($request->filled('tanggal_from')) {
            $logs->whereDate('created_at', '>=', $request->tanggal_from);
        }

        if ($request->filled('tanggal_to')) {
            $logs->whereDate('created_at', '<=', $request->tanggal_to);
        }

        $logs = $logs->orderBy('created_at', 'desc')->get();

        // Return Excel export
        return (new AuditLogExport($logs))->download('audit-log.xlsx');
    }
}
