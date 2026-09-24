<?php

namespace App\Domain\Core\Services;

use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\HR\Models\Cuti;
use App\Domain\HR\Models\GajiPeriode;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Procurement\Models\Pembayaran;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\Pengiriman;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\QCSample;
use App\Models\User;
use Carbon\Carbon;
use Spatie\Activitylog\Models\Activity;

/**
 * Aggregator dashboard web (/dashboard).
 *
 * BERLAKUKAN SEOBJECT-LEVEL SCOPING: semua data proyek/titik dibatasi ke
 * proyek yang boleh diakses user (lihat Proyek::scopeVisibleFor). Tanpa ini,
 * user eksternal Kontraktor menerima peta & daftar proyek seluruh perusahaan
 * (termasuk nama client/lokasi milik unit lain) — kebocoran data lintas-klien.
 *
 * Semua angka dihitung on-the-fly (tidak ada agregat statis tersimpan).
 */
class OwnerDashboardAggregatorService
{
    public function aggregate(?User $user = null): array
    {
        $user ??= auth()->user();
        $today = Carbon::today();

        $visibleProyekIds = Proyek::visibleForUserIds($user);

        // Titik milik proyek yang terlihat (untuk scoping tabel yang hanya
        // mencantumkan titik_id — ProductionSession, Pengiriman, QCSample).
        $visibleTitikIds = $visibleProyekIds === null
            ? null
            : Titik::whereIn('proyek_id', $visibleProyekIds)->pluck('id')->all();

        $scope = function ($query) use ($visibleProyekIds) {
            return $visibleProyekIds === null
                ? $query
                : $query->whereIn('proyek_id', $visibleProyekIds);
        };

        // 1. Peta Aktif (Titik dengan SDM & Armada aktif) — DISCALING ke user
        $titikAktif = $scope(Titik::query())
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

        // 1b. Daftar Proyek untuk Filter & Monitoring — DISCALING ke user
        $proyekQuery = Proyek::withCount('titik')->orderBy('nama');
        if ($visibleProyekIds !== null) {
            $proyekQuery->whereIn('id', $visibleProyekIds);
        }
        $proyekList = $proyekQuery->get()
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

        // 2. (summary_today dibangun oleh buildSummary() di bawah)

        // 3. RAB vs Realisasi Semua Proyek Aktif (Ringkas) — DISCALING ke user
        $proyekAktif = Proyek::where('status', 'aktif')->with('rab');
        if ($visibleProyekIds !== null) {
            $proyekAktif->whereIn('id', $visibleProyekIds);
        }
        $proyekAktif = $proyekAktif->get();

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

        // 4. Grafik Tren 6 Bulan Terakhir (produksi & pengeluaran, difilter
        // via proyek yang terlihat + permission modul).
        $trenBulanan = $this->buildTrenBulanan($today, $user, $visibleProyekIds, $visibleTitikIds);

        return [
            'peta_titik' => $titikAktif,
            'proyek_list' => $proyekList,
            'summary_today' => $this->buildSummary($user, $visibleProyekIds, $visibleTitikIds, $proyekList, $titikAktif),
            'rab_summary' => [
                'total_proyek_aktif' => $proyekAktif->count(),
                'total_rencana' => $totalRencanaRab,
                'total_realisasi' => $totalRealisasiRab,
                'persentase' => $persentaseRab,
            ],
            'tren_bulanan' => $trenBulanan,
            'widgets' => $this->buildWidgets($user, $visibleProyekIds, $visibleTitikIds),
            'access' => [
                'can_manage_users' => $this->can($user, ['manage role'], ['Owner', 'Admin Keuangan']),
                'can_view_audit' => $user?->hasRole('Owner') ?? false,
                'can_view_finance' => $this->can($user, ['manage finance', 'view finance']),
                'can_view_fleet' => $this->can($user, ['manage fleet', 'view fleet']),
                'can_view_production' => $this->can($user, ['manage production', 'view production']),
                'can_view_hr' => $this->can($user, ['manage hr', 'view hr']),
            ],
        ];
    }

