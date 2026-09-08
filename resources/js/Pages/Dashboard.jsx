import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Factory, DollarSign, Clock, Wrench, MapPin, TrendingUp,
    BarChart3, ArrowRight, ShieldCheck, Users, Truck, Building2,
    ClipboardList, Wallet, Eye,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardPetaProyek from '@/Components/DashboardPetaProyek';

const portalConfig = {
    admin: {
        title: 'Dashboard Admin',
        subtitle: 'Ringkasan sistem & manajemen global',
        accent: 'red',
    },
    armada: {
        title: 'Dashboard Armada',
        subtitle: 'Monitoring kendaraan, ritase & BBM',
        accent: 'blue',
    },
    produksi: {
        title: 'Dashboard Produksi',
        subtitle: 'Monitoring CBP/AMP, mesin & QC',
        accent: 'green',
    },
    keuangan: {
        title: 'Dashboard Keuangan',
        subtitle: 'Kas, invoice, piutang & laporan',
        accent: 'amber',
    },
    sdm: {
        title: 'Dashboard SDM',
        subtitle: 'Karyawan, cuti, presensi & payroll',
        accent: 'purple',
    },
    kontraktor: {
        title: 'Portal Kontraktor',
        subtitle: 'Proyek, progress & invoice',
        accent: 'teal',
    },
};

