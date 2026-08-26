<?php

namespace App\Domain\Production\Services;

use App\Domain\Production\Actions\CalculateProductionCostAction;
use App\Domain\Production\Actions\CalculateProductionRevenueAction;
use App\Domain\Production\Models\Pengiriman;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\QCSample;
use Carbon\Carbon;

class ProductionDashboardAggregator
{
    public function getMetrics(): array
    {
        $today = Carbon::today();

        // 1. Sesi aktif hari ini (berjalan)
        $activeSessionsCount = ProductionSession::where('status', 'berjalan')->count();

        // 2. Output hari ini (Selesai hari ini)
        $completedToday = ProductionSession::with('produk')
            ->where('status', 'selesai')
            ->whereDate('selesai', $today)
            ->get();

        $outputTodayPerProduct = $completedToday->groupBy(function ($session) {
            return $session->produk ? $session->produk->nama : 'Unknown';
        })->map(function ($sessions) {
            $volume = $sessions->sum('hasil_output');
            $satuan = $sessions->first()->produk ? $sessions->first()->produk->satuan_output : '';

            return [
                'volume' => $volume,
                'satuan' => $satuan,
            ];
        });

        // 3. Margin hari ini
        $totalCostToday = 0;
        $totalRevenueToday = 0;

        $costAction = new CalculateProductionCostAction;
        $revAction = new CalculateProductionRevenueAction;

        foreach ($completedToday as $session) {
            $totalCostToday += $costAction->execute($session);
            $totalRevenueToday += $revAction->execute($session);
        }
        $marginToday = $totalRevenueToday - $totalCostToday;

        // 4. Sample menunggu uji tekan
        $pendingQcCount = QCSample::whereNull('hasil_uji_tekan')
            ->where('jenis_uji', 'uji_tekan')
            ->count();

        // 5. Pengiriman hari ini
        $pengirimanTodayCount = Pengiriman::whereDate('waktu_muat', $today)->count();

        // 6. Grafik Output per produk (7 hari terakhir)
        $startDate = Carbon::today()->subDays(6);
        $weeklySessions = ProductionSession::with('produk')
            ->where('status', 'selesai')
            ->whereDate('selesai', '>=', $startDate)
            ->get();

        // Format data untuk grafik (misal: array dengan key tanggal, tiap produk jadi dataset)
        $chartData = [
            'labels' => [], // Tanggal
            'datasets' => [], // { label: 'Produk A', data: [10, 20, 0, ...] }
        ];

        // Buat labels tanggal
        for ($i = 0; $i < 7; $i++) {
            $dateStr = $startDate->copy()->addDays($i)->format('Y-m-d');
            $chartData['labels'][] = $dateStr;
        }

        // Group per produk
        $groupedByProduct = $weeklySessions->groupBy('produk_id');
        foreach ($groupedByProduct as $produkId => $sessions) {
            $produk = $sessions->first()->produk;
            if (! $produk) {
                continue;
            }

            $dataset = [
                'label' => $produk->nama,
                'data' => array_fill(0, 7, 0),
            ];

            // Isi volume per tanggal
            foreach ($sessions as $session) {
                $dateIndex = array_search(Carbon::parse($session->selesai)->format('Y-m-d'), $chartData['labels']);
                if ($dateIndex !== false) {
                    $dataset['data'][$dateIndex] += (float) $session->hasil_output;
                }
            }

            $chartData['datasets'][] = $dataset;
        }

        // 7. Daftar Sesi Aktif
        $activeSessionsList = ProductionSession::with(['mesin', 'produk'])
            ->where('status', 'berjalan')
            ->latest('mulai')
            ->take(5)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'mesin' => $s->mesin ? $s->mesin->nama : '-',
                    'produk' => $s->produk ? $s->produk->nama : '-',
                    'mulai' => $s->mulai,
                ];
            });

        return [
            'active_sessions_count' => $activeSessionsCount,
            'output_today_per_product' => $outputTodayPerProduct,
            'margin_today' => $marginToday,
            'revenue_today' => $totalRevenueToday,
            'cost_today' => $totalCostToday,
            'pending_qc_count' => $pendingQcCount,
            'pengiriman_today_count' => $pengirimanTodayCount,
            'chart_data' => $chartData,
            'active_sessions_list' => $activeSessionsList,
        ];
    }
}
