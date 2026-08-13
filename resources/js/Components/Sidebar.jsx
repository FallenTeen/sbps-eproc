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

/**
 * Safe wrapper for Ziggy route helper to prevent runtime crashes when a route name is missing or mismatched.
 */
function safeRoute(name, params = {}, fallback = '/dashboard') {
    try {
        if (typeof route === 'function' && route().has(name)) {
            return route(name, params);
        }
    } catch (e) {
        console.warn(`[Ziggy SafeRoute] Route "${name}" not found, using fallback: ${fallback}`);
    }
    return fallback;
}

/**
 * Dynamic menu builder based on user active role.
 * Uses safeRoute helper to avoid top-level Ziggy crashes.
 */
function getMenuConfig(currentRole) {
    const menus = {
        Owner: [
            {
                title: 'Dashboard Utama',
                icon: LayoutDashboard,
                href: safeRoute('dashboard', {}, '/dashboard'),
                routeName: 'dashboard',
            },
            {
                title: 'Proyek & RAB',
                icon: FolderKanban,
                items: [
                    { title: 'Daftar Proyek', href: safeRoute('core.proyek.index', {}, '/core/proyek'), routeName: 'core.proyek.*' },
                    { title: 'Titik Lokasi', href: safeRoute('core.proyek.index', {}, '/core/proyek'), routeName: 'core.titik.*' },
                ],
            },
            {
                title: 'Procurement',
                icon: ShoppingCart,
                items: [
                    { title: 'Purchase Orders', href: safeRoute('procurement.purchase-orders.index', {}, '/procurement/purchase-orders'), routeName: 'procurement.purchase-orders.*' },
                    { title: 'Bahan Baku & Price List', href: safeRoute('procurement.bahan-baku.index', {}, '/procurement/bahan-baku'), routeName: 'procurement.bahan-baku.*' },
                    { title: 'Daftar Supplier', href: safeRoute('procurement.supplier.index', {}, '/procurement/supplier'), routeName: 'procurement.supplier.*' },
                ],
            },
            {
                title: 'Manajemen Aset (Fleet)',
                icon: Truck,
                items: [
                    { title: 'Armada (GCS)', href: safeRoute('fleet.armada.index', {}, '/fleet/armada'), routeName: 'fleet.armada.*' },
                    { title: 'Log Ritase Harian', href: safeRoute('fleet.ritase.index', {}, '/fleet/ritase'), routeName: 'fleet.ritase.*' },
                    { title: 'Sewa Alat Jam (HM)', href: safeRoute('fleet.sewa-alat.index', {}, '/fleet/sewa-alat'), routeName: 'fleet.sewa-alat.*' },
                    { title: 'Mesin Produksi', href: safeRoute('production.mesin.index', {}, '/production/mesin'), routeName: 'production.mesin.*' },
                ],
            },
            {
                title: 'Produksi (CBP/AMP)',
                icon: Factory,
                items: [
                    { title: 'Dashboard Produksi', href: safeRoute('production.dashboard', {}, '/production/dashboard'), routeName: 'production.dashboard' },
                    { title: 'Sesi Produksi', href: safeRoute('production.sessions.index', {}, '/production/sessions'), routeName: 'production.sessions.*' },
                    { title: 'Mix Design (BOM)', href: safeRoute('production.mix-design.index', {}, '/production/mix-design'), routeName: 'production.mix-design.*' },
                    { title: 'Pengiriman Molen', href: safeRoute('production.pengiriman.index', {}, '/production/pengiriman'), routeName: 'production.pengiriman.*' },
                ],
            },
            {
                title: 'SDM & Payroll',
                icon: Users,
                items: [
                    { title: 'Data Karyawan', href: safeRoute('hr.karyawan.index', {}, '/hr/karyawan'), routeName: 'hr.karyawan.*' },
                    { title: 'Pengajuan Cuti', href: safeRoute('hr.cuti.index', {}, '/hr/cuti'), routeName: 'hr.cuti.*' },
                    { title: 'Payroll 3-Skema', href: safeRoute('hr.payroll.index', {}, '/hr/payroll'), routeName: 'hr.payroll.*' },
                ],
            },
            {
                title: 'Keuangan & Invoice',
                icon: Wallet,
                items: [
                    { title: 'Kas & Bank', href: safeRoute('finance.akun-kas.index', {}, '/finance/akun-kas'), routeName: 'finance.akun-kas.*' },
                    { title: 'Daftar Invoice', href: safeRoute('finance.invoice.index', {}, '/finance/invoice'), routeName: 'finance.invoice.*' },
                    { title: 'Piutang Klien', href: safeRoute('finance.invoice.outstanding', {}, '/finance/invoice/outstanding'), routeName: 'finance.invoice.outstanding' },
                    { title: 'Laporan Konsolidasi', href: safeRoute('finance.laporan-keuangan.index', {}, '/finance/laporan-keuangan'), routeName: 'finance.laporan-keuangan.*' },
                ],
            },
        ],

        'Admin Keuangan': [
            {
                title: 'Dashboard Keuangan',
                icon: LayoutDashboard,
                href: safeRoute('finance.laporan-keuangan.index', {}, '/finance/laporan-keuangan'),
                routeName: 'finance.*',
            },
            {
                title: 'Keuangan & Kas',
                icon: Wallet,
                items: [
                    { title: 'Kas & Bank', href: safeRoute('finance.akun-kas.index', {}, '/finance/akun-kas'), routeName: 'finance.akun-kas.*' },
                    { title: 'Daftar Invoice', href: safeRoute('finance.invoice.index', {}, '/finance/invoice'), routeName: 'finance.invoice.*' },
                    { title: 'Piutang Outstanding', href: safeRoute('finance.invoice.outstanding', {}, '/finance/invoice/outstanding'), routeName: 'finance.invoice.outstanding' },
                    { title: 'Laporan Konsolidasi', href: safeRoute('finance.laporan-keuangan.index', {}, '/finance/laporan-keuangan'), routeName: 'finance.laporan-keuangan.*' },
                ],
            },
            {
                title: 'Procurement (Payment)',
                icon: ShoppingCart,
                items: [
                    { title: 'PO Approval & Payment', href: safeRoute('procurement.purchase-orders.index', {}, '/procurement/purchase-orders'), routeName: 'procurement.purchase-orders.*' },
                    { title: 'Daftar Supplier', href: safeRoute('procurement.supplier.index', {}, '/procurement/supplier'), routeName: 'procurement.supplier.*' },
                ],
            },
            {
                title: 'Proyek & RAB (View)',
                icon: FolderKanban,
                href: safeRoute('core.proyek.index', {}, '/core/proyek'),
                routeName: 'core.proyek.*',
            },
        ],

        'Koordinator Procurement': [
            {
                title: 'Dashboard Procurement',
                icon: LayoutDashboard,
                href: safeRoute('procurement.purchase-orders.index', {}, '/procurement/purchase-orders'),
                routeName: 'procurement.*',
            },
            {
                title: 'Procurement',
                icon: ShoppingCart,
                items: [
                    { title: 'Purchase Orders', href: safeRoute('procurement.purchase-orders.index', {}, '/procurement/purchase-orders'), routeName: 'procurement.purchase-orders.*' },
                    { title: 'Bahan Baku & Price List', href: safeRoute('procurement.bahan-baku.index', {}, '/procurement/bahan-baku'), routeName: 'procurement.bahan-baku.*' },
                    { title: 'Master Supplier', href: safeRoute('procurement.supplier.index', {}, '/procurement/supplier'), routeName: 'procurement.supplier.*' },
                ],
            },
        ],

        'Ketua Divisi Finance': [
            {
                title: 'Dashboard Keuangan',
                icon: LayoutDashboard,
                href: safeRoute('finance.laporan-keuangan.index', {}, '/finance/laporan-keuangan'),
                routeName: 'finance.*',
            },
            {
                title: 'Keuangan Divisi',
                icon: Wallet,
                items: [
                    { title: 'Kas & Bank Divisi', href: safeRoute('finance.akun-kas.index', {}, '/finance/akun-kas'), routeName: 'finance.akun-kas.*' },
                    { title: 'Invoice Divisi', href: safeRoute('finance.invoice.index', {}, '/finance/invoice'), routeName: 'finance.invoice.*' },
                    { title: 'Laporan Keuangan', href: safeRoute('finance.laporan-keuangan.index', {}, '/finance/laporan-keuangan'), routeName: 'finance.laporan-keuangan.*' },
                ],
            },
            {
                title: 'Procurement Approval (≤ 50jt)',
                icon: ShoppingCart,
                href: safeRoute('procurement.purchase-orders.index', {}, '/procurement/purchase-orders'),
                routeName: 'procurement.purchase-orders.*',
            },
            {
                title: 'Proyek (View)',
                icon: FolderKanban,
                href: safeRoute('core.proyek.index', {}, '/core/proyek'),
                routeName: 'core.proyek.*',
            },
        ],

        'Ketua Divisi Armada': [
            {
                title: 'Dashboard Fleet',
                icon: LayoutDashboard,
                href: safeRoute('fleet.armada.index', {}, '/fleet/armada'),
                routeName: 'fleet.*',
            },
            {
                title: 'Manajemen Armada',
                icon: Truck,
                items: [
                    { title: 'Daftar Armada', href: safeRoute('fleet.armada.index', {}, '/fleet/armada'), routeName: 'fleet.armada.*' },
                    { title: 'Log Ritase Harian', href: safeRoute('fleet.ritase.index', {}, '/fleet/ritase'), routeName: 'fleet.ritase.*' },
                    { title: 'Sewa Alat Jam (HM)', href: safeRoute('fleet.sewa-alat.index', {}, '/fleet/sewa-alat'), routeName: 'fleet.sewa-alat.*' },
                ],
            },
            {
                title: 'Procurement Sparepart (≤ 25jt)',
                icon: ShoppingCart,
                href: safeRoute('procurement.purchase-orders.index', {}, '/procurement/purchase-orders'),
                routeName: 'procurement.purchase-orders.*',
            },
        ],

        'Ketua Divisi Kontraktor': [
            {
                title: 'Dashboard Proyek',
                icon: LayoutDashboard,
                href: safeRoute('core.proyek.index', {}, '/core/proyek'),
                routeName: 'core.*',
            },
            {
                title: 'Proyek & RAB',
                icon: FolderKanban,
                items: [
                    { title: 'Proyek Kontrak', href: safeRoute('core.proyek.index', {}, '/core/proyek'), routeName: 'core.proyek.*' },
                ],
            },
            {
                title: 'SDM Proyek',
                icon: Users,
                href: safeRoute('hr.karyawan.index', {}, '/hr/karyawan'),
                routeName: 'hr.karyawan.*',
            },
            {
                title: 'Procurement (≤ 30jt)',
                icon: ShoppingCart,
                href: safeRoute('procurement.purchase-orders.index', {}, '/procurement/purchase-orders'),
                routeName: 'procurement.purchase-orders.*',
            },
        ],

        'Ketua Divisi Produksi CBP': [
            {
                title: 'Dashboard Produksi CBP',
                icon: LayoutDashboard,
                href: safeRoute('production.dashboard', {}, '/production/dashboard'),
                routeName: 'production.dashboard',
            },
            {
                title: 'Produksi CBP',
                icon: Factory,
                items: [
                    { title: 'Sesi Produksi', href: safeRoute('production.sessions.index', {}, '/production/sessions'), routeName: 'production.sessions.*' },
                    { title: 'Mix Design (BOM)', href: safeRoute('production.mix-design.index', {}, '/production/mix-design'), routeName: 'production.mix-design.*' },
                    { title: 'Pengiriman Molen', href: safeRoute('production.pengiriman.index', {}, '/production/pengiriman'), routeName: 'production.pengiriman.*' },
                ],
            },
            {
                title: 'Mesin Batching Plant',
                icon: Wrench,
                href: safeRoute('production.mesin.index', {}, '/production/mesin'),
                routeName: 'production.mesin.*',
            },
            {
                title: 'Procurement (≤ 20jt)',
                icon: ShoppingCart,
                href: safeRoute('procurement.purchase-orders.index', {}, '/procurement/purchase-orders'),
                routeName: 'procurement.purchase-orders.*',
            },
        ],

        'Ketua Divisi Produksi AMP': [
            {
                title: 'Dashboard Produksi AMP',
                icon: LayoutDashboard,
                href: safeRoute('production.dashboard', {}, '/production/dashboard'),
                routeName: 'production.dashboard',
            },
            {
                title: 'Produksi AMP (Hotmix)',
                icon: Factory,
                items: [
                    { title: 'Sesi Produksi Hotmix', href: safeRoute('production.sessions.index', {}, '/production/sessions'), routeName: 'production.sessions.*' },
                    { title: 'Mix Design AMP', href: safeRoute('production.mix-design.index', {}, '/production/mix-design'), routeName: 'production.mix-design.*' },
                ],
            },
            {
                title: 'Mesin AMP',
                icon: Wrench,
                href: safeRoute('production.mesin.index', {}, '/production/mesin'),
                routeName: 'production.mesin.*',
            },
            {
                title: 'Stok Bahan Baku',
                icon: Package,
                href: safeRoute('procurement.bahan-baku.index', {}, '/procurement/bahan-baku'),
                routeName: 'procurement.bahan-baku.*',
            },
        ],

        'Mandor Proyek': [
            {
                title: 'Dashboard Utama',
                icon: LayoutDashboard,
                href: safeRoute('dashboard', {}, '/dashboard'),
                routeName: 'dashboard',
            },
            {
                title: 'Proyek (View)',
                icon: FolderKanban,
                href: safeRoute('core.proyek.index', {}, '/core/proyek'),
                routeName: 'core.proyek.*',
            },
            {
                title: 'Karyawan Proyek',
                icon: Users,
                href: safeRoute('hr.karyawan.index', {}, '/hr/karyawan'),
                routeName: 'hr.karyawan.*',
            },
            {
                title: 'Sesi Produksi',
                icon: Factory,
                href: safeRoute('production.sessions.index', {}, '/production/sessions'),
                routeName: 'production.sessions.*',
            },
        ],

        'Kontraktor': [
            {
                title: 'Portal Kontraktor',
                icon: LayoutDashboard,
                href: safeRoute('kontraktor.dashboard', {}, '/kontraktor/dashboard'),
                routeName: 'kontraktor.*',
            },
        ],
    };

    return menus[currentRole] || menus['Owner'];
}

export default function Sidebar({ user, activeRole, onRoleSwitch, isOpen, onClose }) {
    const roles = user?.roles?.map((r) => r.name) || [user?.role || 'Owner'];
    const currentRole = activeRole || roles[0] || 'Owner';

    // Get dynamic menu list safely inside the render cycle
    const menuList = getMenuConfig(currentRole);

    // Submenu collapse state
    const [openSubmenu, setOpenSubmenu] = useState({});

    const toggleSubmenu = (title) => {
        setOpenSubmenu((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    const isRouteActive = (pattern) => {
        if (!pattern) return false;
        try {
            if (typeof route === 'function') {
                if (pattern.endsWith('.*')) {
                    const prefix = pattern.replace('.*', '');
                    return route().current() ? route().current().startsWith(prefix) : false;
                }
                return route().current(pattern);
            }
        } catch (e) {
            return false;
        }
        return false;
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
