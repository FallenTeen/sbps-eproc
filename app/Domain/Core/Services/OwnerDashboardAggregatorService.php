<?php

namespace App\Domain\Core\Services;

use App\Domain\Core\Actions\GetRABRealisasiAction;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Fleet\Models\Armada;
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