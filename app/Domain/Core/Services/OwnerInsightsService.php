<?php

namespace App\Domain\Core\Services;

use App\Domain\Core\Models\Proyek;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\HR\Models\Cuti;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Procurement\Models\Pembayaran;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\QCSample;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Route;

/**
 * Data tambahan untuk dashboard owner (key `insights` pada ownerData).
 *
 * Semua angka dihitung on-the-fly, di-scope ke proyek/titik/unit milik user,
 * dan hanya dibuat untuk modul yang boleh dilihat user. Dipanggil dari
 * OwnerDashboardAggregatorService::aggregate().
 */
class OwnerInsightsService
{
    private const PERM_FINANCE = ['manage finance', 'view finance'];
    private const PERM_FLEET = ['manage fleet', 'view fleet'];
    private const PERM_PROD = ['manage production', 'view production', 'manage production cbp', 'manage production amp'];
    private const PERM_HR = ['manage hr', 'view hr', 'manage payroll', 'view payroll'];
    private const PERM_PO = ['view procurement', 'approve procurement', 'manage procurement'];

    /**
     * @param  array<int|string, array{rencana: float, realisasi: float}>  $rabPerProyek  hasil loop RAB di aggregator (id proyek => total)
     */
    public function build(?User $user, ?array $proyekIds, ?array $titikIds, array $rabPerProyek): array
    {
        if (! $user || $user->hasRole('Kontraktor')) {
            return [];
        }

        $today = Carbon::today();
        $out = [];

        $health = $this->kesehatanProyek($user, $proyekIds, $rabPerProyek, $today);
        if ($health !== null) {
            $out['kesehatan_proyek'] = $health;
        }

        if ($this->can($user, self::PERM_FINANCE)) {
            $out['keuangan'] = $this->keuangan($user, $proyekIds, $rabPerProyek, $today);
        }
        if ($this->can($user, self::PERM_FLEET)) {
            $out['armada'] = $this->armada($user, $today);
        }
        if ($this->can($user, self::PERM_PROD)) {
            $out['produksi'] = $this->produksi($titikIds, $today);
        }
        if ($this->can($user, self::PERM_HR)) {
            $out['sdm'] = $this->sdm($today);
        }

        $out['kpi'] = $this->kpi($user, $proyekIds, $titikIds);
        $out['perlu_tindakan'] = $this->perluTindakan($user, $proyekIds, $titikIds, $out, $today);

        return $out;
    }

    /** Saldo kas semua akun aktif (dibatasi unit bila user ber-unit). */
    public function saldoKas(?User $user): float
    {
        $akun = $this->akunKas($user)->get(['id', 'saldo_awal']);
        if ($akun->isEmpty()) {
            return 0.0;
        }

        $mutasi = MutasiKasBank::query()
            ->whereIn('akun_kas_bank_id', $akun->pluck('id'))
            ->selectRaw('akun_kas_bank_id, SUM(CASE WHEN tipe = "masuk" THEN jumlah ELSE -jumlah END) as saldo')
            ->groupBy('akun_kas_bank_id')
            ->pluck('saldo', 'akun_kas_bank_id');

        return (float) $akun->sum(fn ($a) => (float) $a->saldo_awal + (float) ($mutasi[$a->id] ?? 0));
    }

    // ── Perlu tindakan

