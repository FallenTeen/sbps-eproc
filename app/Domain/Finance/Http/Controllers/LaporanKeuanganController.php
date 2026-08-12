<?php

namespace App\Domain\Finance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Services\ConsolidateFinanceReportService;
use App\Domain\Core\Actions\CompareRABRealisasiAction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanKeuanganController extends Controller
{
    public function index(Request $request)
    {
        $unitBisnisId = $request->input('unit_bisnis_id');
        $bulan = $request->input('bulan', date('m'));
        $tahun = $request->input('tahun', date('Y'));

        return Inertia::render('Finance/LaporanKeuangan/Index', [
            'unitBisnisList' => UnitBisnis::all(['id', 'nama']),
            'filters' => [
                'unit_bisnis_id' => $unitBisnisId ?? '',
                'bulan' => (string)$bulan,
                'tahun' => (string)$tahun,
            ],
        ]);
    }

    public function rabRealisasi(Request $request)
    {
        $unitBisnisId = $request->input('unit_bisnis_id');
        $proyekId = $request->input('proyek_id');

        $proyeks = Proyek::query()
            ->when($unitBisnisId, fn($q) => $q->where('unit_bisnis_id', $unitBisnisId))
            ->get(['id', 'nama', 'unit_bisnis_id']);

        $rabQuery = Rab::query()
            ->with(['proyek:id,nama', 'titik:id,nama'])
            ->when($proyekId, fn($q) => $q->where('proyek_id', $proyekId))
            ->when($unitBisnisId, fn($q) => $q->whereHas('proyek', fn($p) => $p->where('unit_bisnis_id', $unitBisnisId)));

        $rabs = $rabQuery->get();
        $compareAction = new CompareRABRealisasiAction();

        $totalRencana = 0;
        $totalRealisasi = 0;

        $items = $rabs->map(function ($rab) use ($compareAction, &$totalRencana, &$totalRealisasi) {
            $comparison = $compareAction->execute($rab);
            $totalRencana += $comparison['rencana'];
            $totalRealisasi += $comparison['realisasi'];

            return [
                'id' => $rab->id,
                'proyek' => $rab->proyek ? $rab->proyek->nama : '-',
                'titik' => $rab->titik ? $rab->titik->nama : '-',
                'kategori' => $rab->kategori,
                'deskripsi' => $rab->deskripsi ?? 'RAB ' . ucfirst($rab->kategori),
                'rencana' => $comparison['rencana'],
                'realisasi' => $comparison['realisasi'],
                'selisih' => $comparison['selisih'],
                'persentase' => $comparison['persentase'],
            ];
        });

        $totalSelisih = $totalRencana - $totalRealisasi;
        $totalPersentase = $totalRencana > 0 ? round(($totalRealisasi / $totalRencana) * 100, 2) : 0;

        return Inertia::render('Finance/LaporanKeuangan/RabRealisasi', [
            'items' => $items,
            'unitBisnisList' => UnitBisnis::all(['id', 'nama']),
            'proyekList' => $proyeks,
            'summary' => [
                'total_rencana' => $totalRencana,
                'total_realisasi' => $totalRealisasi,
                'total_selisih' => $totalSelisih,
                'total_persentase' => $totalPersentase,
            ],
            'filters' => [
                'unit_bisnis_id' => $unitBisnisId ?? '',
                'proyek_id' => $proyekId ?? '',
            ]
        ]);
    }

    public function labaRugi(Request $request)
    {
        $unitBisnisId = $request->input('unit_bisnis_id');
        $bulan = (int)$request->input('bulan', date('m'));
        $tahun = (int)$request->input('tahun', date('Y'));

        $unitBisnisQuery = UnitBisnis::query()
            ->when($unitBisnisId, fn($q) => $q->where('id', $unitBisnisId));

        $unitBisnisList = $unitBisnisQuery->get();
        $consolidateService = new ConsolidateFinanceReportService();

        $reportUnits = [];
        $grandPendapatan = 0;
        $grandBeban = 0;

        foreach ($unitBisnisList as $ub) {
            // Calculate revenue from invoices issued in period
            $invoices = Invoice::where('unit_bisnis_id', $ub->id)
                ->whereYear('tanggal_terbit', $tahun)
                ->whereMonth('tanggal_terbit', $bulan)
                ->with('items')
                ->get();

            $pendapatan = $invoices->sum(fn($inv) => $inv->items->sum('subtotal'));

            // Calculate costs consolidated across projects of this unit
            $proyeks = Proyek::where('unit_bisnis_id', $ub->id)->get();
            $bebanPO = 0;
            $bebanRitase = 0;
            $bebanProduksi = 0;
            $bebanGaji = 0;

            foreach ($proyeks as $proyek) {
                $costs = $consolidateService->generate($proyek, $bulan, $tahun);
                $bebanPO += $costs['po'];
                $bebanRitase += $costs['ritase'];
                $bebanProduksi += $costs['produksi'];
                $bebanGaji += $costs['gaji'];
            }

            $totalBeban = $bebanPO + $bebanRitase + $bebanProduksi + $bebanGaji;
            $labaBersih = $pendapatan - $totalBeban;

            $grandPendapatan += $pendapatan;
            $grandBeban += $totalBeban;

            $reportUnits[] = [
                'unit_bisnis_id' => $ub->id,
                'unit_bisnis_nama' => $ub->nama,
                'pendapatan' => $pendapatan,
                'beban_po' => $bebanPO,
                'beban_ritase' => $bebanRitase,
                'beban_produksi' => $bebanProduksi,
                'beban_gaji' => $bebanGaji,
                'total_beban' => $totalBeban,
                'laba_bersih' => $labaBersih,
            ];
        }

        $grandLabaBersih = $grandPendapatan - $grandBeban;

        return Inertia::render('Finance/LaporanKeuangan/LabaRugi', [
            'reportUnits' => $reportUnits,
            'unitBisnisList' => UnitBisnis::all(['id', 'nama']),
            'summary' => [
                'total_pendapatan' => $grandPendapatan,
                'total_beban' => $grandBeban,
                'total_laba_bersih' => $grandLabaBersih,
            ],
            'filters' => [
                'unit_bisnis_id' => $unitBisnisId ?? '',
                'bulan' => sprintf('%02d', $bulan),
                'tahun' => (string)$tahun,
            ]
        ]);
    }

    public function exportExcel(Request $request)
    {
        $type = $request->input('type', 'rab_realisasi');
        $filename = "laporan_{$type}_" . date('Ymd_His') . ".csv";

        $response = new StreamedResponse(function () use ($type, $request) {
            $handle = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            if ($type === 'rab_realisasi') {
                fputcsv($handle, ['Proyek', 'Titik', 'Kategori', 'Deskripsi', 'Rencana (Rp)', 'Realisasi (Rp)', 'Selisih (Rp)', 'Persentase (%)']);

                $unitBisnisId = $request->input('unit_bisnis_id');
                $proyekId = $request->input('proyek_id');
                $compareAction = new CompareRABRealisasiAction();

                $rabs = Rab::query()
                    ->with(['proyek', 'titik'])
                    ->when($proyekId, fn($q) => $q->where('proyek_id', $proyekId))
                    ->when($unitBisnisId, fn($q) => $q->whereHas('proyek', fn($p) => $p->where('unit_bisnis_id', $unitBisnisId)))
                    ->get();

                foreach ($rabs as $rab) {
                    $comp = $compareAction->execute($rab);
                    fputcsv($handle, [
                        $rab->proyek ? $rab->proyek->nama : '-',
                        $rab->titik ? $rab->titik->nama : '-',
                        $rab->kategori,
                        $rab->deskripsi ?? '-',
                        $comp['rencana'],
                        $comp['realisasi'],
                        $comp['selisih'],
                        $comp['persentase'] . '%',
                    ]);
                }
            } else {
                fputcsv($handle, ['Unit Bisnis', 'Pendapatan (Rp)', 'Beban Material/PO (Rp)', 'Beban Ritase (Rp)', 'Beban Produksi (Rp)', 'Beban Gaji (Rp)', 'Total Beban (Rp)', 'Laba Bersih (Rp)']);

                $unitBisnisId = $request->input('unit_bisnis_id');
                $bulan = (int)$request->input('bulan', date('m'));
                $tahun = (int)$request->input('tahun', date('Y'));

                $unitBisnisList = UnitBisnis::query()
                    ->when($unitBisnisId, fn($q) => $q->where('id', $unitBisnisId))
                    ->get();

                $consolidateService = new ConsolidateFinanceReportService();

                foreach ($unitBisnisList as $ub) {
                    $invoices = Invoice::where('unit_bisnis_id', $ub->id)
                        ->whereYear('tanggal_terbit', $tahun)
                        ->whereMonth('tanggal_terbit', $bulan)
                        ->with('items')
                        ->get();

                    $pendapatan = $invoices->sum(fn($inv) => $inv->items->sum('subtotal'));
                    $proyeks = Proyek::where('unit_bisnis_id', $ub->id)->get();

                    $bebanPO = 0; $bebanRitase = 0; $bebanProduksi = 0; $bebanGaji = 0;
                    foreach ($proyeks as $proyek) {
                        $c = $consolidateService->generate($proyek, $bulan, $tahun);
                        $bebanPO += $c['po'];
                        $bebanRitase += $c['ritase'];
                        $bebanProduksi += $c['produksi'];
                        $bebanGaji += $c['gaji'];
                    }

                    $totalBeban = $bebanPO + $bebanRitase + $bebanProduksi + $bebanGaji;
                    $laba = $pendapatan - $totalBeban;

                    fputcsv($handle, [
                        $ub->nama,
                        $pendapatan,
                        $bebanPO,
                        $bebanRitase,
                        $bebanProduksi,
                        $bebanGaji,
                        $totalBeban,
                        $laba,
                    ]);
                }
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', "attachment; filename=\"{$filename}\"");

        return $response;
    }
}
