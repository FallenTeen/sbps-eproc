import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    FolderKanban,
    ShoppingCart,
    Truck,
    Factory,
    Users,
    Wallet,
    ClipboardList,
    Layers,
    ChevronDown,
    ChevronRight,
    Building2,
    ShieldCheck,
    Wrench,
    MessageSquare,
    DollarSign,
    Package,
} from 'lucide-react';

// =========================================================================
// MENU CONFIGURATION BY ROLE (Max 2 Levels)
// =========================================================================

const MENU_CONFIG = {
    Owner: [
        {
            title: 'Dashboard Owner',
            icon: LayoutDashboard,
            href: route('owner.dashboard'),
            routeName: 'owner.dashboard',
        },
        {
            title: 'Proyek & RAB',
            icon: FolderKanban,
            items: [
                { title: 'Daftar Proyek', href: route('core.proyek.index'), routeName: 'core.proyek.*' },
                { title: 'RAB Proyek', href: route('core.rab.index'), routeName: 'core.rab.*' },
            ],
        },
        {
            title: 'Procurement',
            icon: ShoppingCart,
            items: [
                { title: 'Purchase Orders', href: route('procurement.purchase-orders.index'), routeName: 'procurement.purchase-orders.*' },
                { title: 'Stok Bahan Baku', href: route('procurement.stok.index'), routeName: 'procurement.stok.*' },
                { title: 'Daftar Supplier', href: route('procurement.suppliers.index'), routeName: 'procurement.suppliers.*' },
            ],
        },
        {
            title: 'Manajemen Aset',
            icon: Truck,
            items: [
                { title: 'Armada (GCS)', href: route('fleet.armada.index'), routeName: 'fleet.armada.*' },
                { title: 'Mesin Produksi', href: route('production.mesin.index'), routeName: 'production.mesin.*' },
            ],
        },
        {
            title: 'Produksi (CBP/AMP)',
            icon: Factory,
            items: [
                { title: 'Dashboard Produksi', href: route('production.dashboard'), routeName: 'production.dashboard' },
                { title: 'Sesi Produksi', href: route('production.sessions.index'), routeName: 'production.sessions.*' },
                { title: 'Mix Design (BOM)', href: route('production.mix-design.index'), routeName: 'production.mix-design.*' },
                { title: 'QC Samples', href: route('production.qc.index'), routeName: 'production.qc.*' },
                { title: 'Pengiriman', href: route('production.pengiriman.index'), routeName: 'production.pengiriman.*' },
            ],
        },
        {
            title: 'SDM & Presensi',
            icon: Users,
            items: [
                { title: 'Data Karyawan', href: route('hr.karyawan.index'), routeName: 'hr.karyawan.*' },
                { title: 'Presensi', href: route('hr.presensi.index'), routeName: 'hr.presensi.*' },
                { title: 'Pengajuan Cuti', href: route('hr.cuti.index'), routeName: 'hr.cuti.*' },
                { title: 'Payroll', href: route('hr.payroll.index'), routeName: 'hr.payroll.*' },
            ],
        },
        {
            title: 'Keuangan & Kas',
            icon: Wallet,
            items: [
                { title: 'Kas & Bank', href: route('finance.akun-kas.index'), routeName: 'finance.akun-kas.*' },
                { title: 'Daftar Invoice', href: route('finance.invoices.index'), routeName: 'finance.invoices.*' },
                { title: 'Piutang Klien', href: route('finance.pembayaran.outstanding'), routeName: 'finance.pembayaran.*' },
                { title: 'Laporan Keuangan', href: route('finance.laporan-keuangan.index'), routeName: 'finance.laporan-keuangan.*' },
            ],
        },
    ],

    'Admin Keuangan': [
        {
            title: 'Dashboard Keuangan',
            icon: LayoutDashboard,
            href: route('finance.dashboard'),
            routeName: 'finance.dashboard',
        },
        {
            title: 'Keuangan & Kas',
            icon: Wallet,
            items: [
                { title: 'Kas & Bank', href: route('finance.akun-kas.index'), routeName: 'finance.akun-kas.*' },
                { title: 'Daftar Invoice', href: route('finance.invoices.index'), routeName: 'finance.invoices.*' },
                { title: 'Piutang Outstanding', href: route('finance.pembayaran.outstanding'), routeName: 'finance.pembayaran.*' },
                { title: 'Laporan Konsolidasi', href: route('finance.laporan-keuangan.index'), routeName: 'finance.laporan-keuangan.*' },
            ],
        },
        {
            title: 'Procurement (Payment)',
            icon: ShoppingCart,
            items: [
                { title: 'PO Approval & Payment', href: route('procurement.purchase-orders.index'), routeName: 'procurement.purchase-orders.*' },
                { title: 'Daftar Supplier', href: route('procurement.suppliers.index'), routeName: 'procurement.suppliers.*' },
            ],
        },
        {
            title: 'Proyek & RAB (View)',
            icon: FolderKanban,
            items: [
                { title: 'Monitoring Proyek', href: route('core.proyek.index'), routeName: 'core.proyek.*' },
                { title: 'Ringkasan RAB', href: route('core.rab.index'), routeName: 'core.rab.*' },
            ],
        },
    ],

    'Koordinator Procurement': [
        {
            title: 'Dashboard Procurement',
            icon: LayoutDashboard,
            href: route('procurement.dashboard'),
            routeName: 'procurement.dashboard',
        },
        {
            title: 'Procurement',
            icon: ShoppingCart,
            items: [
                { title: 'Purchase Orders', href: route('procurement.purchase-orders.index'), routeName: 'procurement.purchase-orders.*' },
                { title: 'Stok Mutasi', href: route('procurement.stok.index'), routeName: 'procurement.stok.*' },
                { title: 'Master Supplier', href: route('procurement.suppliers.index'), routeName: 'procurement.suppliers.*' },
                { title: 'Bahan Baku & Price List', href: route('procurement.bahan-baku.index'), routeName: 'procurement.bahan-baku.*' },
            ],
        },
    ],

    'Ketua Divisi Finance': [
        {
            title: 'Dashboard Divisi',
            icon: LayoutDashboard,
            href: route('finance.dashboard'),
            routeName: 'finance.dashboard',
        },
        {
            title: 'Keuangan Divisi',
            icon: Wallet,
            items: [
                { title: 'Kas & Bank Divisi', href: route('finance.akun-kas.index'), routeName: 'finance.akun-kas.*' },
                { title: 'Invoice Divisi', href: route('finance.invoices.index'), routeName: 'finance.invoices.*' },
                { title: 'Laporan Keuangan', href: route('finance.laporan-keuangan.index'), routeName: 'finance.laporan-keuangan.*' },
            ],
        },
        {
            title: 'Procurement Approval (≤ 50jt)',
            icon: ShoppingCart,
            href: route('procurement.purchase-orders.index'),
            routeName: 'procurement.purchase-orders.*',
        },
        {
            title: 'Proyek (View)',
            icon: FolderKanban,
            href: route('core.proyek.index'),
            routeName: 'core.proyek.*',
        },
    ],

    'Ketua Divisi Armada': [
        {
            title: 'Dashboard Fleet',
            icon: LayoutDashboard,
            href: route('fleet.dashboard'),
            routeName: 'fleet.dashboard',
        },
        {
            title: 'Manajemen Armada',
            icon: Truck,
            items: [
                { title: 'Daftar Armada', href: route('fleet.armada.index'), routeName: 'fleet.armada.*' },
                { title: 'Jadwal Servis', href: route('fleet.armada.index', { status: 'servis' }), routeName: 'fleet.armada.service' },
            ],
        },
        {
            title: 'Ops Ritase & Sewa',
            icon: Layers,
            items: [
                { title: 'Log Ritase', href: route('fleet.ritase.index'), routeName: 'fleet.ritase.*' },
                { title: 'Sewa Alat Jam', href: route('fleet.sewa-alat.index'), routeName: 'fleet.sewa-alat.*' },
            ],
        },
        {
            title: 'Procurement Sparepart (≤ 25jt)',
            icon: ShoppingCart,
            href: route('procurement.purchase-orders.index'),
            routeName: 'procurement.purchase-orders.*',
        },
    ],

    'Ketua Divisi Kontraktor': [
        {
            title: 'Dashboard Kontraktor',
            icon: LayoutDashboard,
            href: route('core.dashboard'),
            routeName: 'core.dashboard',
        },
        {
            title: 'Proyek & RAB',
            icon: FolderKanban,
            items: [
                { title: 'Proyek Kontrak', href: route('core.proyek.index'), routeName: 'core.proyek.*' },
                { title: 'RAB & Realisasi', href: route('core.rab.index'), routeName: 'core.rab.*' },
            ],
        },
        {
            title: 'SDM & Lapangan',
            icon: Users,
            items: [
                { title: 'Karyawan Proyek', href: route('hr.karyawan.index'), routeName: 'hr.karyawan.*' },
                { title: 'Presensi & Overtime', href: route('hr.presensi.index'), routeName: 'hr.presensi.*' },
            ],
        },
        {
            title: 'Procurement (≤ 30jt)',
            icon: ShoppingCart,
            href: route('procurement.purchase-orders.index'),
            routeName: 'procurement.purchase-orders.*',
        },
    ],

    'Ketua Divisi Produksi CBP': [
        {
            title: 'Dashboard Produksi CBP',
            icon: LayoutDashboard,
            href: route('production.dashboard'),
            routeName: 'production.dashboard',
        },
        {
            title: 'Produksi CBP',
            icon: Factory,
            items: [
                { title: 'Sesi Produksi', href: route('production.sessions.index'), routeName: 'production.sessions.*' },
                { title: 'Mix Design (BOM)', href: route('production.mix-design.index'), routeName: 'production.mix-design.*' },
                { title: 'Uji QC Sample', href: route('production.qc.index'), routeName: 'production.qc.*' },
                { title: 'Pengiriman Molen', href: route('production.pengiriman.index'), routeName: 'production.pengiriman.*' },
            ],
        },
        {
            title: 'Mesin Batching Plant',
            icon: Wrench,
            href: route('production.mesin.index'),
            routeName: 'production.mesin.*',
        },
        {
            title: 'Stok & Procurement (≤ 20jt)',
            icon: ShoppingCart,
            items: [
                { title: 'Stok Bahan Baku', href: route('procurement.stok.index'), routeName: 'procurement.stok.*' },
                { title: 'Purchase Orders', href: route('procurement.purchase-orders.index'), routeName: 'procurement.purchase-orders.*' },
            ],
        },
    ],

    'Ketua Divisi Produksi AMP': [
        {
            title: 'Dashboard Produksi AMP',
            icon: LayoutDashboard,
            href: route('production.dashboard'),
            routeName: 'production.dashboard',
        },
        {
            title: 'Produksi AMP (Hotmix)',
            icon: Factory,
            items: [
                { title: 'Sesi Produksi Hotmix', href: route('production.sessions.index'), routeName: 'production.sessions.*' },
                { title: 'Mix Design AMP', href: route('production.mix-design.index'), routeName: 'production.mix-design.*' },
                { title: 'QC Hotmix', href: route('production.qc.index'), routeName: 'production.qc.*' },
            ],
        },
        {
            title: 'Mesin AMP',
            icon: Wrench,
            href: route('production.mesin.index'),
            routeName: 'production.mesin.*',
        },
        {
            title: 'Stok Bitumen & Agg',
            icon: Package,
            href: route('procurement.stok.index'),
            routeName: 'procurement.stok.*',
        },
    ],

    'Mandor Proyek': [
        {
            title: 'Dashboard Lapangan',
            icon: LayoutDashboard,
            href: route('dashboard'),
            routeName: 'dashboard',
        },
        {
            title: 'Proyek & RAB (View)',
            icon: FolderKanban,
            href: route('core.proyek.index'),
            routeName: 'core.proyek.*',
        },
        {
            title: 'Review Presensi & Cuti',
            icon: Users,
            items: [
                { title: 'Presensi Karyawan', href: route('hr.presensi.index'), routeName: 'hr.presensi.*' },
                { title: 'Pengajuan Cuti', href: route('hr.cuti.index'), routeName: 'hr.cuti.*' },
            ],
        },
        {
            title: 'Produksi Sesi',
            icon: Factory,
            href: route('production.sessions.index'),
            routeName: 'production.sessions.*',
        },
    ],

    'Kontraktor': [
        {
            title: 'Portal Kontraktor',
            icon: LayoutDashboard,
            href: route('kontraktor.dashboard'),
            routeName: 'kontraktor.dashboard',
        },
        {
            title: 'Daftar Invoice (Read-only)',
            icon: DollarSign,
            href: route('kontraktor.invoices.index'),
            routeName: 'kontraktor.invoices.*',
        },
        {
            title: 'Log Komunikasi',
            icon: MessageSquare,
            href: route('kontraktor.log-komunikasi.index'),
            routeName: 'kontraktor.log-komunikasi.*',
        },
    ],
};