    protected function perluTindakan(User $user, ?array $proyekIds, ?array $titikIds, array $out, Carbon $today): array
    {
        $items = [];
        $add = function (string $key, string $label, int $count, string $tone, ?string $href, string $hint) use (&$items) {
            if ($count > 0) {
                $items[] = compact('key', 'label', 'count', 'tone', 'href', 'hint');
            }
        };

        if ($this->can($user, self::PERM_PO)) {
            $n = PurchaseOrder::query()
                ->when($proyekIds !== null, fn ($q) => $q->whereIn('proyek_id', $proyekIds))
                ->whereIn('status', ['menunggu_approval_finance', 'menunggu_approval_owner'])
                ->count();
            $add('po', 'PO menunggu approval', $n, 'kuning', $this->url('purchase-orders.index'), 'Setujui atau tolak agar pengadaan tidak tertahan');
        }

        if ($this->can($user, self::PERM_FINANCE)) {
            $n = Invoice::query()
                ->when($proyekIds !== null, fn ($q) => $q->whereIn('proyek_id', $proyekIds))
                ->where('status', 'jatuh_tempo')
                ->count();
            $add('invoice', 'Invoice jatuh tempo', $n, 'merah', $this->url('finance.invoice.index'), 'Tagih klien atau jadwalkan ulang pembayaran');
        }

        $kritis = collect($out['kesehatan_proyek']['daftar'] ?? [])->where('kesehatan', 'kritis')->count();
        $add('proyek', 'Proyek biaya melebihi progres', $kritis, 'merah', null, 'Tinjau RAB dan percepat atau tahan pengeluaran');

        if (isset($out['armada'])) {
            $add('servis', 'Unit lewat jadwal servis', (int) $out['armada']['servis_terlambat'], 'kuning', $this->url('fleet.monitoring-armada.index'), 'Jadwalkan servis sebelum unit rusak');
            $add('downtime', 'Unit sedang downtime', (int) $out['armada']['downtime_aktif'], 'merah', $this->url('fleet.armada.index'), 'Unit tidak menghasilkan selama downtime berjalan');
        }

        if (isset($out['produksi'])) {
            $add('qc', 'Uji tekan belum ada hasil', (int) $out['produksi']['qc_menunggu'], 'kuning', null, 'Hasil uji dibutuhkan sebelum pengiriman diterima klien');
        }

        if (isset($out['sdm'])) {
            $add('cuti', 'Pengajuan cuti menunggu', (int) $out['sdm']['cuti_pending'], 'kuning', $this->url('hr.cuti.index'), 'Putuskan agar jadwal tim bisa disusun');
            $add('presensi', 'Presensi di luar radius', (int) $out['sdm']['presensi_luar_radius'], 'kuning', $this->url('attendance.presensi.index'), 'Mandor perlu meninjau dan memvalidasi');
        }

        usort($items, fn ($a, $b) => [$a['tone'] === 'merah' ? 0 : 1, -$a['count']] <=> [$b['tone'] === 'merah' ? 0 : 1, -$b['count']]);

        return $items;
    }

    // ── KPI + deret 7 hari

    protected function kpi(User $user, ?array $proyekIds, ?array $titikIds): array
    {
        $kpi = [];
        $from = Carbon::today()->subDays(6)->toDateString();

        if ($this->can($user, self::PERM_FINANCE)) {
            $kpi['pengeluaran'] = $this->bungkusDeret($this->deret(
                Pembayaran::query()
                    ->when($proyekIds !== null, fn ($q) => $q->whereHas('purchaseOrder', fn ($po) => $po->whereIn('proyek_id', $proyekIds)))
                    ->whereDate('created_at', '>=', $from)
                    ->selectRaw('DATE(created_at) as d, SUM(jumlah) as v')
                    ->groupByRaw('DATE(created_at)')
                    ->pluck('v', 'd')
            ));
        }

        if ($this->can($user, self::PERM_PROD)) {
            $kpi['produksi'] = $this->bungkusDeret($this->deret(
                ProductionSession::query()
                    ->when($titikIds !== null, fn ($q) => $q->whereIn('titik_id', $titikIds))
                    ->whereDate('mulai', '>=', $from)
                    ->selectRaw('DATE(mulai) as d, SUM(hasil_output) as v')
                    ->groupByRaw('DATE(mulai)')
                    ->pluck('v', 'd')
            ));
        }

        if ($this->can($user, self::PERM_FLEET)) {
            $ids = $this->armadaIds($user);
            $kpi['ritase'] = $this->bungkusDeret($this->deret(
                Ritase::query()
                    ->when($ids !== null, fn ($q) => $q->whereIn('armada_id', $ids))
                    ->whereDate('tanggal', '>=', $from)
                    ->selectRaw('DATE(tanggal) as d, COUNT(*) as v')
                    ->groupByRaw('DATE(tanggal)')
                    ->pluck('v', 'd')
            ));
        }

        return $kpi;
    }

    // ── Keuangan

