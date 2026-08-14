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
    const menuList = getMenuConfig(currentRole);
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
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-64 transform bg-white text-ink.DEFAULT transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } flex flex-col border-r-2 border-black shadow-bw-lg`}
            >
                <div className="flex h-16 items-center justify-between border-b-2 border-black bg-black px-4">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black font-bold text-sm border-2 border-white">
                            S
                        </div>
                        <div>
                            <span className="text-base font-black tracking-tight text-white">SBPS System</span>
                            <span className="block text-[10px] font-semibold text-white/70">Multi-Unit Bisnis v5</span>
                        </div>
                    </Link>
                </div>

                <div className="border-b-2 border-black bg-surface-muted p-3">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-ink-secondary mb-1.5">
                        Role Aktif
                    </label>
                    {roles.length > 1 ? (
                        <div className="relative">
                            <select
                                value={currentRole}
                                onChange={(e) => onRoleSwitch && onRoleSwitch(e.target.value)}
                                className="w-full rounded-none border-2 border-black bg-white py-2 pl-3 pr-10 text-xs font-bold text-ink.DEFAULT focus:border-black focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer"
                            >
                                {roles.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between border-2 border-black bg-white px-3 py-2">
                            <span className="text-xs font-black text-ink.DEFAULT">{currentRole}</span>
                            <ShieldCheck className="h-4 w-4 text-ink.DEFAULT" />
                        </div>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {menuList.map((item, idx) => {
                        const Icon = item.icon || Building2;
                        const hasSub = item.items && item.items.length > 0;
                        const isSubOpen = openSubmenu[item.title] ?? item.items?.some((sub) => isRouteActive(sub.routeName));
                        const active = !hasSub ? isRouteActive(item.routeName) : item.items.some((sub) => isRouteActive(sub.routeName));

                        return (
                            <div key={idx} className="space-y-1">
                                {!hasSub ? (
                                    <Link
                                        href={item.href}
                                        className={`group flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all border-2 ${
                                            active
                                                ? 'bg-black text-white border-black shadow-bw'
                                                : 'bg-white text-ink.DEFAULT border-transparent hover:border-black hover:bg-surface-muted'
                                        }`}
                                    >
                                        <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-white' : 'text-ink.DEFAULT group-hover:text-black'}`} />
                                        <span>{item.title}</span>
                                    </Link>
                                ) : (
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => toggleSubmenu(item.title)}
                                            className={`group flex w-full items-center justify-between px-3 py-2.5 text-xs font-bold transition-all border-2 ${
                                                active
                                                    ? 'bg-white text-ink.DEFAULT border-black shadow-bw-sm font-black'
                                                    : 'bg-white text-ink.DEFAULT border-transparent hover:border-black hover:bg-surface-muted'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-4.5 w-4.5 shrink-0 text-ink.DEFAULT" />
                                                <span>{item.title}</span>
                                            </div>
                                            {isSubOpen ? (
                                                <ChevronDown className="h-4 w-4 text-ink.DEFAULT" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-ink.DEFAULT" />
                                            )}
                                        </button>

                                        {isSubOpen && (
                                            <div className="mt-1 ml-4 border-l-2 border-black pl-3 space-y-1">
                                                {item.items.map((sub, sIdx) => {
                                                    const subActive = isRouteActive(sub.routeName);
                                                    return (
                                                        <Link
                                                            key={sIdx}
                                                            href={sub.href}
                                                            className={`block px-2.5 py-2 text-[11px] font-bold transition-all border-2 -ml-[1px] ${
                                                                subActive
                                                                    ? 'bg-black text-white border-black'
                                                                    : 'bg-white text-ink.DEFAULT border-transparent hover:border-black hover:bg-surface-muted'
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

                <div className="border-t-2 border-black bg-black p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-none bg-white text-black font-black text-sm border-2 border-white">
                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div className="truncate text-xs flex-1 min-w-0">
                            <div className="font-black text-white truncate">{user?.name}</div>
                            <div className="text-[10px] text-white/70 truncate">{user?.email}</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