    /**
     * Ringkasan hari ini per modul — dihitung on-the-fly dan hanya untuk
     * modul yang berhak dilihat user (mencegah info leak + kartu menuju 403).
     */
    protected function buildSummary(
        ?User $user,
        ?array $visibleProyekIds,
        ?array $visibleTitikIds,
        $proyekList,
        $titikAktif,
    ): array {
        $summary = [];
        $today = Carbon::today();
        $summary['total_proyek'] = $proyekList->count();
        $summary['total_titik_aktif'] = $titikAktif->count();

        $scopeTitik = function ($query) use ($visibleTitikIds) {
            return $visibleTitikIds === null
                ? $query
                : $query->whereIn('titik_id', $visibleTitikIds);
        };

        // ── Procurement (PO pending) ────────────────────────────────
        if ($this->can($user, ['view procurement', 'approve procurement'])) {
            $summary['po_pending_approval'] = PurchaseOrder::query()
                ->when($visibleProyekIds !== null, fn ($q) => $q->whereIn('proyek_id', $visibleProyekIds))
                ->WhereIn('status', ['menunggu_approval_finance', 'menunggu_approval_owner'])
                ->count();
        }

        // ── Finance (kas, invoice, piutang) ─────────────────────────
        if ($this->can($user, ['manage finance', 'view finance'])) {
            $summary['pengeluaran'] = (float) Pembayaran::query()
                ->when($visibleProyekIds !== null, fn ($q) => $q->whereHas('purchaseOrder', fn ($po) => $po->whereIn('proyek_id', $visibleProyekIds)))
                ->whereDate('created_at', $today)
                ->sum('jumlah');

            $saldoMutasi = MutasiKasBank::query()
                ->selectRaw('akun_kas_bank_id, SUM(CASE WHEN tipe = "masuk" THEN jumlah ELSE -jumlah END) as saldo')
                ->groupBy('akun_kas_bank_id')
                ->pluck('saldo', 'akun_kas_bank_id');

            $summary['saldo_kas'] = (float) AkunKasBank::aktif()
                ->get()
                ->sum(fn ($a) => (float) $a->saldo_awal + (float) ($saldoMutasi[$a->id] ?? 0));

            $invoiceQuery = Invoice::belumLunas()
                ->withSum('items as total_tagihan', 'subtotal')
                ->withSum('pembayaranKlien as total_bayar', 'jumlah');

            if ($visibleProyekIds !== null) {
                $invoiceQuery->whereIn('proyek_id', $visibleProyekIds);
            }

            $summary['invoice_terbit'] = Invoice::query()
                ->when($visibleProyekIds !== null, fn ($q) => $q->whereIn('proyek_id', $visibleProyekIds))
                ->count();

            $summary['piutang_outstanding'] = $invoiceQuery->get()
                ->sum(fn ($inv) => max(0, (float) $inv->total_tagihan) - max(0, (float) $inv->total_bayar));
        }

        // ── Fleet / Armada ──────────────────────────────────────────
        if ($this->can($user, ['manage fleet', 'view fleet'])) {
            $summary['armada_aktif'] = Armada::where('status', 'aktif')->count();
            $summary['ritase_today'] = Ritase::whereDate('tanggal', $today)->count();
            $summary['unit_servis_jatuh_tempo'] = Armada::where('status', 'servis')->count();
            $summary['downtime_aktif'] = DowntimeLog::aktif()->count();
        }

        // ── Produksi (output, mesin, QC, pengiriman) ────────────────
        if ($this->can($user, ['manage production', 'view production', 'manage production cbp', 'manage production amp'])) {
            $produksiQuery = $scopeTitik(ProductionSession::query());
            $pengirimanQuery = Pengiriman::query();
            $qcQuery = QCSample::query();

            if ($visibleTitikIds !== null) {
                $pengirimanQuery->whereHas('session', fn ($q) => $q->whereIn('titik_id', $visibleTitikIds));
                $qcQuery->whereHas('session', fn ($q) => $q->whereIn('titik_id', $visibleTitikIds));
            }

            $summary['produksi_output'] = (float) $produksiQuery
                ->whereDate('mulai', $today)
                ->sum('hasil_output');

            $summary['mesin_aktif'] = MesinProduksi::where('status', 'aktif')->count();
            $summary['qc_pending'] = (int) $qcQuery
                ->whereNull('hasil_uji_tekan')
                ->where('jenis_uji', 'uji_tekan')
                ->count();
            $summary['pengiriman_today'] = (int) $pengirimanQuery
                ->whereDate('waktu_muat', $today)
                ->count();
        }

        // ── SDM / HR ────────────────────────────────────────────────
        if ($this->can($user, ['manage hr', 'view hr', 'manage payroll', 'view payroll'])) {
            $summary['total_karyawan'] = (int) Karyawan::where('status', 'aktif')->count();
            $summary['cuti_pending'] = (int) Cuti::diajukan()->count();
            $summary['presensi_today'] = (int) Presensi::whereDate('check_in', $today)->count();
            $summary['payroll_periode'] = (int) GajiPeriode::byPeriode((int) now()->month, (int) now()->year)->count();
        }

        // ── Manajemen User & Audit Log (terbatas) ───────────────────
        if ($this->can($user, ['manage role'], ['Owner', 'Admin Keuangan'])) {
            $summary['total_users'] = (int) User::count();
        }

        if ($user?->hasRole('Owner')) {
            $summary['audit_log_count'] = (int) Activity::count();
        }

        // ── Portal Kontraktor (scoped ke proyek miliknya) ───────────
        if ($user?->hasRole('Kontraktor')) {
            $summary['proyek_aktif'] = $proyekList
                ->where('status', 'aktif')
                ->where('tipe_proyek', 'kontrak_klien')
                ->count();
            $summary['invoice_count'] = (int) Invoice::query()
                ->when($visibleProyekIds !== null, fn ($q) => $q->whereIn('proyek_id', $visibleProyekIds))
                ->count();
            $summary['piutang_outstanding'] = $summary['piutang_outstanding']
                ?? (Invoice::belumLunas()
                    ->when($visibleProyekIds !== null, fn ($q) => $q->whereIn('proyek_id', $visibleProyekIds))
                    ->withSum('items as total_tagihan', 'subtotal')
                    ->withSum('pembayaranKlien as total_bayar', 'jumlah')
                    ->get()
                    ->sum(fn ($inv) => max(0, (float) $inv->total_tagihan) - max(0, (float) $inv->total_bayar)));
        }

        return $summary;
    }

