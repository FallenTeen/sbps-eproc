<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\CalculateArmadaUtilizationAction;
use App\Domain\Fleet\Exports\ArmadaMonitoringExport;
use App\Domain\Fleet\Models\Armada;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Bagian 21.11 — Monitoring Armada (web).
 *
 * Menampilkan metrik utilisasi armada (total jam aktif, HM/Jam atau jam/rit,
 * rekap durasi per tanggal, breakdown per unit bisnis) serta kondisi seluruh
 * armada (checklist, downtime, servis, status idle) untuk role pengelola
 * armada (Ketua Divisi Armada / Koordinator GCS / Owner).
 */
class MonitoringArmadaController extends Controller
{
    public function index(Request $request, CalculateArmadaUtilizationAction $action)
    {
        $validated = $this->validateFilters($request);

        $data = $action->execute(
            dari: $validated['dari'] ?? null,
            sampai: $validated['sampai'] ?? null,
            unitBisnisId: $validated['unit_bisnis_id'] ?? null,
        );

        $perUnit = collect($data['per_unit']);
        if (! empty($validated['status'])) {
            $perUnit = $perUnit->where('status', $validated['status'])->values();
        }

        return Inertia::render('Fleet/MonitoringArmada/Index', [
            'ringkasan' => $data['ringkasan'],
            'per_unit_bisnis' => $data['per_unit_bisnis'],
            'rekap_per_tanggal' => $data['rekap_per_tanggal'],
            'per_unit' => $perUnit->all(),
            'unit_bisnis' => UnitBisnis::aktif()->orderBy('kode')->get(['id', 'kode', 'nama']),
            'filters' => $validated,
        ]);
    }

    /**
     * Riwayat detail satu armada (checklist, ritase, sewa, downtime, servis)
     * untuk panel drill-down di frontend. Dipanggil lewat fetch/axios, bukan
     * navigasi Inertia penuh, supaya panel bisa dibuka tanpa reload halaman.
     */
    public function detail(Armada $armada, Request $request, CalculateArmadaUtilizationAction $action)
    {
        Gate::authorize('view', $armada);

        $validated = $request->validate([
            'dari' => 'nullable|date',
            'sampai' => 'nullable|date|after_or_equal:dari',
        ]);

        return response()->json(
            $action->detail($armada, $validated['dari'] ?? null, $validated['sampai'] ?? null)
        );
    }

    /**
     * Export ringkasan monitoring (per unit bisnis, per unit, rekap harian)
     * ke Excel, memakai filter yang sama dengan tampilan dashboard.
     */
    public function export(Request $request, CalculateArmadaUtilizationAction $action)
    {
        $validated = $this->validateFilters($request);

        $data = $action->execute(
            dari: $validated['dari'] ?? null,
            sampai: $validated['sampai'] ?? null,
            unitBisnisId: $validated['unit_bisnis_id'] ?? null,
        );

        $perUnit = collect($data['per_unit']);
        if (! empty($validated['status'])) {
            $perUnit = $perUnit->where('status', $validated['status'])->values();
        }

        $namaFile = sprintf(
            'monitoring-armada_%s_%s.xlsx',
            $data['tanggal_dari'],
            $data['tanggal_sampai']
        );

        return Excel::download(
            new ArmadaMonitoringExport($data['ringkasan'], $data['per_unit_bisnis'], $perUnit->all(), $data['rekap_per_tanggal']),
            $namaFile
        );
    }

    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'unit_bisnis_id' => 'nullable|exists:unit_bisnis,id',
            'status' => 'nullable|in:aktif,servis,nonaktif',
            'dari' => 'nullable|date',
            'sampai' => 'nullable|date|after_or_equal:dari',
        ]);
    }
}
