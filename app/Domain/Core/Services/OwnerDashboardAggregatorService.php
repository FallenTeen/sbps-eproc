<?php

namespace App\Domain\Core\Services;

use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Titik;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Procurement\Models\Pembayaran;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Production\Models\ProductionSession;
use Carbon\Carbon;

class OwnerDashboardAggregatorService
{
    public function aggregate(): array
    {
        $today = Carbon::today();

        // 1. Peta Aktif (Titik dengan SDM & Armada aktif)
        $titikAktif = Titik::query()
            ->where('status', 'aktif')
            ->with(['proyek:id,nama', 'armadas', 'karyawanAssignments'])
            ->get()
            ->map(function ($titik) {
                return [
                    'id' => $titik->id,
                    'nama' => $titik->nama,
                    'proyek_nama' => $titik->proyek ? $titik->proyek->nama : '-',
                    'latitude' => (float) $titik->latitude,
                    'longitude' => (float) $titik->longitude,
                    'sdm_count' => $titik->karyawanAssignments ? $titik->karyawanAssignments->count() : 0,
                    'armada_count' => $titik->armadas ? $titik->armadas->count() : 0,
                ];
            });

        // 2. Ringkasan Hari Ini
        $produksiHariIni = (float) ProductionSession::whereDate('mulai', $today)->sum('hasil_output');

        $pengeluaranHariIni = (float) Pembayaran::whereDate('created_at', $today)->sum('jumlah');

        $poMenungguApproval = PurchaseOrder::whereIn('status', [
            'menunggu_approval_finance',
            'menunggu_approval_owner',
        ])->count();

        // Armada jatuh tempo servis (status servis atau perlu_servis)
        $unitServisJatuhTempo = Armada::whereIn('status', ['servis', 'perlu_servis'])->count();

        // 3. RAB vs Realisasi Semua Proyek Aktif (Ringkas)
        $proyekAktif = Proyek::where('status', 'aktif')->with('rab')->get();
        $totalRencanaRab = 0;
        $totalRealisasiRab = 0;
        $getRabAction = new GetRABRealisasiAction;

        foreach ($proyekAktif as $proyek) {
            foreach ($proyek->rab as $rabItem) {
                $totalRencanaRab += (float) $rabItem->rencana;
                $totalRealisasiRab += (float) $getRabAction->execute($rabItem);
            }
        }

        $persentaseRab = $totalRencanaRab > 0 ? round(($totalRealisasiRab / $totalRencanaRab) * 100, 1) : 0;

        // 4. Grafik Tren 6 Bulan Terakhir
        $trenBulanan = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::today()->subMonths($i);
            $month = $date->month;
            $year = $date->year;
            $label = $date->format('M Y');

            $prod = ProductionSession::whereYear('mulai', $year)
                ->whereMonth('mulai', $month)
                ->sum('hasil_output');

            $exp = Pembayaran::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->sum('jumlah');

            $trenBulanan[] = [
                'bulan' => $label,
                'produksi' => (float) $prod,
                'pengeluaran' => (float) $exp,
            ];
        }

        return [
            'peta_titik' => $titikAktif,
            'summary_today' => [
                'produksi_output' => $produksiHariIni,
                'pengeluaran' => $pengeluaranHariIni,
                'po_pending_approval' => $poMenungguApproval,
                'unit_servis_jatuh_tempo' => $unitServisJatuhTempo,
            ],
            'rab_summary' => [
                'total_proyek_aktif' => $proyekAktif->count(),
                'total_rencana' => $totalRencanaRab,
                'total_realisasi' => $totalRealisasiRab,
                'persentase' => $persentaseRab,
            ],
            'tren_bulanan' => $trenBulanan,
        ];
    }
}
