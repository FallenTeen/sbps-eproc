<?php

namespace App\Http\Controllers;

use App\Exports\AuditLogExport;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    use FilterableTable;

    /**
     * Whitelist kolom filter/sort yang dipakai index & export.
     */
    private function tableColumns(): array
    {
        return [
            'created_at' => ['type' => 'date'],
            'user' => ['type' => 'like', 'relation' => 'causer', 'column' => 'name'],
            'model_type' => ['type' => 'exact', 'column' => 'subject_type'],
            'event' => ['type' => 'exact'],
            'description' => ['type' => 'like'],
        ];
    }

    /**
     * Display a listing of activity logs.
     */
    public function index(Request $request)
    {
        $query = Activity::with('causer');

        $sort = $this->applyTableQuery($query, $request, $this->tableColumns(), ['created_at' => 'desc']);

        $logs = $query->paginate($this->tablePerPage($request, 20))->withQueryString();

        // Get list of unique model types for filter
        $modelTypes = Activity::select('subject_type')
            ->distinct()
            ->whereNotNull('subject_type')
            ->pluck('subject_type')
            ->toArray();

        return Inertia::render('Shared/AuditLog/Index', [
            'logs' => $logs,
            'modelTypes' => $modelTypes,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
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

        $this->applyTableQuery($logs, $request, $this->tableColumns(), ['created_at' => 'desc']);

        $logs = $logs->get();

        // Return Excel export
        return (new AuditLogExport($logs))->download('audit-log.xlsx');
    }
}