    protected function keuangan(User $user, ?array $proyekIds, array $rabPerProyek, Carbon $today): array
    {
        // Piutang + umur piutang. Basis umur = created_at invoice; ganti ke
        // kolom tanggal terbit/jatuh tempo bila tersedia di tabel invoice.
        $invoices = Invoice::belumLunas()
            ->with('proyek:id,client')
            ->when($proyekIds !== null, fn ($q) => $q->whereIn('proyek_id', $proyekIds))
            ->withSum('items as total_tagihan', 'subtotal')
            ->withSum('pembayaranKlien as total_bayar', 'jumlah')
            ->get()
            ->map(function ($inv) use ($today) {
                $sisa = max(0, (float) $inv->total_tagihan) - max(0, (float) $inv->total_bayar);

                return [
                    'sisa' => $sisa,
                    'umur' => (int) $inv->created_at?->startOfDay()->diffInDays($today),
                    'klien' => $inv->proyek?->client ?: 'Tanpa klien',
                ];
            })
            ->filter(fn ($r) => $r['sisa'] > 0);

        $bucket = fn (int $min, ?int $max) => $invoices->filter(fn ($r) => $r['umur'] >= $min && ($max === null || $r['umur'] <= $max));
        $aging = collect([['0–30 hari', 0, 30], ['31–60 hari', 31, 60], ['Lebih dari 60 hari', 61, null]])
            ->map(fn ($b) => [
                'label' => $b[0],
                'total' => (float) $bucket($b[1], $b[2])->sum('sisa'),
                'jumlah' => $bucket($b[1], $b[2])->count(),
            ])->all();

        $topPiutang = $invoices->groupBy('klien')
            ->map(fn ($rows, $klien) => ['klien' => $klien, 'total' => (float) $rows->sum('sisa')])
            ->sortByDesc('total')->take(5)->values()->all();

        // Arus kas 30 hari + runway
        $akunIds = $this->akunKas($user)->pluck('id');
        $mutasi = MutasiKasBank::query()
            ->whereIn('akun_kas_bank_id', $akunIds)
            ->whereDate('created_at', '>=', $today->copy()->subDays(29)->toDateString())
            ->selectRaw('DATE(created_at) as d, SUM(CASE WHEN tipe = "masuk" THEN jumlah ELSE 0 END) as masuk, SUM(CASE WHEN tipe = "keluar" THEN jumlah ELSE 0 END) as keluar')
            ->groupByRaw('DATE(created_at)')
            ->get()->keyBy('d');

        $arus = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = $today->copy()->subDays($i)->toDateString();
            $arus[] = [
                'tanggal' => $d,
                'masuk' => (float) ($mutasi[$d]->masuk ?? 0),
                'keluar' => (float) ($mutasi[$d]->keluar ?? 0),
            ];
        }
        $rataKeluar = collect($arus)->avg('keluar') ?: 0;
        $saldo = $this->saldoKas($user);

        // Margin per proyek kontrak klien: tagihan non-draft vs realisasi RAB
        $tagihan = Invoice::query()
            ->when($proyekIds !== null, fn ($q) => $q->whereIn('proyek_id', $proyekIds))
            ->where('status', '!=', 'draft')
            ->withSum('items as total_tagihan', 'subtotal')
            ->get()->groupBy('proyek_id')
            ->map(fn ($rows) => (float) $rows->sum('total_tagihan'));

        $nama = Proyek::whereIn('id', $tagihan->keys())->pluck('nama', 'id');
        $margin = $tagihan->map(function ($pendapatan, $id) use ($rabPerProyek, $nama) {
            $biaya = (float) ($rabPerProyek[$id]['realisasi'] ?? 0);

            return [
                'proyek' => $nama[$id] ?? '-',
                'pendapatan' => $pendapatan,
                'biaya' => $biaya,
                'margin_persen' => $pendapatan > 0 ? round((($pendapatan - $biaya) / $pendapatan) * 100, 1) : null,
            ];
        })->sortByDesc('pendapatan')->take(6)->values()->all();

