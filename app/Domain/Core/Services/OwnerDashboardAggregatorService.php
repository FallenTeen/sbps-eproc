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
            ->with(['proyek:id,nama,kode_proyek,client,lokasi,status,tipe_proyek,tanggal_mulai,tanggal_selesai_rencana', 'armadas', 'karyawanAssignments'])
            ->get()
            ->map(function ($titik) {
                return [
                    'id' => $titik->id,
                    'nama' => $titik->nama,
                    'proyek_id' => $titik->proyek_id,
                    'proyek_nama' => $titik->proyek ? $titik->proyek->nama : '-',
                    'kode_proyek' => $titik->proyek?->kode_proyek,
                    'client' => $titik->proyek?->client,
                    'proyek_lokasi' => $titik->proyek?->lokasi,
                    'proyek_status' => $titik->proyek?->status,
                    'tipe_proyek' => $titik->proyek?->tipe_proyek,
                    'tanggal_mulai' => $titik->proyek?->tanggal_mulai?->format('Y-m-d'),
                    'tanggal_selesai_rencana' => $titik->proyek?->tanggal_selesai_rencana?->format('Y-m-d'),
                    'latitude' => (float) $titik->latitude,
                    'longitude' => (float) $titik->longitude,
                    'radius_presensi_meter' => (int) $titik->radius_presensi_meter,
                    'status' => $titik->status,
                    'sdm_count' => $titik->karyawanAssignments ? $titik->karyawanAssignments->count() : 0,
                    'armada_count' => $titik->armadas ? $titik->armadas->count() : 0,
                ];
            });

        // 1b. Daftar Proyek untuk Filter & Monitoring
        $proyekList = Proyek::withCount('titik')
            ->orderBy('nama')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'nama' => $p->nama,
                'kode_proyek' => $p->kode_proyek,
                'status' => $p->status,
                'client' => $p->client,
                'lokasi' => $p->lokasi,
                'tipe_proyek' => $p->tipe_proyek,
                'tanggal_mulai' => $p->tanggal_mulai?->format('Y-m-d'),
                'tanggal_selesai_rencana' => $p->tanggal_selesai_rencana?->format('Y-m-d'),
                'titik_count' => $p->titik_count,
            ]);

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
            'proyek_list' => $proyekList,
            'summary_today' => [
                'produksi_output' => $produksiHariIni,
                'pengeluaran' => $pengeluaranHariIni,
                'po_pending_approval' => $poMenungguApproval,
                'unit_servis_jatuh_tempo' => $unitServisJatuhTempo,
                'total_proyek' => $proyekList->count(),
                'total_titik_aktif' => $titikAktif->count(),
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