    /**
     * Tren 6 bulan: produksi & pengeluaran, hanya modul yang terlihat.
     */
    protected function buildTrenBulanan(Carbon $today, ?User $user, ?array $visibleProyekIds, ?array $visibleTitikIds): array
    {
        $tren = [];
        $showProduksi = $this->can($user, ['manage production', 'view production', 'manage production cbp', 'manage production amp']);
        $showFinance = $this->can($user, ['manage finance', 'view finance']);

        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::today()->subMonths($i);
            $label = $date->format('M Y');

            $baris = ['bulan' => $label];

            if ($showProduksi) {
                $prod = ProductionSession::query()
                    ->when($visibleTitikIds !== null, fn ($q) => $q->whereIn('titik_id', $visibleTitikIds))
                    ->whereYear('mulai', $date->year)
                    ->whereMonth('mulai', $date->month)
                    ->sum('hasil_output');
                $baris['produksi'] = (float) $prod;
            }

            if ($showFinance) {
                $exp = Pembayaran::query()
                    ->when($visibleProyekIds !== null, fn ($q) => $q->whereHas('purchaseOrder', fn ($po) => $po->whereIn('proyek_id', $visibleProyekIds)))
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->sum('jumlah');
                $baris['pengeluaran'] = (float) $exp;
            }

            $tren[] = $baris;
        }