        return [
            'piutang_total' => (float) $invoices->sum('sisa'),
            'aging' => $aging,
            'top_piutang' => $topPiutang,
            'arus_kas_30' => $arus,
            'rata_keluar_harian' => round($rataKeluar, 0),
            'runway_hari' => $rataKeluar > 0 ? (int) floor($saldo / $rataKeluar) : null,
            'margin_proyek' => $margin,
        ];
    }

    // ── Kesehatan proyek (biaya vs waktu) ───────────────────────────

    protected function kesehatanProyek(User $user, ?array $proyekIds, array $rabPerProyek, Carbon $today): ?array
    {
        if (! $this->canProyek($user)) {
            return null;
        }

        $daftar = Proyek::query()
            ->when($proyekIds !== null, fn ($q) => $q->whereIn('id', $proyekIds))
            ->where('status', 'aktif')
            ->get(['id', 'nama', 'client', 'tanggal_mulai', 'tanggal_selesai_rencana'])
            ->map(function ($p) use ($rabPerProyek, $today) {
                $rencana = (float) ($rabPerProyek[$p->id]['rencana'] ?? 0);
                $realisasi = (float) ($rabPerProyek[$p->id]['realisasi'] ?? 0);
                $persenBiaya = $rencana > 0 ? round($realisasi / $rencana * 100, 1) : null;

                $persenWaktu = null;
                $sisaHari = null;
                if ($p->tanggal_mulai && $p->tanggal_selesai_rencana) {
                    $mulai = Carbon::parse($p->tanggal_mulai)->startOfDay();
                    $selesai = Carbon::parse($p->tanggal_selesai_rencana)->startOfDay();
                    $total = max(1, ($selesai->getTimestamp() - $mulai->getTimestamp()) / 86400);
                    $lewat = ($today->getTimestamp() - $mulai->getTimestamp()) / 86400;
                    $persenWaktu = round(min(100, max(0, $lewat / $total * 100)), 1);
                    $sisaHari = (int) round(($selesai->getTimestamp() - $today->getTimestamp()) / 86400);
                }

                $kesehatan = 'tanpa_rab';
                if ($persenBiaya !== null) {
                    $selisih = $persenBiaya - ($persenWaktu ?? $persenBiaya);
                    $kesehatan = match (true) {
                        $persenBiaya > 100, $selisih > 25 => 'kritis',
                        $persenBiaya > 85, $selisih > 10 => 'waspada',
                        default => 'sehat',
                    };
                }

                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'client' => $p->client,
                    'rencana' => $rencana,
                    'realisasi' => $realisasi,
                    'persen_biaya' => $persenBiaya,
                    'persen_waktu' => $persenWaktu,
                    'sisa_hari' => $sisaHari,
                    'terlambat' => $sisaHari !== null && $sisaHari < 0,
                    'kesehatan' => $kesehatan,
                ];
            });

        $urutan = ['kritis' => 0, 'waspada' => 1, 'sehat' => 2, 'tanpa_rab' => 3];

        return [
            'ringkasan' => [
                'kritis' => $daftar->where('kesehatan', 'kritis')->count(),
                'waspada' => $daftar->where('kesehatan', 'waspada')->count(),
                'sehat' => $daftar->where('kesehatan', 'sehat')->count(),
                'tanpa_rab' => $daftar->where('kesehatan', 'tanpa_rab')->count(),
                'terlambat' => $daftar->where('terlambat', true)->count(),
            ],
            'daftar' => $daftar->sortBy(fn ($r) => [$urutan[$r['kesehatan']], -($r['persen_biaya'] ?? 0)])->values()->all(),
        ];
    }

    // ── Armada

    protected function armada(User $user, Carbon $today): array
    {
        $ids = $this->armadaIds($user);
        $scope = fn ($q, $col = 'id') => $ids === null ? $q : $q->whereIn($col, $ids);
        $awalBulan = $today->copy()->startOfMonth()->toDateString();

        $aktif = $scope(Armada::query()->where('status', 'aktif'))->count();
        $beroperasi = $scope(Ritase::query()->whereDate('tanggal', $today), 'armada_id')->distinct('armada_id')->count('armada_id');

        $ritBulan = (float) $scope(Ritase::query()->whereDate('tanggal', '>=', $awalBulan), 'armada_id')->sum('jumlah_rit');
        $biayaBbm = (float) $scope(BbmLog::query()->where('serviceable_type', Armada::class)->whereDate('tanggal', '>=', $awalBulan), 'serviceable_id')->sum('biaya');

        $downtimeBulan = $scope(
            DowntimeLog::query()->where('serviceable_type', Armada::class)->whereDate('mulai', '>=', $awalBulan),
            'serviceable_id'
        )->selectRaw('serviceable_id, COUNT(*) as total')->groupBy('serviceable_id')->orderByDesc('total')->limit(5)->get();

        $kode = $downtimeBulan->isNotEmpty()
            ? Armada::whereIn('id', $downtimeBulan->pluck('serviceable_id'))->pluck('kode_unit', 'id')
            : collect();

        return [
            'aktif' => $aktif,
            'beroperasi_hari_ini' => $beroperasi,
            'utilisasi_persen' => $aktif > 0 ? round($beroperasi / $aktif * 100, 1) : 0,
            'bbm_per_rit' => $ritBulan > 0 ? round($biayaBbm / $ritBulan, 0) : null,
            'biaya_bbm_bulan_ini' => $biayaBbm,
            'kejadian_downtime_bulan_ini' => (int) $downtimeBulan->sum('total'),
            'sering_downtime' => $downtimeBulan->map(fn ($r) => [
                'armada' => $kode[$r->serviceable_id] ?? 'Unit '.substr((string) $r->serviceable_id, 0, 8),
                'kejadian' => (int) $r->total,
            ])->values()->all(),
            'servis_terlambat' => $this->servisTerlambatCount($user),
            'downtime_aktif' => $scope(DowntimeLog::aktif()->where('serviceable_type', Armada::class), 'serviceable_id')->count(),
        ];
    }

    /** Aturan tunggal servis jatuh tempo (90 hari) - dipakai summary & widget. */
    public function servisTerlambatCount(?User $user): int
    {
        $ids = $this->armadaIds($user);

        return Armada::query()
            ->when($ids !== null, fn ($q) => $q->whereIn('id', $ids))
            ->where('status', 'aktif')
            ->whereNotNull('tanggal_servis_terakhir')
            ->whereDate('tanggal_servis_terakhir', '<', Carbon::today()->subDays(90)->toDateString())
            ->count();
    }

    // ── Produksi

    protected function produksi(?array $titikIds, Carbon $today): array
    {
        $sesi = fn () => ProductionSession::query()->when($titikIds !== null, fn ($q) => $q->whereIn('titik_id', $titikIds));
        $bulanIni = $today->copy()->startOfMonth();
        $bulanLalu = $bulanIni->copy()->subMonth();

        $qc = QCSample::query()
            ->where('jenis_uji', 'uji_tekan')
            ->whereDate('created_at', '>=', $today->copy()->subDays(30)->toDateString())
            ->when($titikIds !== null, fn ($q) => $q->whereHas('session', fn ($s) => $s->whereIn('titik_id', $titikIds)));
        $qcTotal = (clone $qc)->count();
        $qcSelesai = (clone $qc)->whereNotNull('hasil_uji_tekan')->count();

        return [
            'output_bulan_ini' => (float) $sesi()->whereDate('mulai', '>=', $bulanIni->toDateString())->sum('hasil_output'),
            'output_bulan_lalu' => (float) $sesi()
                ->whereDate('mulai', '>=', $bulanLalu->toDateString())
                ->whereDate('mulai', '<', $bulanIni->toDateString())
                ->sum('hasil_output'),
            'qc_selesai_persen' => $qcTotal > 0 ? round($qcSelesai / $qcTotal * 100, 1) : null,
            'qc_menunggu' => (int) QCSample::query()
                ->where('jenis_uji', 'uji_tekan')->whereNull('hasil_uji_tekan')
                ->when($titikIds !== null, fn ($q) => $q->whereHas('session', fn ($s) => $s->whereIn('titik_id', $titikIds)))
                ->count(),
        ];
    }

    // ── SDM

    protected function sdm(Carbon $today): array
    {
        $karyawan = (int) Karyawan::where('status', 'aktif')->count();
        $hadir = (int) Presensi::whereDate('check_in', $today)->count();

        return [
            'karyawan_aktif' => $karyawan,
            'presensi_hari_ini' => $hadir,
            'hadir_persen' => $karyawan > 0 ? min(100, round($hadir / $karyawan * 100, 1)) : null,
            'presensi_luar_radius' => (int) Presensi::whereDate('check_in', $today)->where('status_validasi', 'luar_radius')->count(),
            'cuti_pending' => (int) Cuti::diajukan()->count(),
        ];
    }

    // ── Util

    /** @return list<float> 7 nilai, hari terlama → hari ini */
    private function deret(Collection $perTanggal, int $hari = 7): array
    {
        $out = [];
        for ($i = $hari - 1; $i >= 0; $i--) {
            $out[] = (float) ($perTanggal[Carbon::today()->subDays($i)->toDateString()] ?? 0);
        }

        return $out;
    }

    private function bungkusDeret(array $deret): array
    {
        return [
            'hari_ini' => $deret[count($deret) - 1],
            'kemarin' => $deret[count($deret) - 2],
            'deret' => $deret,
        ];
    }

    private function akunKas(?User $user)
    {
        return AkunKasBank::aktif()->when($user?->unit_bisnis_id, fn ($q, $unit) => $q->where('unit_bisnis_id', $unit));
    }

    private function armadaIds(?User $user): ?array
    {
        return $user?->unit_bisnis_id ? Armada::byUnit($user->unit_bisnis_id)->pluck('id')->all() : null;
    }

    private function url(string $name): ?string
    {
        return Route::has($name) ? route($name, [], false) : null;
    }

    private function canProyek(User $user): bool
    {
        return $this->can($user, ['manage proyek', 'view proyek', 'view owner dashboard'], ['Owner', 'Superadmin', 'Admin']);
    }

    private function can(?User $user, array $permissions, array $roles = []): bool
    {
        return $user && ($user->hasAnyPermission($permissions) || $user->hasAnyRole($roles));
    }
}
