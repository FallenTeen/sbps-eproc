<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Route-to-breadcrumb label map for automatic breadcrumb generation.
     *
     * @var array<string, string>
     */
    protected array $breadcrumbMap = [
        'dashboard' => 'Dashboard',
        'notifications.index' => 'Notifikasi',

        'core.unit-bisnis.index' => 'Unit Bisnis',
        'core.unit-bisnis.create' => 'Tambah Unit Bisnis',
        'core.unit-bisnis.show' => 'Detail Unit Bisnis',
        'core.unit-bisnis.edit' => 'Edit Unit Bisnis',
        'core.proyek.index' => 'Proyek',
        'core.proyek.create' => 'Tambah Proyek',
        'core.proyek.show' => 'Detail Proyek',
        'core.proyek.edit' => 'Edit Proyek',
        'core.titik.index' => 'Titik Lokasi',
        'core.titik.create' => 'Tambah Titik',
        'core.titik.show' => 'Detail Titik',
        'core.titik.edit' => 'Edit Titik',
        'core.rab.index' => 'RAB',
        'core.rab.create' => 'Tambah RAB',
        'core.rab.show' => 'Detail RAB',
        'core.rab.edit' => 'Edit RAB',
        'core.rab.realisasi' => 'Realisasi RAB',
        'core.rab.compare' => 'RAB vs Realisasi',

        'procurement.bahan-baku.index' => 'Bahan Baku',
        'procurement.bahan-baku.create' => 'Tambah Bahan Baku',
        'procurement.bahan-baku.show' => 'Detail Bahan Baku',
        'procurement.bahan-baku.edit' => 'Edit Bahan Baku',
        'procurement.bahan-baku.stok' => 'Stok Bahan Baku',
        'procurement.supplier.index' => 'Supplier',
        'procurement.supplier.create' => 'Tambah Supplier',
        'procurement.supplier.show' => 'Detail Supplier',
        'procurement.supplier.edit' => 'Edit Supplier',
        'procurement.purchase-orders.index' => 'Purchase Orders',
        'procurement.purchase-orders.create' => 'Buat PO',
        'procurement.purchase-orders.show' => 'Detail PO',
        'procurement.purchase-orders.edit' => 'Edit PO',
        'procurement.purchase-orders.payment' => 'Pembayaran PO',
        'procurement.purchase-orders.approval-queue' => 'Antrian Approval PO',
        'procurement.pembayaran.index' => 'Pembayaran',
        'procurement.pembayaran.show' => 'Detail Pembayaran',

        'fleet.armada.index' => 'Armada',
        'fleet.armada.create' => 'Tambah Armada',
        'fleet.armada.show' => 'Detail Armada',
        'fleet.armada.edit' => 'Edit Armada',
        'fleet.ritase.index' => 'Ritase Harian',
        'fleet.ritase.create' => 'Catat Ritase',
        'fleet.ritase.show' => 'Detail Ritase',
        'fleet.ritase.edit' => 'Edit Ritase',
        'fleet.ritase.report-harian' => 'Laporan Ritase Harian',
        'fleet.ritase.report-mingguan' => 'Laporan Ritase Mingguan',
        'fleet.sewa-alat.index' => 'Sewa Alat Jam',
        'fleet.sewa-alat.create' => 'Catat Sewa Alat',
        'fleet.sewa-alat.show' => 'Detail Sewa Alat',
        'fleet.sewa-alat.edit' => 'Edit Sewa Alat',
        'fleet.sewa-alat.report-mingguan' => 'Laporan Sewa Alat',
        'fleet.rute-tarif.index' => 'Rute & Tarif',
        'fleet.rute-tarif.create' => 'Tambah Rute Tarif',
        'fleet.rute-tarif.show' => 'Detail Rute Tarif',
        'fleet.rute-tarif.edit' => 'Edit Rute Tarif',
        'fleet.service-history.index' => 'Service History',
        'fleet.checklist-harian.index' => 'Checklist Harian',
        'fleet.bbm.index' => 'Log BBM',
        'fleet.downtime.index' => 'Downtime Log',

        'production.dashboard' => 'Dashboard Produksi',
        'production.mesin.index' => 'Mesin Produksi',
        'production.mesin.create' => 'Tambah Mesin',
        'production.mesin.show' => 'Detail Mesin',
        'production.mesin.edit' => 'Edit Mesin',
        'production.produk.index' => 'Produk',
        'production.produk.create' => 'Tambah Produk',
        'production.produk.show' => 'Detail Produk',
        'production.produk.edit' => 'Edit Produk',
        'production.resep.index' => 'Resep Produksi',
        'production.resep.create' => 'Tambah Resep',
        'production.resep.edit' => 'Edit Resep',
        'production.mix-design.index' => 'Mix Design',
        'production.mix-design.create' => 'Buat Mix Design',
        'production.mix-design.show' => 'Detail Mix Design',
        'production.mix-design.edit' => 'Edit Mix Design',
        'production.sessions.index' => 'Sesi Produksi',
        'production.sessions.active' => 'Sesi Aktif',
        'production.sessions.create' => 'Mulai Sesi',
        'production.sessions.show' => 'Detail Sesi',
        'production.sessions.edit' => 'Edit Sesi',
        'production.sessions.report-harian' => 'Laporan Produksi Harian',
        'production.qc.pending' => 'QC Pending',
        'production.pengiriman.index' => 'Pengiriman',
        'production.pengiriman.today' => 'Pengiriman Hari Ini',
        'production.pengiriman.create' => 'Jadwalkan Pengiriman',
        'production.pengiriman.show' => 'Detail Pengiriman',
        'production.pengiriman.edit' => 'Edit Pengiriman',

        'hr.karyawan.index' => 'Karyawan',
        'hr.karyawan.create' => 'Tambah Karyawan',
        'hr.karyawan.show' => 'Detail Karyawan',
        'hr.karyawan.edit' => 'Edit Karyawan',
        'hr.cuti.index' => 'Pengajuan Cuti',
        'hr.payroll.index' => 'Payroll',
        'hr.payroll.show' => 'Detail Payroll',
        'hr.payroll.review' => 'Review Payroll',

        'finance.akun-kas.index' => 'Kas & Bank',
        'finance.akun-kas.create' => 'Tambah Akun Kas',
        'finance.akun-kas.show' => 'Detail Akun Kas',
        'finance.akun-kas.edit' => 'Edit Akun Kas',
        'finance.akun-kas.mutasi' => 'Mutasi Kas',
        'finance.mutasi-kas.index' => 'Mutasi Kas',
        'finance.mutasi-kas.report' => 'Laporan Mutasi',
        'finance.transfer-kas.index' => 'Transfer Antar Kas',
        'finance.transfer-kas.create' => 'Buat Transfer',
        'finance.transfer-kas.show' => 'Detail Transfer',
        'finance.invoice.index' => 'Invoice',
        'finance.invoice.create' => 'Buat Invoice',
        'finance.invoice.show' => 'Detail Invoice',
        'finance.invoice.edit' => 'Edit Invoice',
        'finance.invoice.outstanding' => 'Piutang Outstanding',
        'finance.invoice.aging' => 'Aging Piutang',
        'finance.laporan-keuangan.index' => 'Laporan Keuangan',
        'finance.laporan-keuangan.rab-realisasi' => 'RAB vs Realisasi',
        'finance.laporan-keuangan.laba-rugi' => 'Laporan Laba Rugi',

        'kontraktor.dashboard' => 'Portal Kontraktor',
        'kontraktor.proyek.detail' => 'Detail Proyek',
        'kontraktor.proyek.produksi' => 'Progress Produksi',
        'kontraktor.proyek.invoice' => 'Invoice Proyek',

        'audit.logs.index' => 'Audit Log',
        'audit.logs.show' => 'Detail Audit Log',

        'profile.edit' => 'Profile',

        'users.index' => 'User Management',
        'users.create' => 'Tambah User',
        'users.edit' => 'Edit User',
    ];

    /**
     * Parent route hierarchy for breadcrumb trail building.
     * Maps a route name to its parent route name for automatic chain building.
     *
     * @var array<string, string>
     */
    protected array $breadcrumbParents = [
        'core.unit-bisnis.create' => 'core.unit-bisnis.index',
        'core.unit-bisnis.show' => 'core.unit-bisnis.index',
        'core.unit-bisnis.edit' => 'core.unit-bisnis.index',
        'core.proyek.create' => 'core.proyek.index',
        'core.proyek.show' => 'core.proyek.index',
        'core.proyek.edit' => 'core.proyek.index',
        'core.titik.index' => 'core.proyek.index',
        'core.titik.create' => 'core.titik.index',
        'core.titik.show' => 'core.titik.index',
        'core.titik.edit' => 'core.titik.index',
        'core.rab.index' => 'core.proyek.index',
        'core.rab.create' => 'core.rab.index',
        'core.rab.show' => 'core.rab.index',
        'core.rab.edit' => 'core.rab.index',
        'core.rab.realisasi' => 'core.rab.index',
        'core.rab.compare' => 'core.rab.index',

        'procurement.bahan-baku.create' => 'procurement.bahan-baku.index',
        'procurement.bahan-baku.show' => 'procurement.bahan-baku.index',
        'procurement.bahan-baku.edit' => 'procurement.bahan-baku.index',
        'procurement.bahan-baku.stok' => 'procurement.bahan-baku.index',
        'procurement.supplier.create' => 'procurement.supplier.index',
        'procurement.supplier.show' => 'procurement.supplier.index',
        'procurement.supplier.edit' => 'procurement.supplier.index',
        'procurement.purchase-orders.create' => 'procurement.purchase-orders.index',
        'procurement.purchase-orders.show' => 'procurement.purchase-orders.index',
        'procurement.purchase-orders.edit' => 'procurement.purchase-orders.index',
        'procurement.purchase-orders.payment' => 'procurement.purchase-orders.index',
        'procurement.purchase-orders.approval-queue' => 'procurement.purchase-orders.index',
        'procurement.pembayaran.show' => 'procurement.pembayaran.index',

        'fleet.armada.create' => 'fleet.armada.index',
        'fleet.armada.show' => 'fleet.armada.index',
        'fleet.armada.edit' => 'fleet.armada.index',
        'fleet.ritase.create' => 'fleet.ritase.index',
        'fleet.ritase.show' => 'fleet.ritase.index',
        'fleet.ritase.edit' => 'fleet.ritase.index',
        'fleet.ritase.report-harian' => 'fleet.ritase.index',
        'fleet.ritase.report-mingguan' => 'fleet.ritase.index',
        'fleet.sewa-alat.create' => 'fleet.sewa-alat.index',
        'fleet.sewa-alat.show' => 'fleet.sewa-alat.index',
        'fleet.sewa-alat.edit' => 'fleet.sewa-alat.index',
        'fleet.sewa-alat.report-mingguan' => 'fleet.sewa-alat.index',
        'fleet.rute-tarif.create' => 'fleet.rute-tarif.index',
        'fleet.rute-tarif.show' => 'fleet.rute-tarif.index',
        'fleet.rute-tarif.edit' => 'fleet.rute-tarif.index',

        'production.mesin.create' => 'production.mesin.index',
        'production.mesin.show' => 'production.mesin.index',
        'production.mesin.edit' => 'production.mesin.index',
        'production.produk.create' => 'production.produk.index',
        'production.produk.show' => 'production.produk.index',
        'production.produk.edit' => 'production.produk.index',
        'production.resep.index' => 'production.produk.index',
        'production.resep.create' => 'production.resep.index',
        'production.resep.edit' => 'production.resep.index',
        'production.mix-design.create' => 'production.mix-design.index',
        'production.mix-design.show' => 'production.mix-design.index',
        'production.mix-design.edit' => 'production.mix-design.index',
        'production.sessions.active' => 'production.sessions.index',
        'production.sessions.create' => 'production.sessions.index',
        'production.sessions.show' => 'production.sessions.index',
        'production.sessions.edit' => 'production.sessions.index',
        'production.sessions.report-harian' => 'production.sessions.index',
        'production.qc.pending' => 'production.sessions.index',
        'production.pengiriman.today' => 'production.pengiriman.index',
        'production.pengiriman.create' => 'production.pengiriman.index',
        'production.pengiriman.show' => 'production.pengiriman.index',
        'production.pengiriman.edit' => 'production.pengiriman.index',

        'hr.karyawan.create' => 'hr.karyawan.index',
        'hr.karyawan.show' => 'hr.karyawan.index',
        'hr.karyawan.edit' => 'hr.karyawan.index',
        'hr.payroll.show' => 'hr.payroll.index',
        'hr.payroll.review' => 'hr.payroll.index',

        'finance.akun-kas.create' => 'finance.akun-kas.index',
        'finance.akun-kas.show' => 'finance.akun-kas.index',
        'finance.akun-kas.edit' => 'finance.akun-kas.index',
        'finance.akun-kas.mutasi' => 'finance.akun-kas.index',
        'finance.mutasi-kas.report' => 'finance.mutasi-kas.index',
        'finance.transfer-kas.create' => 'finance.transfer-kas.index',
        'finance.transfer-kas.show' => 'finance.transfer-kas.index',
        'finance.invoice.create' => 'finance.invoice.index',
        'finance.invoice.show' => 'finance.invoice.index',
        'finance.invoice.edit' => 'finance.invoice.index',
        'finance.invoice.outstanding' => 'finance.invoice.index',
        'finance.invoice.aging' => 'finance.invoice.index',
        'finance.laporan-keuangan.rab-realisasi' => 'finance.laporan-keuangan.index',
        'finance.laporan-keuangan.laba-rugi' => 'finance.laporan-keuangan.index',

        'kontraktor.proyek.detail' => 'kontraktor.dashboard',
        'kontraktor.proyek.produksi' => 'kontraktor.proyek.detail',
        'kontraktor.proyek.invoice' => 'kontraktor.proyek.detail',

        'audit.logs.show' => 'audit.logs.index',

        'users.create' => 'users.index',
        'users.edit' => 'users.index',
    ];

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'breadcrumbs' => $this->generateBreadcrumbs($request),
        ];
    }

    /**
     * Build breadcrumb chain automatically from the current route.
     *
     * @return array<int, array{label: string, href: string|null}>
     */
    protected function generateBreadcrumbs(Request $request): array
    {
        $currentRoute = $request->route()?->getName();
        if (! $currentRoute) {
            return [];
        }

        $crumbs = [];
        $visited = [];
        $routeName = $currentRoute;

        // Walk up the parent chain to build the trail (oldest first)
        while ($routeName && ! isset($visited[$routeName])) {
            $visited[$routeName] = true;
            $label = $this->breadcrumbMap[$routeName] ?? $this->fallbackLabel($routeName);

            try {
                $href = route($routeName, $request->route()?->parameters() ?? []);
            } catch (\Throwable $e) {
                $href = null;
            }

            // Current page (first iteration) gets href = null
            if ($routeName === $currentRoute) {
                $crumbs[] = ['label' => $label, 'href' => null];
            } else {
                $crumbs[] = ['label' => $label, 'href' => $href];
            }

            $routeName = $this->breadcrumbParents[$routeName] ?? null;
        }

        // Put oldest first (Dashboard should appear first)
        return array_reverse($crumbs);
    }

    /**
     * Fallback label generator when route is not mapped.
     */
    protected function fallbackLabel(string $routeName): string
    {
        $parts = explode('.', $routeName);
        $parts = array_slice($parts, -2);
        $label = implode(' ', $parts);

        return ucwords(str_replace(['-', '_'], ' ', $label));
    }
}
