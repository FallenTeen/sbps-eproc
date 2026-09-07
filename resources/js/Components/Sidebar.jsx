import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    FolderKanban,
    ShoppingCart,
    Package,
    Truck,
    Factory,
    Users,
    Wallet,
    ClipboardList,
    ChevronDown,
    ChevronRight,
    Building2,
    ShieldCheck,
    MapPin,
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

/**
 * All possible menu items with required permission(s).
 * permission: string | string[]  — user must have AT LEAST ONE of these.
 * If omitted, item is always shown (e.g. Dashboard).
 */
function getAllMenus() {
    return [
        {
            title: 'Dashboard',
            icon: LayoutDashboard,
            href: safeRoute('dashboard', {}, '/dashboard'),
            routeName: 'dashboard',
        },
        {
            title: 'Proyek & RAB',
            icon: FolderKanban,
            href: safeRoute('core.proyek.index', {}, '/core/proyek'),
            routeName: 'core.proyek.*',
            permission: ['manage proyek', 'view proyek'],
        },
        {
            title: 'Procurement',
            icon: ShoppingCart,
            permission: ['manage procurement', 'view procurement', 'approve procurement', 'manage bahan baku', 'manage supplier'],
            items: [
                { title: 'Purchase Orders', href: safeRoute('procurement.purchase-orders.index', {}, '/procurement/purchase-orders'), routeName: 'procurement.purchase-orders.*', permission: ['manage procurement', 'view procurement', 'approve procurement'] },
                { title: 'Bahan Baku & Price List', href: safeRoute('procurement.bahan-baku.index', {}, '/procurement/bahan-baku'), routeName: 'procurement.bahan-baku.*', permission: ['manage bahan baku', 'view bahan baku'] },
                { title: 'Daftar Supplier', href: safeRoute('procurement.supplier.index', {}, '/procurement/supplier'), routeName: 'procurement.supplier.*', permission: ['manage supplier', 'view supplier'] },
            ],
        },
        {
            title: 'Inventory',
            icon: Package,
            permission: ['manage inventory', 'view inventory', 'manage stok opname', 'view stok opname', 'manage bahan baku', 'view bahan baku'],
            items: [
                { title: 'Dashboard Inventory', href: safeRoute('inventory.dashboard', {}, '/inventory/dashboard'), routeName: 'inventory.dashboard', permission: ['manage inventory', 'view inventory', 'manage stok opname', 'view stok opname', 'manage procurement', 'view procurement'] },
                { title: 'Material & Sparepart', href: safeRoute('procurement.bahan-baku.index', {}, '/procurement/bahan-baku'), routeName: 'procurement.bahan-baku.*', permission: ['manage bahan baku', 'view bahan baku'] },
                { title: 'Stok Opname', href: safeRoute('inventory.stok-opname.index', {}, '/inventory/stok-opname'), routeName: 'inventory.stok-opname.*', permission: ['manage stok opname', 'view stok opname'] },
            ],
        },
        {
            title: 'Manajemen Armada',
            icon: Truck,
            permission: ['manage fleet', 'view fleet'],
            items: [
                { title: 'Armada (GCS)', href: safeRoute('fleet.armada.index', {}, '/fleet/armada'), routeName: 'fleet.armada.*', permission: ['manage fleet', 'view fleet'] },
                { title: 'Log Ritase Harian', href: safeRoute('fleet.ritase.index', {}, '/fleet/ritase'), routeName: 'fleet.ritase.*', permission: ['manage fleet', 'view fleet'] },
                { title: 'Sewa Alat Jam (HM)', href: safeRoute('fleet.sewa-alat.index', {}, '/fleet/sewa-alat'), routeName: 'fleet.sewa-alat.*', permission: ['manage fleet', 'view fleet'] },
                { title: 'Rute Tarif', href: safeRoute('fleet.rute-tarif.index', {}, '/fleet/rute-tarif'), routeName: 'fleet.rute-tarif.*', permission: ['manage fleet', 'view fleet'] },
                { title: 'BBM & Solar', href: safeRoute('fleet.bbm.index', {}, '/fleet/bbm'), routeName: 'fleet.bbm.*', permission: ['manage fleet', 'view fleet'] },
                { title: 'Checklist Harian', href: safeRoute('fleet.checklist-harian.index', {}, '/fleet/checklist-harian'), routeName: 'fleet.checklist-harian.*', permission: ['manage fleet', 'view fleet'] },
                { title: 'Downtime Aktif', href: safeRoute('fleet.downtime.active', {}, '/fleet/downtime/active'), routeName: 'fleet.downtime.*', permission: ['manage fleet', 'view fleet'] },
                { title: 'Servis Armada', href: safeRoute('fleet.servis-armada.index', {}, '/fleet/servis-armada'), routeName: 'fleet.servis-armada.*', permission: ['view fleet service', 'manage fleet service', 'approve fleet service', 'manage sparepart', 'view sparepart', 'manage fleet', 'view fleet'] },
                { title: 'Mesin Produksi', href: safeRoute('production.mesin.index', {}, '/production/mesin'), routeName: 'production.mesin.*', permission: ['manage production cbp', 'manage production amp', 'view production'] },
            ],
        },
        {
            title: 'Produksi (CBP/AMP)',
            icon: Factory,
            permission: ['manage production cbp', 'manage production amp', 'view production', 'start session', 'end session', 'manage qc'],
            items: [
                { title: 'Dashboard Produksi', href: safeRoute('production.dashboard', {}, '/production/dashboard'), routeName: 'production.dashboard', permission: ['manage production cbp', 'manage production amp', 'view production'] },
                { title: 'Sesi Produksi', href: safeRoute('production.sessions.index', {}, '/production/sessions'), routeName: 'production.sessions.*', permission: ['manage production cbp', 'manage production amp', 'view production', 'start session'] },
                { title: 'Mix Design (BOM)', href: safeRoute('production.mix-design.index', {}, '/production/mix-design'), routeName: 'production.mix-design.*', permission: ['manage production cbp', 'manage production amp', 'view production'] },
                { title: 'Pengiriman Armada Transportasi', href: safeRoute('production.pengiriman.index', {}, '/production/pengiriman'), routeName: 'production.pengiriman.*', permission: ['manage production cbp', 'manage production amp', 'view production'] },
                { title: 'QC Samples', href: safeRoute('production.qc.index', {}, '/production/qc'), routeName: 'production.qc.*', permission: ['manage qc', 'manage production cbp', 'view production'] },
            ],
        },
        {
            title: 'SDM & Payroll',
            icon: Users,
            permission: ['manage hr', 'view hr', 'manage payroll', 'view payroll'],
            items: [
                { title: 'Data Karyawan', href: safeRoute('hr.karyawan.index', {}, '/hr/karyawan'), routeName: 'hr.karyawan.*', permission: ['manage hr', 'view hr'] },
                { title: 'Pengajuan Cuti', href: safeRoute('hr.cuti.index', {}, '/hr/cuti'), routeName: 'hr.cuti.*', permission: ['manage hr', 'view hr'] },
                { title: 'Payroll 3-Skema', href: safeRoute('hr.payroll.index', {}, '/hr/payroll'), routeName: 'hr.payroll.*', permission: ['manage payroll', 'view payroll'] },
            ],
        },
        {
            title: 'Presensi & Lapangan',
            icon: MapPin,
            permission: ['manage hr', 'manage presensi', 'manage formulir lapangan'],
            items: [
                { title: 'Presensi', href: safeRoute('attendance.presensi.index', {}, '/attendance/presensi'), routeName: 'attendance.presensi.*', permission: ['manage hr', 'manage presensi', 'view hr'] },
                { title: 'Formulir Lapangan', href: safeRoute('attendance.formulir.index', {}, '/attendance/formulir'), routeName: 'attendance.formulir.*', permission: ['manage hr', 'manage formulir lapangan', 'view hr'] },
            ],
        },
        {
            title: 'Keuangan & Invoice',
            icon: Wallet,
            permission: ['manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice'],
            items: [
                { title: 'Kas & Bank', href: safeRoute('finance.akun-kas.index', {}, '/finance/akun-kas'), routeName: 'finance.akun-kas.*', permission: ['manage kas', 'manage finance', 'view finance'] },
                { title: 'Daftar Invoice', href: safeRoute('finance.invoice.index', {}, '/finance/invoice'), routeName: ['finance.invoice.*', '!finance.invoice.outstanding', '!finance.invoice.aging'], permission: ['manage invoice', 'view invoice', 'manage finance'] },
                { title: 'Piutang & Pembayaran', href: safeRoute('finance.invoice.outstanding', {}, '/finance/invoice/outstanding'), routeName: ['finance.invoice.outstanding', 'finance.invoice.aging', 'finance.pembayaran-klien.*'], permission: ['manage invoice', 'view invoice', 'manage finance'] },
                { title: 'Laporan Konsolidasi', href: safeRoute('finance.laporan-keuangan.index', {}, '/finance/laporan-keuangan'), routeName: 'finance.laporan-keuangan.*', permission: ['manage finance', 'view finance'] },
            ],
        },
        {
            title: 'Portal Kontraktor',
            icon: ClipboardList,
            permission: ['manage kontraktor', 'view kontraktor'],
            href: safeRoute('kontraktor.dashboard', {}, '/kontraktor/dashboard'),
            routeName: 'kontraktor.*',
        },
    ];
}

