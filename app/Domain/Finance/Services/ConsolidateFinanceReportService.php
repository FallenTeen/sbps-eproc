<?php

namespace App\Domain\Finance\Services;

use App\Domain\Core\Models\Proyek;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\HR\Models\GajiPeriode;

class ConsolidateFinanceReportService
{
    public function generate(Proyek $proyek, $bulan, $tahun): array
    {
        // Pengeluaran dari PO (lunas)
        $poTotal = PurchaseOrder::where('proyek_id', $proyek->id)
            ->whereYear('created_at', $tahun)
            ->whereMonth('created_at', $bulan)
            ->whereIn('status', ['lunas', 'dibayar_sebagian'])
            ->sum('total');

        // Biaya ritase (untuk GCS)
        $ritaseTotal = Ritase::where('proyek_id', $proyek->id)
            ->whereYear('tanggal', $tahun)
            ->whereMonth('tanggal', $bulan)
            ->where('status', 'disetujui')
            ->sum('total_upah_rit');

        // Biaya produksi (CBP/AMP)
        $produksiTotal = ProductionSession::where('proyek_id', $proyek->id)
            ->whereYear('created_at', $tahun)
            ->whereMonth('created_at', $bulan)
            ->where('status', 'selesai')
            ->with('items')
            ->get()
            ->sum(function ($session) {
                return (new \App\Domain\Production\Actions\CalculateProductionCostAction())->execute($session);
            });

        // Gaji (untuk SDM)
        $gajiTotal = GajiPeriode::whereHas('karyawan.assignments', function ($q) use ($proyek) {
            $q->where('proyek_id', $proyek->id);
        })
            ->whereYear('periode_tahun', $tahun)
            ->whereMonth('periode_bulan', $bulan)
            ->where('status', 'dibayar')
            ->get()
            ->sum(function ($gaji) {
                return (new \App\Domain\HR\Actions\CalculateNetSalaryAction())->execute($gaji);
            });

        return [
            'po' => $poTotal,
            'ritase' => $ritaseTotal,
            'produksi' => $produksiTotal,
            'gaji' => $gajiTotal,
            'total' => $poTotal + $ritaseTotal + $produksiTotal + $gajiTotal,
        ];
    }
}