        return $tren;
    }

    /**
     * Widget panel antar modul untuk sub-dashboard Frontend (Armada, Admin, Produksi).
     * Setiap widget hanya dibuat bila modul-nya boleh dilihat user.
     */
    protected function buildWidgets(?User $user, ?array $visibleProyekIds, ?array $visibleTitikIds): array
    {
        $widgets = [];

        if ($this->can($user, ['manage fleet', 'view fleet'])) {
            $widgets['armada'] = $this->buildArmadaWidgets($user);
        }

        $admin = [];
        if ($this->can($user, ['view procurement', 'approve procurement', 'manage procurement'])) {
            $admin['po_pending_list'] = $this->buildPoPendingList($visibleProyekIds);
        }
        if ($this->canSeeProyekInsights($user)) {
            $admin['unit_summary'] = $this->buildUnitSummary($user, $visibleProyekIds);
            $admin['deadline_list'] = $this->buildDeadlineList($visibleProyekIds);
        }
        if ($user?->hasRole('Owner')) {
            $admin['audit_list'] = $this->buildAuditList();
        }
        if ($admin !== []) {
            $widgets['admin'] = $admin;
        }

        if ($this->can($user, ['manage production', 'view production', 'manage production cbp', 'manage production amp'])) {
            $widgets['produksi'] = $this->buildProduksiWidgets($visibleTitikIds);
        }

        return $widgets;
    }

    protected function canSeeProyekInsights(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $this->can($user, ['manage proyek', 'view proyek', 'view owner dashboard'], ['Owner', 'Superadmin', 'Admin']);
    }

    /**
     * Widget Armada: armada aktif, servis jatuh tempo, ritase hari ini,
     * downtime berlangsung, grafik BBM hari ini & distribusi status.
     * Armada bersifat global dan dipersempit ke unit bila user bounded-unit.
     */
    protected function buildArmadaWidgets(?User $user): array
    {
        $today = Carbon::today();
        $unitBisnisId = $user?->unit_bisnis_id;
        $armadaScopeIds = $unitBisnisId ? Armada::byUnit($unitBisnisId)->pluck('id')->all() : null;

        $aktifList = Armada::with(['unitBisnis:id,nama', 'titik:id,nama', 'penanggungJawabs.karyawan:id,nama'])
            ->when($armadaScopeIds !== null, fn ($q) => $q->whereIn('id', $armadaScopeIds))
            ->aktif()
            ->orderBy('kode_unit')
            ->limit(6)
            ->get()
            ->map(function (Armada $a) {
                $pic = $a->penanggungJawabs
                    ->filter(fn ($pj) => $pj->sampai === null)
                    ->sortByDesc('mulai_dari')
                    ->first(fn ($pj) => $pj->peran === 'utama');
                $pic = $pic ?: $a->penanggungJawabs
                    ->filter(fn ($pj) => $pj->sampai === null)
                    ->sortByDesc('mulai_dari')
                    ->first(fn ($pj) => $pj->peran === 'cadangan');

                return [
                    'id' => $a->id,
                    'kode_unit' => $a->kode_unit,
                    'plat_nomor' => $a->plat_nomor,
                    'jenis' => str_replace('_', ' ', $a->jenis ?? ''),
                    'status' => $a->status,
                    'unit_bisnis' => $a->unitBisnis?->nama,
                    'titik' => $a->titik?->nama,
                    'pic' => $pic?->karyawan?->nama,
                    'tahun' => $a->tahun,
                ];
            })
            ->all();

        // Servis jatuh tempo — heuristik sama dgn NotificationController (90 hari).
        $servisDue = Armada::query()
            ->when($armadaScopeIds !== null, fn ($q) => $q->whereIn('id', $armadaScopeIds))
            ->where('status', 'aktif')
            ->whereNotNull('tanggal_servis_terakhir')
            ->orderBy('tanggal_servis_terakhir')
            ->get()
            ->filter(fn ($a) => Carbon::parse($a->tanggal_servis_terakhir)->addDays(90)->startOfDay()->isBefore(Carbon::today()->startOfDay()))
            ->take(6)
            ->values()
            ->map(function ($a) use ($today) {
                $tenggat = Carbon::parse($a->tanggal_servis_terakhir)->addDays(90)->startOfDay();
                $sisaHari = (int) round(($tenggat->getTimestamp() - $today->copy()->startOfDay()->getTimestamp()) / 86400);

                return [
                    'id' => $a->id,
                    'kode_unit' => $a->kode_unit,
                    'plat_nomor' => $a->plat_nomor,
                    'tanggal_servis_terakhir' => $a->tanggal_servis_terakhir?->format('Y-m-d'),
                    'sisa_hari' => $sisaHari,
                ];
            })
            ->all();

        $ritaseList = Ritase::with(['armada:id,kode_unit,plat_nomor', 'titik:id,nama', 'ruteTarif:id,lokasi_asal,lokasi_tujuan', 'proyek:id,nama', 'driver:id,nama'])
            ->whereDate('tanggal', $today)
            ->when($armadaScopeIds !== null, fn ($q) => $q->whereIn('armada_id', $armadaScopeIds))
            ->latest()
            ->limit(6)
            ->get()
            ->map(function ($r) {
                $rute = $r->ruteTarif
                    ? $r->ruteTarif->lokasi_asal.' → '.$r->ruteTarif->lokasi_tujuan
                    : ($r->titik?->nama ?: ($r->proyek?->nama ?: $r->customer));

                return [
                    'id' => $r->id,
                    'armada_id' => $r->armada_id,
                    'armada' => trim(($r->armada?->kode_unit ?? '').' '.($r->armada?->plat_nomor ?? '')),
                    'rute' => $rute,
                    'driver' => $r->driver?->nama,
                    'jumlah_rit' => (float) $r->jumlah_rit,
                    'jumlah_volume' => (float) $r->jumlah_volume,
                    'satuan_volume' => $r->satuan_volume,
                    'status' => $r->status,
                    'nominal' => (float) $r->nominal,
                ];
            })
            ->all();

        $downtimeList = DowntimeLog::with(['serviceable:id,kode_unit,plat_nomor'])
            ->aktif()
            ->where('serviceable_type', Armada::class)
            ->when($armadaScopeIds !== null, fn ($q) => $q->whereIn('serviceable_id', $armadaScopeIds))
            ->latest('mulai')
            ->limit(6)
            ->get()
            ->map(function ($d) {
                return [
                    'id' => $d->id,
                    'armada_id' => $d->serviceable_id,
                    'armada' => trim(($d->serviceable?->kode_unit ?? '').' '.($d->serviceable?->plat_nomor ?? '')),
                    'penyebab' => $d->penyebab,
                    'kategori' => $d->kategori,
                    'mulai' => $d->mulai?->toIso8601String(),
                    'durasi_menit' => $d->mulai ? (int) $d->mulai->diffInMinutes(now()) : 0,
                ];
            })
            ->all();

        $bbmById = BbmLog::where('serviceable_type', Armada::class)
            ->whereDate('tanggal', $today)
            ->when($armadaScopeIds !== null, fn ($q) => $q->whereIn('serviceable_id', $armadaScopeIds))
            ->get(['serviceable_id', 'liter', 'biaya'])
            ->groupBy('serviceable_id')
            ->map(fn ($logs) => [
                'liter' => round((float) $logs->sum('liter'), 2),
                'biaya' => (float) $logs->sum('biaya'),
            ]);
        $bbmNames = $bbmById->isNotEmpty()
            ? Armada::whereIn('id', $bbmById->keys())->pluck('kode_unit', 'id')
            : collect();
        $bbmChart = $bbmById
            ->map(fn ($agg, $armadaId) => [
                'armada' => $bbmNames[$armadaId] ?? 'Unit '.substr((string) $armadaId, 0, 8),
                'liter' => $agg['liter'],
                'biaya' => $agg['biaya'],
            ])
            ->sortByDesc('liter')
            ->take(8)
            ->values()
            ->all();

        $statusDist = Armada::query()
            ->when($armadaScopeIds !== null, fn ($q) => $q->whereIn('id', $armadaScopeIds))
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => ['status' => $row->status, 'total' => (int) $row->total])
            ->all();

        return [
            'total_armada' => (int) Armada::query()->when($armadaScopeIds !== null, fn ($q) => $q->whereIn('id', $armadaScopeIds))->count(),
            'aktif_list' => $aktifList,
            'servis_due_list' => $servisDue,
            'ritase_today_list' => $ritaseList,
            'downtime_list' => $downtimeList,
            'bbm_today_chart' => $bbmChart,
            'status_distribution' => $statusDist,
        ];
    }

    /**
     * Widget Admin: PO butuh approval, ringkasan per unit bisnis,
     * proyek mendekati deadline, & jejak audit (Owner).
     */
    protected function buildPoPendingList(?array $visibleProyekIds): array
    {
        $statusLabels = [
            'menunggu_approval_finance' => 'Menunggu Approval Finance',
            'menunggu_approval_owner' => 'Menunggu Approval Owner',
        ];

        return PurchaseOrder::with(['proyek:id,nama,kode_proyek', 'supplier:id,nama'])
            ->when($visibleProyekIds !== null, fn ($q) => $q->whereIn('proyek_id', $visibleProyekIds))
            ->whereIn('status', ['menunggu_approval_finance', 'menunggu_approval_owner'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($po) use ($statusLabels) {
                $raw = $po->getRawOriginal('status');

                return [
                    'id' => $po->id,
                    'kode_po' => $po->kode_po,
                    'proyek' => $po->proyek?->nama,
                    'supplier' => $po->supplier?->nama,
                    'total' => (float) $po->total,
                    'status' => $raw,
                    'status_label' => $statusLabels[$raw] ?? $raw,
                    'created_at' => $po->created_at?->toIso8601String(),
                ];
            })
            ->all();
    }

    protected function buildUnitSummary(?User $user, ?array $visibleProyekIds): array
    {
        $unitBisnisId = $user?->unit_bisnis_id;
        $units = UnitBisnis::when($unitBisnisId, fn ($q) => $q->where('id', $unitBisnisId))
            ->orderBy('nama')
            ->get(['id', 'nama']);

        return $units
            ->map(function (UnitBisnis $u) use ($visibleProyekIds) {
                $proyekIds = Proyek::where('unit_bisnis_id', $u->id)
                    ->when($visibleProyekIds !== null, fn ($q) => $q->whereIn('id', $visibleProyekIds))
                    ->pluck('id');

                return [
                    'unit' => $u->nama,
                    'proyek_aktif' => (int) $proyekIds->count(),
                    'titik_aktif' => (int) Titik::where('status', 'aktif')->whereIn('proyek_id', $proyekIds)->count(),
                    'armada_aktif' => (int) Armada::where('unit_bisnis_id', $u->id)->where('status', 'aktif')->count(),
                    'pengguna' => (int) User::where('unit_bisnis_id', $u->id)->count(),
                ];
            })
            ->values()
            ->all();
    }

    protected function buildDeadlineList(?array $visibleProyekIds): array
    {
        $today = Carbon::today()->startOfDay();

        return Proyek::with('unitBisnis:id,nama')
            ->when($visibleProyekIds !== null, fn ($q) => $q->whereIn('id', $visibleProyekIds))
            ->where('status', 'aktif')
            ->whereNotNull('tanggal_selesai_rencana')
            ->whereDate('tanggal_selesai_rencana', '>=', $today->format('Y-m-d'))
            ->whereDate('tanggal_selesai_rencana', '<=', $today->copy()->addDays(30)->format('Y-m-d'))
            ->orderBy('tanggal_selesai_rencana')
            ->limit(5)
            ->get()
            ->map(function ($p) use ($today) {
                $tenggat = Carbon::parse($p->tanggal_selesai_rencana)->startOfDay();
                $sisaHari = (int) round(($tenggat->getTimestamp() - $today->getTimestamp()) / 86400);

                return [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'client' => $p->client,
                    'unit' => $p->unitBisnis?->nama,
                    'tanggal_selesai_rencana' => $p->tanggal_selesai_rencana?->format('Y-m-d'),
                    'sisa_hari' => $sisaHari,
                ];
            })
            ->all();
    }

    protected function buildAuditList(): array
    {
        return Activity::with(['causer:id,name,nama_lengkap'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'description' => $log->description,
                'causer' => $log->causer?->nama_lengkap ?? $log->causer?->name,
                'event' => $log->event,
                'created_at' => $log->created_at?->diffForHumans(),
            ])
            ->all();
    }

    /**
     * Widget Produksi: sesi berjalan, QC menunggu uji tekan, pengiriman
     * hari ini, output per produk & tren 7 hari. Dipersempit via titik.
     */
    protected function buildProduksiWidgets(?array $visibleTitikIds): array
    {
        $today = Carbon::today();

        $sesiList = ProductionSession::with(['produk:id,nama,satuan_output', 'mesin:id,nama', 'titik:id,nama'])
            ->when($visibleTitikIds !== null, fn ($q) => $q->whereIn('titik_id', $visibleTitikIds))
            ->berjalan()
            ->latest('mulai')
            ->limit(5)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'produk' => $s->produk?->nama,
                'mesin' => $s->mesin?->nama,
                'titik' => $s->titik?->nama,
                'mulai' => $s->mulai?->toIso8601String(),
                'satuan' => $s->produk?->satuan_output,
            ])
            ->all();

        $qcList = QCSample::with(['session:id,titik_id,produk_id,mulai', 'session.produk:id,nama', 'session.titik:id,nama'])
            ->where('jenis_uji', 'uji_tekan')
            ->whereNull('hasil_uji_tekan')
            ->when($visibleTitikIds !== null, fn ($q) => $q->whereHas('session', fn ($s) => $s->whereIn('titik_id', $visibleTitikIds)))
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($q) => [
                'id' => $q->id,
                'session_id' => $q->production_session_id,
                'produk' => $q->session?->produk?->nama,
                'titik' => $q->session?->titik?->nama,
                'rencana_uji_tekan' => $q->tanggal_uji_tekan_rencana?->format('d/m/Y'),
                'status' => $q->status,
            ])
            ->all();

        $pengirimanList = Pengiriman::with(['session.produk:id,nama', 'session.titik:id,nama', 'armada:id,kode_unit,plat_nomor', 'driver:id,nama'])
            ->whereDate('waktu_muat', $today)
            ->when($visibleTitikIds !== null, fn ($q) => $q->whereHas('session', fn ($s) => $s->whereIn('titik_id', $visibleTitikIds)))
            ->latest('waktu_muat')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'produk' => $p->session?->produk?->nama,
                'titik' => $p->session?->titik?->nama,
                'tujuan' => $p->tujuan_alamat,
                'armada' => trim(($p->armada?->kode_unit ?? '').' '.($p->armada?->plat_nomor ?? '')),
                'driver' => $p->driver?->nama,
                'status' => $p->status,
                'waktu_muat' => $p->waktu_muat?->toIso8601String(),
            ])
            ->all();

        $outputByProduk = ProductionSession::query()
            ->when($visibleTitikIds !== null, fn ($q) => $q->whereIn('titik_id', $visibleTitikIds))
            ->whereDate('mulai', $today)
            ->selectRaw('produk_id, SUM(hasil_output) as total')
            ->groupBy('produk_id')
            ->get();
        $produkNama = $outputByProduk->isNotEmpty()
            ? Produk::whereIn('id', $outputByProduk->pluck('produk_id'))->get(['id', 'nama', 'satuan_output'])
            : collect();
        $produkNamaBy = $produkNama->keyBy('id');
        $outputPerProduk = $outputByProduk
            ->map(function ($row) use ($produkNamaBy) {
                $p = $produkNamaBy[$row->produk_id] ?? null;

                return [
                    'produk' => $p?->nama ?? '-',
                    'output' => (float) $row->total,
                    'satuan' => $p?->satuan_output,
                ];
            })
            ->sortByDesc('output')
            ->values()
            ->all();

        $trenHari = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $today->copy()->subDays($i);
            $trenHari[] = [
                'tanggal' => $date->format('Y-m-d'),
                'output' => (float) ProductionSession::query()
                    ->when($visibleTitikIds !== null, fn ($q) => $q->whereIn('titik_id', $visibleTitikIds))
                    ->whereDate('mulai', $date)
                    ->sum('hasil_output'),
            ];
        }

        return [
            'sesi_berjalan_list' => $sesiList,
            'qc_pending_list' => $qcList,
            'pengiriman_today_list' => $pengirimanList,
            'output_per_produk' => $outputPerProduk,
            'tren_7_hari' => $trenHari,
        ];
    }

    /**
     * Cek akses: permission ATAU role apapun terpenuhi.
     */
    protected function can(?User $user, array $permissions, array $roles = []): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasAnyPermission($permissions) || $user->hasAnyRole($roles);
    }
}