// =========================================================================
// SIDEBAR COMPONENT IMPLEMENTATION
// =========================================================================

export default function Sidebar({ user, activeRole, onRoleSwitch, isOpen, onClose }) {
    const roles = user?.roles?.map((r) => r.name) || [user?.role || 'Owner'];
    const currentRole = activeRole || roles[0] || 'Owner';

    // Get menu list for active role (fallback to Owner)
    const menuList = MENU_CONFIG[currentRole] || MENU_CONFIG['Owner'] || [];

    // Submenu collapse state
    const [openSubmenu, setOpenSubmenu] = useState({});

    const toggleSubmenu = (title) => {
        setOpenSubmenu((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    const isRouteActive = (pattern) => {
        if (!pattern) return false;
        try {
            if (pattern.endsWith('.*')) {
                const prefix = pattern.replace('.*', '');
                return route().current().startsWith(prefix);
            }
            return route().current(pattern);
        } catch (e) {
            return false;
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-64 transform bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } flex flex-col shadow-xl`}
            >
                {/* Header: Brand & Unit Bisnis */}
                <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-md">
                            S
                        </div>
                        <div>
                            <span className="text-base font-bold tracking-tight text-white">SBPS System</span>
                            <span className="block text-xs text-slate-400">Multi-Unit Bisnis v5</span>
                        </div>
                    </Link>
                </div>

                {/* Role Switcher Section */}
                <div className="border-b border-slate-800 bg-slate-950/60 p-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Role Aktif
                    </label>
                    {roles.length > 1 ? (
                        <div className="relative">
                            <select
                                value={currentRole}
                                onChange={(e) => onRoleSwitch && onRoleSwitch(e.target.value)}
                                className="w-full rounded-md border border-slate-700 bg-slate-800 py-1.5 pl-2.5 pr-8 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {roles.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-800/80 px-2.5 py-1.5">
                            <span className="text-xs font-semibold text-indigo-300">{currentRole}</span>
                            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                    )}
                </div>

                {/* Navigation Menu Links */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {menuList.map((item, idx) => {
                        const Icon = item.icon || Building2;
                        const hasSub = item.items && item.items.length > 0;
                        const isSubOpen = openSubmenu[item.title] ?? item.items?.some((sub) => isRouteActive(sub.routeName));
                        const active = !hasSub ? isRouteActive(item.routeName) : item.items.some((sub) => isRouteActive(sub.routeName));

                        return (
                            <div key={idx} className="space-y-0.5">
                                {!hasSub ? (
                                    <Link
                                        href={item.href}
                                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                                            active
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                                        <span>{item.title}</span>
                                    </Link>
                                ) : (
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => toggleSubmenu(item.title)}
                                            className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                                                active
                                                    ? 'bg-slate-800 text-indigo-300 font-semibold'
                                                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                                                <span>{item.title}</span>
                                            </div>
                                            {isSubOpen ? (
                                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                                            )}
                                        </button>

                                        {/* Submenu Level 2 */}
                                        {isSubOpen && (
                                            <div className="mt-1 ml-4 border-l border-slate-800 pl-3 space-y-1">
                                                {item.items.map((sub, sIdx) => {
                                                    const subActive = isRouteActive(sub.routeName);
                                                    return (
                                                        <Link
                                                            key={sIdx}
                                                            href={sub.href}
                                                            className={`block rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                                                subActive
                                                                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500'
                                                                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                                                            }`}
                                                        >
                                                            {sub.title}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer User Info */}
                <div className="border-t border-slate-800 bg-slate-950 p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 font-bold text-xs text-indigo-400">
                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div className="truncate text-xs">
                            <div className="font-semibold text-slate-200 truncate">{user?.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