function StatCard({ icon: Icon, label, value, suffix, color, href, hrefLabel }) {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-500',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        teal: 'bg-teal-50 text-teal-600',
        indigo: 'bg-indigo-50 text-indigo-600',
    };

    const badgeColor = {
        blue: 'bg-blue-100 text-blue-800',
        red: 'bg-red-100 text-red-800',
        amber: 'bg-amber-100 text-amber-800',
        purple: 'bg-purple-100 text-purple-800',
        green: 'bg-green-100 text-green-800',
        teal: 'bg-teal-100 text-teal-800',
        indigo: 'bg-indigo-100 text-indigo-800',
    };

    const linkColor = {
        blue: 'text-blue-600 hover:text-blue-800',
        red: 'text-red-600 hover:text-red-800',
        amber: 'text-amber-500 hover:text-amber-700',
        purple: 'text-purple-600 hover:text-purple-800',
        green: 'text-green-600 hover:text-green-800',
        teal: 'text-teal-600 hover:text-teal-800',
        indigo: 'text-indigo-600 hover:text-indigo-800',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorMap[color] || colorMap.indigo}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeColor[color] || badgeColor.indigo}`}>
                    {suffix || 'Aktif'}
                </span>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                    {value}
                </p>
            </div>
            {href && (
                <div className="mt-4 pt-3 border-t">
                    <Link href={href} className={`inline-flex items-center text-xs font-semibold ${linkColor[color] || linkColor.indigo}`}>
                        {hrefLabel || 'Lihat Detail'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                </div>
            )}
        </div>
    );
}

// ── Portal-specific dashboard sections ────────────────────────────

function AdminDashboard({ ownerData }) {
    const summaryToday = ownerData?.summary_today || {};

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    label="Total User Aktif"
                    value={summaryToday.total_users || '—'}
                    color="red"
                    suffix="System"
                    href="/users"
                    hrefLabel="Manajemen User"
                />
                <StatCard
                    icon={ClipboardList}
                    label="PO Menunggu Approval"
                    value={summaryToday.po_pending_approval || 0}
                    suffix="Pending"
                    color="amber"
                    href="/procurement/purchase-orders"
                    hrefLabel="Review PO"
                />
                <StatCard
                    icon={DollarSign}
                    label="Pengeluaran Hari Ini"
                    value={`Rp ${Number(summaryToday.pengeluaran || 0).toLocaleString('id-ID')}`}
                    color="red"
                    href="/finance/akun-kas"
                    hrefLabel="Kas & Bank"
                />
                <StatCard
                    icon={ShieldCheck}
                    label="Audit Log"
                    value={summaryToday.audit_log_count || '—'}
                    color="purple"
                    href="/audit/logs"
                    hrefLabel="Lihat Audit Log"
                />
            </div>
        </>
    );
}

function ArmadaDashboard({ ownerData }) {
    const summaryToday = ownerData?.summary_today || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
                icon={Truck}
                label="Armada Aktif"
                value={summaryToday.armada_aktif || 0}
                suffix="Unit"
                color="blue"
                href="/fleet/armada"
                hrefLabel="Detail Armada"
            />
            <StatCard
                icon={MapPin}
                label="Ritase Hari Ini"
                value={summaryToday.ritase_today || 0}
                suffix="Trip"
                color="blue"
                href="/fleet/ritase"
                hrefLabel="Log Ritase"
            />
            <StatCard
                icon={Wrench}
                label="Servis Jatuh Tempo"
                value={summaryToday.unit_servis_jatuh_tempo || 0}
                suffix="Unit"
                color="purple"
                href="/fleet/armada"
                hrefLabel="Detail Servis"
            />
            <StatCard
                icon={Clock}
                label="Downtime Aktif"
                value={summaryToday.downtime_aktif || 0}
                suffix="Unit"
                color="red"
                href="/fleet/downtime/active"
                hrefLabel="Downtime Log"
            />
        </div>
    );
}

function ProduksiDashboard({ ownerData }) {
    const summaryToday = ownerData?.summary_today || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
                icon={Factory}
                label="Output Produksi"
                value={`${Number(summaryToday.produksi_output || 0).toLocaleString('id-ID')} unit`}
                color="green"
                suffix="Hari Ini"
                href="/production/dashboard"
                hrefLabel="Dashboard Produksi"
            />
            <StatCard
                icon={Wrench}
                label="Mesin Aktif"
                value={summaryToday.mesin_aktif || 0}
                suffix="Unit"
                color="green"
                href="/production/mesin"
                hrefLabel="Mesin Produksi"
            />
            <StatCard
                icon={ClipboardList}
                label="QC Pending"
                value={summaryToday.qc_pending || 0}
                suffix="Sample"
                color="amber"
                href="/production/qc"
                hrefLabel="QC Samples"
            />
            <StatCard
                icon={Truck}
                label="Pengiriman Hari Ini"
                value={summaryToday.pengiriman_today || 0}
                suffix="Unit"
                color="blue"
                href="/production/pengiriman"
                hrefLabel="Pengiriman"
            />
        </div>
    );
}

function KeuanganDashboard({ ownerData }) {
    const summaryToday = ownerData?.summary_today || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
                icon={DollarSign}
                label="Saldo Kas"
                value={`Rp ${Number(summaryToday.saldo_kas || 0).toLocaleString('id-ID')}`}
                color="amber"
                href="/finance/akun-kas"
                hrefLabel="Kas & Bank"
            />
            <StatCard
                icon={ClipboardList}
                label="Invoice Terbit"
                value={summaryToday.invoice_terbit || 0}
                suffix="Unit"
                color="amber"
                href="/finance/invoice"
                hrefLabel="Daftar Invoice"
            />
            <StatCard
                icon={TrendingUp}
                label="Piutang Outstanding"
                value={`Rp ${Number(summaryToday.piutang_outstanding || 0).toLocaleString('id-ID')}`}
                color="red"
                href="/finance/invoice/outstanding"
                hrefLabel="Piutang"
            />
            <StatCard
                icon={BarChart3}
                label="Laporan Keuangan"
                value="RAB vs Realisasi"
                color="green"
                href="/finance/laporan-keuangan"
                hrefLabel="Lihat Laporan"
            />
        </div>
    );
}

function SDMDashboard({ ownerData }) {
    const summaryToday = ownerData?.summary_today || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
                icon={Users}
                label="Total Karyawan"
                value={summaryToday.total_karyawan || 0}
                suffix="Orang"
                color="purple"
                href="/hr/karyawan"
                hrefLabel="Data Karyawan"
            />
            <StatCard
                icon={ClipboardList}
                label="Cuti Pending"
                value={summaryToday.cuti_pending || 0}
                suffix="Pengajuan"
                color="amber"
                href="/hr/cuti"
                hrefLabel="Pengajuan Cuti"
            />
            <StatCard
                icon={MapPin}
                label="Presensi Hari Ini"
                value={summaryToday.presensi_today || 0}
                suffix="Hadir"
                color="green"
                href="/attendance/presensi"
                hrefLabel="Presensi"
            />
            <StatCard
                icon={Wallet}
                label="Payroll Periode Ini"
                value={summaryToday.payroll_periode || '—'}
                color="purple"
                href="/hr/payroll"
                hrefLabel="Payroll"
            />
        </div>
    );
}

function KontraktorDashboard() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
                icon={Building2}
                label="Proyek Aktif"
                value="—"
                color="teal"
                href="/kontraktor/dashboard"
                hrefLabel="Portal Kontraktor"
            />
            <StatCard
                icon={ClipboardList}
                label="Invoice"
                value="—"
                color="teal"
            />
            <StatCard
                icon={DollarSign}
                label="Tagihan Outstanding"
                value="—"
                color="amber"
            />
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────

export default function Dashboard({ auth, ownerData = {} }) {
    const portal = auth?.portal;
    const activeRole = auth?.active_role;
    const permissions = auth?.permissions || [];
    const summaryToday = ownerData?.summary_today || {};
    const rabSummary = ownerData?.rab_summary || {};
    const trenBulanan = ownerData?.tren_bulanan || [];
    const petaTitik = ownerData?.peta_titik || [];
    const proyekList = ownerData?.proyek_list || [];

    // Role yang memiliki privilege untuk mengatur atau melihat proyek
    const canManageOrViewProyek =
        permissions.includes('manage proyek') ||
        permissions.includes('view proyek') ||
        permissions.includes('view owner dashboard') ||
        ['Owner', 'Superadmin', 'Admin', 'Mandor Proyek', 'Ketua Divisi Kontraktor', 'Admin Keuangan'].includes(activeRole) ||
        ['admin', 'produksi', 'kontraktor'].includes(portal);

    const config = portalConfig[portal] || {
        title: 'Dashboard',
        subtitle: 'Ringkasan operasional',
        accent: 'blue',
    };

    const renderPortalDashboard = () => {
        switch (portal) {
            case 'admin':
                return <AdminDashboard ownerData={ownerData} />;
            case 'armada':
                return <ArmadaDashboard ownerData={ownerData} />;
            case 'produksi':
                return <ProduksiDashboard ownerData={ownerData} />;
            case 'keuangan':
                return <KeuanganDashboard ownerData={ownerData} />;
            case 'sdm':
                return <SDMDashboard ownerData={ownerData} />;
            case 'kontraktor':
                return <KontraktorDashboard />;
            default:
                return <AdminDashboard ownerData={ownerData} />;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">{config.title}</h2>
                        <p className="text-xs text-gray-500 mt-1">{config.subtitle}</p>
                    </div>
                    {activeRole && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-ink-secondary bg-surface-muted px-3 py-1 rounded-none border-2 border-black">
                            {activeRole}
                        </span>
                    )}
                </div>
            }
        >
            <Head title={config.title} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {renderPortalDashboard()}

                    {/* Monitoring Peta & Titik Proyek — untuk role yang memiliki privilege mengatur/melihat proyek */}
                    {canManageOrViewProyek && (
                        <DashboardPetaProyek
                            titiks={petaTitik}
                            proyeks={proyekList}
                        />
                    )}

                    {/* RAB Summary — visible for admin, produksi, keuangan */}
                    {['admin', 'produksi', 'keuangan'].includes(portal) && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-indigo-600" /> Ringkasan RAB Aktif
                                        </h3>
                                        <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                                            {rabSummary.total_proyek_aktif || 0} Proyek
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Rencana Anggaran Total</span>
                                                <span className="font-bold text-gray-900">Rp {Number(rabSummary.total_rencana || 0).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                <span>Realisasi Pengeluaran</span>
                                                <span className="font-bold text-blue-600">Rp {Number(rabSummary.total_realisasi || 0).toLocaleString('id-ID')}</span>
                                            </div>

                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${rabSummary.persentase > 90 ? 'bg-red-500' : rabSummary.persentase > 75 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                                    style={{ width: `${Math.min(100, rabSummary.persentase || 0)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold mt-1">
                                                <span className="text-gray-500">Penyerapan:</span>
                                                <span className="text-indigo-600">{rabSummary.persentase || 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <Link href={route('finance.laporan-keuangan.rab-realisasi')}>
                                        <button className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2">
                                            Lihat Laporan RAB vs Realisasi Lengkap <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tren Grafik — visible for admin & keuangan */}
                    {['admin', 'keuangan'].includes(portal) && trenBulanan.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <div className="flex justify-between items-center border-b pb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-600" /> Grafik Tren Produksi & Pengeluaran (6 Bulan)
                                    </h3>
                                    <p className="text-xs text-gray-500">Visualisasi historis dinamika operasional</p>
                                </div>
                                <Link href={route('finance.laporan-keuangan.laba-rugi')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                                    Laporan Laba Rugi <ArrowRight className="w-3.5 h-3.5 inline" />
                                </Link>
                            </div>

                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trenBulanan} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="bulan" />
                                        <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(value) => Number(value).toLocaleString('id-ID')} />
                                        <Legend />
                                        <Bar dataKey="produksi" name="Volume Produksi" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="pengeluaran" name="Pengeluaran (Rp)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
