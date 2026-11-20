<?php

namespace App\Domain\Core\Http\Controllers;

use App\Domain\Shared\Actions\RecordAuditLogAction;
use App\Http\Controllers\Controller;
use App\Models\AppVersion;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppVersionController extends Controller
{
    use FilterableTable;

    public function __construct(private RecordAuditLogAction $recordAuditLog)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', AppVersion::class);

        $columns = [
            'app' => ['type' => 'like'],
            'platform' => ['type' => 'exact'],
            'latest_version' => ['type' => 'like'],
            'min_version' => ['type' => 'like'],
            'force_update' => ['type' => 'boolean'],
        ];

        $query = AppVersion::query()
            ->orderByRaw("FIELD(app, 'mobile', 'presensi', 'proyek')")
            ->orderBy('platform');
        $sort = $this->applyTableQuery($query, $request, $columns);

        $appVersions = $query->paginate($this->tablePerPage($request))->withQueryString();

        return Inertia::render('Core/AppVersion/Index', [
            'appVersions' => $appVersions,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    public function update(Request $request, AppVersion $appVersion)
    {
        $this->authorize('update', $appVersion);

        $validated = $this->validatedData($request);

        $original = $appVersion->getOriginal();

        $appVersion->update($validated);

        $diff = $this->auditDiff($appVersion, $original);

        if (! empty($diff)) {
            $this->recordAuditLog->execute(
                "Memperbarui konfigurasi versi {$appVersion->app} ({$appVersion->platform}): {$this->auditDescription($diff)}",
                $appVersion,
                'updated',
                ['app' => $appVersion->app, 'platform' => $appVersion->platform, 'diff' => $diff],
                'app-version'
            );
        }

        return redirect()->route('core.app-version.index')
            ->with('success', "Konfigurasi versi {$appVersion->app} ({$appVersion->platform}) berhasil diperbarui.");
    }

    protected function validatedData(Request $request): array
    {
        $semver = '/^\d+(\.\d+){2,3}(\+[0-9A-Za-z\-\.]+)?$/';

        return $request->validate([
            'latest_version' => ['required', 'string', 'max:20', "regex:{$semver}"],
            'min_version' => ['required', 'string', 'max:20', "regex:{$semver}"],
            'force_update' => 'sometimes|boolean',
            'update_url' => ['required', 'string', 'max:255', 'url'],
            'changelog' => 'nullable|string|max:5000',
        ]);
    }

    protected function auditDiff(AppVersion $afterUpdate, array $original): array
    {
        $diff = [];

        foreach (['latest_version', 'min_version', 'update_url', 'changelog'] as $field) {
            $old = (string) ($original[$field] ?? '');
            $new = (string) $afterUpdate->getAttribute($field);

            if ($old !== $new) {
                $diff[$field] = ['old' => $old, 'new' => $new];
            }
        }

        $oldForce = boolval($original['force_update'] ?? false);
        $newForce = boolval($afterUpdate->force_update);

        if ($oldForce !== $newForce) {
            $diff['force_update'] = ['old' => $oldForce, 'new' => $newForce];
        }

        return $diff;
    }

    protected function auditDescription(array $diff): string
    {
        $parts = [];

        foreach (['latest_version' => 'versi terbaru', 'min_version' => 'versi minimal', 'update_url' => 'URL unduh', 'changelog' => 'changelog'] as $field => $label) {
            if (isset($diff[$field])) {
                $parts[] = "{$label} '{$diff[$field]['old']}' → '{$diff[$field]['new']}'";
            }
        }

        if (isset($diff['force_update'])) {
            $old = $diff['force_update']['old'] ? 'Aktif' : 'Tidak';
            $new = $diff['force_update']['new'] ? 'Aktif' : 'Tidak';
            $parts[] = "wajib update '{$old}' → '{$new}'";
        }

        return implode('; ', $parts);
    }
}
