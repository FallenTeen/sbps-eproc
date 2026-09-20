<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Actions\CalculateArmadaUtilizationAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Bagian 21.11 — Monitoring Armada (web).
 *
 * Menampilkan metrik utilisasi armada (total jam aktif, HM/Jam, rekap durasi
 * per tanggal) serta kondisi seluruh armada (checklist, downtime, servis)
 * untuk role pengelola armada (Ketua Divisi Armada / Koordinator GCS / Owner).
 */
class MonitoringArmadaController extends Controller
{
    public function index(Request $request, CalculateArmadaUtilizationAction $action)
    {
        $validated = $request->validate([
            'unit_bisnis_id' => 'nullable|exists:unit_bisnis,id',
            'status' => 'nullable|in:aktif,servis,nonaktif',
            'dari' => 'nullable|date',
            'sampai' => 'nullable|date|after_or_equal:dari',
        ]);

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
            'rekap_per_tanggal' => $data['rekap_per_tanggal'],
            'per_unit' => $perUnit->all(),
            'unit_bisnis' => UnitBisnis::aktif()->orderBy('kode')->get(['id', 'kode', 'nama']),
            'filters' => $validated,
        ]);
    }
}