function hasPermission(userPermissions, required) {
    if (!required) return true;
    const list = Array.isArray(required) ? required : [required];
    return list.some((p) => userPermissions.includes(p));
}

function filterMenuByPermissions(menus, userPermissions) {
    return menus
        .filter((item) => hasPermission(userPermissions, item.permission))
        .map((item) => {
            if (!item.items) return item;
            const filteredItems = item.items.filter((sub) =>
                hasPermission(userPermissions, sub.permission)
            );
            return { ...item, items: filteredItems };
        })
        .filter((item) => !item.items || item.items.length > 0);
}

export default function Sidebar({ isOpen, onClose }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const roles = auth?.roles || [];
    const activeRole = auth?.active_role || roles[0] || '';
    const userPermissions = auth?.permissions || [];

    const allMenus = getAllMenus();
    const menuList = filterMenuByPermissions(allMenus, userPermissions);

    const isOwner = roles.includes('Owner');
    const isAdminKeuangan = roles.includes('Admin Keuangan');

    const roleExtraMenus = [];
    if (isOwner) {
        roleExtraMenus.push({
            title: 'Audit Log',
            icon: ShieldCheck,
            href: safeRoute('audit.logs', {}, '/audit/logs'),
            routeName: 'audit.*',
        });
    }
    if (isOwner || isAdminKeuangan) {
        roleExtraMenus.push({
            title: 'Manajemen User',
            icon: Users,
            href: safeRoute('users.index', {}, '/users'),
            routeName: 'users.*',
        });
    }

    const finalMenuList = [...menuList, ...roleExtraMenus];

    const [openSubmenu, setOpenSubmenu] = useState({});
    const [switching, setSwitching] = useState(false);

    const toggleSubmenu = (title) => {
        setOpenSubmenu((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    const matchesPattern = (current, pattern) => {
        if (pattern.endsWith('.*')) {
            return current.startsWith(pattern.replace('.*', ''));
        }
        return current === pattern;
    };

    const isRouteActive = (pattern) => {
        if (!pattern) return false;
        const patterns = Array.isArray(pattern) ? pattern : [pattern];
        try {
            if (typeof route === 'function') {
                const current = route().current();
                if (!current) return false;

                let active = false;
                for (const p of patterns) {
                    if (p.startsWith('!')) {
                        if (matchesPattern(current, p.slice(1))) return false;
                    } else if (matchesPattern(current, p)) {
                        active = true;
                    }
                }
                return active;
            }
        } catch (e) {
            return false;
        }
        return false;
    };

    const handleRoleSwitch = (newRole) => {
        if (newRole === activeRole || switching) return;
        setSwitching(true);
        router.post(
            safeRoute('switch-role', {}, '/switch-role'),
            { role: newRole },
            {
                preserveScroll: false,
                onFinish: () => setSwitching(false),
            }
        );
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
                className={`fixed top-0 left-0 z-50 h-screen w-64 transform bg-white text-ink.DEFAULT transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } flex flex-col shadow-bw-lg`}
            >
                <div className="flex h-16 items-center justify-between bg-white px-4">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black font-bold text-sm border-2 border-white shadow-md">
                            S
                        </div>
                        <div>
                            <span className="text-base font-black tracking-tight text-black">SBPS System</span>
                            <span className="block text-[10px] font-semibold text-blaxk/70">Multi-Unit Bisnis v5</span>
                        </div>
                    </Link>
                </div>

                <div className="border-b-2 border-black bg-white p-3">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-ink-secondary mb-1.5">
                        Role Aktif
                    </label>
                    {roles.length > 1 ? (
                        <div className="relative">
                            <select
                                value={activeRole}
                                onChange={(e) => handleRoleSwitch(e.target.value)}
                                disabled={switching}
                                className="w-full rounded-none bg-white py-2 pl-3 pr-10 text-xs font-bold text-ink.DEFAULT focus:border-black focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer disabled:opacity-60"
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
                        <div className="flex items-center justify-between bg-white px-3 py-2">
                            <span className="text-xs font-black text-ink.DEFAULT">{activeRole}</span>
                            <ShieldCheck className="h-4 w-4 text-ink.DEFAULT" />
                        </div>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {finalMenuList.map((item, idx) => {
                        const Icon = item.icon || Building2;
                        const hasSub = item.items && item.items.length > 0;
                        const isSubOpen = openSubmenu[item.title] ?? item.items?.some((sub) => isRouteActive(sub.routeName));
                        const active = !hasSub
                            ? isRouteActive(item.routeName)
                            : item.items.some((sub) => isRouteActive(sub.routeName));

                        return (
                            <div key={idx} className="space-y-1">
                                {!hasSub ? (
                                    <Link
                                        href={item.href}
                                        className={`group flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all border-2 ${active
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
                                            className={`group flex w-full items-center justify-between px-3 py-2.5 text-xs font-bold transition-all border-2 ${active
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
                                                            className={`block px-2.5 py-2 text-[11px] font-bold transition-all border-2 -ml-[1px] ${subActive
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

                <div className="p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-none bg-white text-black font-black text-sm border-2 border-white">
                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div className="truncate text-xs flex-1 min-w-0">
                            <div className="font-black text-black truncate">{user?.name}</div>
                            <div className="text-[10px] text-black/70 truncate">{user?.email}</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
