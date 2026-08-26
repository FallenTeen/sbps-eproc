<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Models\Titik;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Production\Models\ProductionSession;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/mobile/dashboard/overview
     */
    public function overview(Request $request)
    {
        $today = now()->toDateString();

        $titiks = Titik::aktif()
            ->with('proyek:id,nama')
            ->withCount([
                'armadas as armada_count',
                'karyawanAssignments as sdm_count',
            ])
            ->orderBy('nama')
            ->get()
            ->map(function (Titik $titik) use ($today) {
                $produksiToday = (float) ProductionSession::where('titik_id', $titik->id)
                    ->where('status', 'selesai')
                    ->whereDate('mulai', $today)
                    ->sum('hasil_output');

                $presensiToday = Presensi::where('titik_id', $titik->id)
                    ->whereDate('check_in', $today)
                    ->count();

                return [
                    'titik_id' => $titik->id,
                    'titik' => $titik->nama,
                    'proyek' => $titik->proyek?->nama,
                    'latitude' => (float) $titik->latitude,
                    'longitude' => (float) $titik->longitude,
                    'sdm_count' => (int) $titik->sdm_count,
                    'armada_count' => (int) $titik->armada_count,
                    'presensi_today' => $presensiToday,
                    'produksi_today' => $produksiToday,
                ];
            });

        return $this->success([
            'tanggal' => $today,
            'total_titik' => $titiks->count(),
            'items' => $titiks,
        ], 'Ringkasan dashboard mobile.');
    }

    /**
     * GET /api/mobile/dashboard/titik/{titikId}
     */
    public function titik(Request $request, string $titikId)
    {
        $titik = Titik::with([
            'proyek:id,nama',
            'armadas',
            'karyawanAssignments.karyawan',
            'rab',
        ])->findOrFail($titikId);

        $today = now()->toDateString();

        $sessionsToday = ProductionSession::with('produk')
            ->where('titik_id', $titik->id)
            ->whereDate('mulai', $today)
            ->get();

        $presensiToday = Presensi::with('karyawan')
            ->where('titik_id', $titik->id)
            ->whereDate('check_in', $today)
            ->get();

        $totalRencana = 0;
        $totalRealisasi = 0;
        $getRabAction = new GetRABRealisasiAction;

        foreach ($titik->rab as $rab) {
            $totalRencana += (float) $rab->rencana;
            $totalRealisasi += (float) $getRabAction->execute($rab);
        }

        return $this->success([
            'titik' => [
                'id' => $titik->id,
                'nama' => $titik->nama,
                'proyek' => $titik->proyek?->nama,
                'latitude' => (float) $titik->latitude,
                'longitude' => (float) $titik->longitude,
                'status' => $titik->status,
            ],
            'sdm' => $titik->karyawanAssignments->map(fn ($a) => [
                'id' => $a->karyawan_id,
                'nama' => $a->karyawan?->nama,
                'jabatan' => $a->karyawan?->jabatan,
            ]),
            'armada' => $titik->armadas->map(fn ($a) => [
                'id' => $a->id,
                'kode_unit' => $a->kode_unit,
                'plat_nomor' => $a->plat_nomor,
                'jenis' => $a->jenis,
                'status' => $a->status,
            ]),
            'produksi_hari_ini' => [
                'total_output' => (float) $sessionsToday->where('status', 'selesai')->sum('hasil_output'),
                'jumlah_sesi' => $sessionsToday->count(),
            ],
            'presensi_hari_ini' => $presensiToday->map(fn ($p) => [
                'nama' => $p->karyawan?->nama,
                'check_in' => $p->check_in?->toIso8601String(),
                'check_out' => $p->check_out?->toIso8601String(),
            ]),
            'rab' => [
                'total_rencana' => $totalRencana,
                'total_realisasi' => $totalRealisasi,
                'persentase' => $totalRencana > 0 ? round(($totalRealisasi / $totalRencana) * 100, 1) : 0,
            ],
        ], 'Detail titik.');
    }

    /**
     * GET /api/mobile/dashboard/chart/produksi
     * Produksi per minggu dalam bulan tertentu.
     */
    public function chartProduksi(Request $request)
    {
        $validated = $request->validate([
            'bulan' => 'nullable|integer|min:1|max:12',
            'tahun' => 'nullable|integer|min:2020|max:2099',
        ]);

        $bulan = $validated['bulan'] ?? (int) now()->format('m');
        $tahun = $validated['tahun'] ?? (int) now()->format('Y');

        $sessions = ProductionSession::where('status', 'selesai')
            ->whereMonth('mulai', $bulan)
            ->whereYear('mulai', $tahun)
            ->get();

        $mingguan = $sessions->groupBy(function ($s) {
            return Carbon::parse($s->mulai)->startOfWeek()->format('Y-m-d');
        })->map(fn ($items, $week) => [
            'minggu' => $week,
            'total_output' => round($items->sum('hasil_output'), 2),
            'jumlah_sesi' => $items->count(),
        ])->values();

        return $this->success([
            'bulan' => $bulan,
            'tahun' => $tahun,
            'items' => $mingguan,
        ], 'Chart produksi mingguan.');
    }

    /**
     * GET /api/mobile/dashboard/chart/keuangan
     * Pemasukan & pengeluaran per minggu dalam bulan tertentu.
     */
    public function chartKeuangan(Request $request)
    {
        $validated = $request->validate([
            'bulan' => 'nullable|integer|min:1|max:12',
            'tahun' => 'nullable|integer|min:2020|max:2099',
        ]);

        $bulan = $validated['bulan'] ?? (int) now()->format('m');
        $tahun = $validated['tahun'] ?? (int) now()->format('Y');

        $mutasi = MutasiKasBank::whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->get();

        $mingguan = $mutasi->groupBy(function ($m) {
            return Carbon::parse($m->tanggal)->startOfWeek()->format('Y-m-d');
        })->map(fn ($items, $week) => [
            'minggu' => $week,
            'masuk' => round($items->where('tipe', 'masuk')->sum('jumlah'), 2),
            'keluar' => round($items->where('tipe', 'keluar')->sum('jumlah'), 2),
        ])->values();

        return $this->success([
            'bulan' => $bulan,
            'tahun' => $tahun,
            'items' => $mingguan,
        ], 'Chart keuangan mingguan.');
    }

    /**
     * GET /api/mobile/dashboard/armada-status
     * Distribusi status armada aktif.
     */
    public function armadaStatus()
    {
        $statuses = Armada::aktif()
            ->selectRaw('status, count(*) as jumlah')
            ->groupBy('status')
            ->get();

        return $this->success([
            'total' => Armada::aktif()->count(),
            'items' => $statuses,
        ], 'Status armada.');
    }

    /**
     * GET /api/mobile/dashboard/kehadiran-divisi
     * Presensi hari ini dikelompokkan berdasarkan divisi karyawan.
     */
    public function kehadiranDivisi()
    {
        $today = now()->toDateString();

        $presensi = Presensi::with('karyawan')
            ->whereDate('check_in', $today)
            ->get();

        $divisi = $presensi->groupBy(fn ($p) => $p->karyawan?->divisi ?? 'Lainnya')
            ->map(fn ($items, $d) => [
                'divisi' => $d,
                'hadir' => $items->count(),
                'check_out' => $items->whereNotNull('check_out')->count(),
            ])->values();

        return $this->success([
            'tanggal' => $today,
            'total_hadir' => $presensi->count(),
            'items' => $divisi,
        ], 'Kehadiran per divisi.');
    }

    /**
     * GET /api/mobile/dashboard/po-pending
     * Daftar PO yang masih menunggu approval / belum diterima.
     */
    public function poPending()
    {
        $pos = PurchaseOrder::with(['supplier', 'titik', 'proyek'])
            ->whereIn('status', ['draft', 'diajukan', 'menunggu_approval_finance', 'menunggu_approval_owner'])
            ->orderBy('tanggal_diperlukan')
            ->limit(20)
            ->get();

        return $this->success([
            'total' => $pos->count(),
            'items' => $pos->map(fn ($po) => [
                'id' => $po->id,
                'kode_po' => $po->kode_po,
                'supplier' => $po->supplier?->nama,
                'titik' => $po->titik?->nama,
                'proyek' => $po->proyek?->nama,
                'total' => (float) $po->total,
                'status' => $po->status,
                'tanggal_diperlukan' => $po->tanggal_diperlukan?->toDateString(),
            ]),
        ], 'PO pending.');
    }

    /**
     * GET /api/mobile/dashboard/invoice-belum-dibayar
     * Invoice yang belum lunas.
     */
    public function invoiceBelumDibayar()
    {
        $invoices = Invoice::with(['unitBisnis', 'proyek', 'items'])
            ->belumLunas()
            ->orderBy('tanggal_jatuh_tempo')
            ->limit(20)
            ->get();

        $data = $invoices->map(function ($inv) {
            $totalTagihan = $inv->items->sum('jumlah_tagihan');
            $totalDibayar = $inv->pembayaranKlien()->sum('jumlah');

            return [
                'id' => $inv->id,
                'kode_invoice' => $inv->kode_invoice,
                'unit_bisnis' => $inv->unitBisnis?->nama,
                'proyek' => $inv->proyek?->nama,
                'total_tagihan' => (float) $totalTagihan,
                'total_dibayar' => (float) $totalDibayar,
                'sisa' => (float) ($totalTagihan - $totalDibayar),
                'status' => $inv->status,
                'tanggal_jatuh_tempo' => $inv->tanggal_jatuh_tempo?->toDateString(),
            ];
        });

        return $this->success([
            'total' => $data->count(),
            'items' => $data,
        ], 'Invoice belum dibayar.');
    }
}
