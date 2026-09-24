import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Factory, DollarSign, Clock, Wrench, MapPin, TrendingUp,
    BarChart3, ArrowRight, ShieldCheck, Users, Truck, Building2,
    ClipboardList, Wallet, Eye, Fuel, Activity, FlaskConical, Package,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardPetaProyek from '@/Components/DashboardPetaProyek';
import DashboardPanel from '@/Components/DashboardPanel';
import DashboardRowList from '@/Components/DashboardRowList';

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

function formatHariSisa(value) {
    if (value == null) return '—';
    if (value < 0) return `${Math.abs(value)} hr lewat`;
    if (value === 0) return 'Hari ini';
    return `${value} hr`;
}

function AdminDashboard({
    ownerData,
    canManageUsers,
    canViewAudit,
    canViewFinance,
    canViewProcurement,
}) {
    const summaryToday = ownerData?.summary_today || {};
    const widgets = ownerData?.widgets?.admin || {};

    const poRows = (widgets.po_pending_list || []).map((po) => ({
        id: po.id,
        primary: po.kode_po,
        secondary: `${po.supplier || 'Supplier'}`,
        badge: `Rp ${Number(po.total || 0).toLocaleString('id-ID')}`,
        badgeClass: 'bg-amber-100 text-amber-800',
        meta: po.proyek || '',
    }));

    const unitSummary = widgets.unit_summary || [];

    const deadlineRows = (widgets.deadline_list || []).map((p) => ({
        id: p.id,
        primary: p.nama,
        secondary: `${p.client || '-'} • ${p.unit || '-'}`,
        badge: formatHariSisa(p.sisa_hari),
        badgeClass: p.sisa_hari <= 7 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
        meta: p.tanggal_selesai_rencana,
    }));

    const auditRows = (widgets.audit_list || []).map((a) => ({
        id: a.id,
        primary: a.description,
        secondary: a.causer || '-',
        badge: a.event || '',
        badgeClass: 'bg-purple-100 text-purple-800',
        meta: a.created_at,
    }));

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {canManageUsers && (
                    <StatCard
                        icon={Users}
                        label="Total User Aktif"
                        value={summaryToday.total_users ?? '—'}
                        color="red"
                        suffix="System"
                        href="/users"
                        hrefLabel="Manajemen User"
                    />
                )}
                {canViewProcurement && (
                    <StatCard
                        icon={ClipboardList}
                        label="PO Menunggu Approval"
                        value={summaryToday.po_pending_approval ?? 0}
                        suffix="Pending"
                        color="amber"
                        href="/procurement/purchase-orders"
                        hrefLabel="Review PO"
                    />
                )}
                {canViewFinance && (
                    <StatCard
                        icon={DollarSign}
                        label="Pengeluaran Hari Ini"
                        value={`Rp ${Number(summaryToday.pengeluaran || 0).toLocaleString('id-ID')}`}
                        color="red"
                        href="/finance/akun-kas"
                        hrefLabel="Kas & Bank"
                    />
                )}
                {canViewAudit && (
                    <StatCard
                        icon={ShieldCheck}
                        label="Audit Log"
                        value={summaryToday.audit_log_count ?? '—'}
                        color="purple"
                        href="/audit/logs"
                        hrefLabel="Lihat Audit Log"
                    />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {poRows.length > 0 && (
                    <DashboardPanel
                        icon={ClipboardList}
                        title="PO Menunggu Approval"
                        subtitle="Perlu review Finance/Owner"
                        accent="amber"
                        badge={poRows.length}
                        href="/procurement/purchase-orders"
                    >
                        <DashboardRowList
                            rows={poRows}
                            getHref={(row) => route('procurement.purchase-orders.show', { purchaseOrder: row.id })}
                            empty="Tidak ada PO pending"
                            max={5}
                        />
                    </DashboardPanel>
                )}

                {deadlineRows.length > 0 && (
                    <DashboardPanel
                        icon={Clock}
                        title="Proyek Mendekati Deadline"
                        subtitle="30 hari ke depan"
                        accent="red"
                        badge={deadlineRows.length}
                        href="/proyek"
                    >
                        <DashboardRowList
                            rows={deadlineRows}
                            getHref={(row) => route('core.proyek.show', { proyek: row.id })}
                            empty="Tidak ada proyek mendekati deadline"
                            max={5}
                        />
                    </DashboardPanel>
                )}

                {auditRows.length > 0 && (
                    <DashboardPanel
                        icon={ShieldCheck}
                        title="Aktivitas Sistem Terbaru"
                        subtitle="Audit log"
                        accent="purple"
                        badge={auditRows.length}
                        href="/audit/logs"
                    >
                        <DashboardRowList
                            rows={auditRows}
                            getHref={(row) => route('audit.logs.show', { log: row.id })}
                            empty="Belum ada aktivitas"
                            max={5}
                        />
                    </DashboardPanel>
                )}
            </div>

            {unitSummary.length > 0 && (
                <DashboardPanel
                    icon={Building2}
                    title="Ringkasan Per Unit Bisnis"
                    subtitle="Proyek, titik & armada aktif"
                    accent="indigo"
                >
                    <div className="h-64 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={unitSummary} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="unit" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="proyek_aktif" name="Proyek" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="titik_aktif" name="Titik" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="armada_aktif" name="Armada" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </DashboardPanel>
            )}
        </>
    );
}

function ArmadaDashboard({ ownerData }) {
    const summaryToday = ownerData?.summary_today || {};
    const widgets = ownerData?.widgets?.armada || {};

    const aktifRows = (widgets.aktif_list || []).map((a) => ({
        id: a.id,
        primary: a.kode_unit,
        secondary: `${a.plat_nomor || '-'} • ${a.titik || '-'}`,
        badge: a.pic || 'Tanpa PIC',
        badgeClass: 'bg-blue-100 text-blue-800',
        meta: a.status,
    }));

    const servisRows = (widgets.servis_due_list || []).map((a) => ({
        id: a.id,
        primary: a.kode_unit,
        secondary: `Servis terakhir ${a.tanggal_servis_terakhir || '-'}`,
        badge: formatHariSisa(a.sisa_hari),
        badgeClass: a.sisa_hari < 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
    }));

    const ritaseRows = (widgets.ritase_today_list || []).map((r) => ({
        id: r.id,
        primary: r.armada,
        secondary: r.rute || '-',
        badge: `${Number(r.jumlah_rit || 0).toLocaleString('id-ID')} rit`,
        badgeClass: 'bg-green-100 text-green-800',
        meta: r.status,
    }));

    const downtimeRows = (widgets.downtime_list || []).map((d) => ({
        id: d.id,
        primary: d.armada,
        secondary: `${d.kategori || '-'}: ${d.penyebab || '-'}`,
        badge: `${d.durasi_menit} mnt`,
        badgeClass: 'bg-red-100 text-red-800',
        meta: d.mulai ? new Date(d.mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
    }));

    return (
        <>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ritaseRows.length > 0 && (
                    <DashboardPanel
                        icon={MapPin}
                        title="Ritase Hari Ini"
                        subtitle="Aktivitas pengiriman terbaru"
                        accent="blue"
                        badge={ritaseRows.length}
                        href="/fleet/ritase"
                    >
                        <DashboardRowList
                            rows={ritaseRows}
                            getHref={(row) => route('fleet.ritase.show', { ritase: row.id })}
                            empty="Belum ada ritase hari ini"
                            max={6}
                        />
                    </DashboardPanel>
                )}

                {downtimeRows.length > 0 && (
                    <DashboardPanel
                        icon={Activity}
                        title="Downtime Berlangsung"
                        subtitle="Kendaraan tidak beroperasi"
                        accent="red"
                        badge={downtimeRows.length}
                        href="/fleet/downtime/active"
                    >
                        <DashboardRowList
                            rows={downtimeRows}
                            getHref={(row) => route('fleet.armada.show', { armada: row.armada_id })}
                            empty="Tidak ada downtime berlangsung"
                            max={6}
                        />
                    </DashboardPanel>
                )}

                {aktifRows.length > 0 && (
                    <DashboardPanel
                        icon={Truck}
                        title="Armada Aktif"
                        subtitle="Unit beroperasi & PIC"
                        accent="blue"
                        badge={widgets.total_armada || aktifRows.length}
                        href="/fleet/armada"
                    >
                        <DashboardRowList
                            rows={aktifRows}
                            getHref={(row) => route('fleet.armada.show', { armada: row.id })}
                            empty="Tidak ada armada aktif"
                            max={6}
                        />
                    </DashboardPanel>
                )}

                {servisRows.length > 0 && (
                    <DashboardPanel
                        icon={Wrench}
                        title="Servis Jatuh Tempo"
                        subtitle="Jadwal servis berkala"
                        accent="purple"
                        badge={servisRows.length}
                        href="/fleet/armada"
                    >
                        <DashboardRowList
                            rows={servisRows}
                            getHref={(row) => route('fleet.armada.show', { armada: row.id })}
                            empty="Semua armada bebas servis"
                            max={6}
                        />
                    </DashboardPanel>
                )}

                {(widgets.bbm_today_chart || []).length > 0 && (
                    <DashboardPanel
                        icon={Fuel}
                        title="Konsumsi BBM Hari Ini"
                        subtitle="Liter per armada"
                        accent="green"
                        href="/fleet/bbm"
                    >
                        <div className="h-56 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={widgets.bbm_today_chart} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="armada" fontSize={10} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="liter" name="Liter" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardPanel>
                )}

                {(widgets.status_distribution || []).length > 0 && (
                    <DashboardPanel
                        icon={BarChart3}
                        title="Distribusi Status Armada"
                        subtitle="Aktif, servis & nonaktif"
                        accent="indigo"
                        href="/fleet/armada"
                    >
                        <div className="h-56 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={widgets.status_distribution} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="status" fontSize={10} />
                                    <YAxis allowDecimals={false} fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="total" name="Unit" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardPanel>
                )}
            </div>
        </>
    );
}

function ProduksiDashboard({ ownerData }) {
    const summaryToday = ownerData?.summary_today || {};
    const widgets = ownerData?.widgets?.produksi || {};

    const sesiRows = (widgets.sesi_berjalan_list || []).map((s) => ({
        id: s.id,
        primary: s.produk || '-',
        secondary: `${s.mesin || '-'} • ${s.titik || '-'}`,
        badge: s.mulai ? new Date(s.mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
        badgeClass: 'bg-green-100 text-green-800',
        meta: s.satuan || '',
    }));

    const qcRows = (widgets.qc_pending_list || []).map((q) => ({
        id: q.id,
        primary: q.produk || '-',
        secondary: `${q.titik || '-'} • rencana uji ${q.rencana_uji_tekan || '-'}`,
        badge: q.status || 'menunggu',
        badgeClass: 'bg-amber-100 text-amber-800',
    }));

    const pengirimanRows = (widgets.pengiriman_today_list || []).map((p) => ({
        id: p.id,
        primary: p.armada || 'Tanpa armada',
        secondary: `${p.tujuan || '-'}`,
        badge: p.status || '',
        badgeClass: p.status === 'dalam_perjalanan' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800',
        meta: p.driver || '',
    }));

    return (
        <>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {sesiRows.length > 0 && (
                    <DashboardPanel
                        icon={Factory}
                        title="Sesi Produksi Berjalan"
                        subtitle="Aktivitas mesin saat ini"
                        accent="green"
                        badge={sesiRows.length}
                        href="/production/sessions"
                    >
                        <DashboardRowList
                            rows={sesiRows}
                            getHref={(row) => route('production.sessions.show', { session: row.id })}
                            empty="Tidak ada sesi berjalan"
                            max={5}
                        />
                    </DashboardPanel>
                )}

                {qcRows.length > 0 && (
                    <DashboardPanel
                        icon={FlaskConical}
                        title="QC Menunggu Uji Tekan"
                        subtitle="Sampel uji tekan beton"
                        accent="amber"
                        badge={qcRows.length}
                        href="/production/qc"
                    >
                        <DashboardRowList
                            rows={qcRows}
                            getHref={(row) => route('production.qc.pending')}
                            empty="Tidak ada QC pending"
                            max={5}
                        />
                    </DashboardPanel>
                )}

                {pengirimanRows.length > 0 && (
                    <DashboardPanel
                        icon={Package}
                        title="Pengiriman Hari Ini"
                        subtitle="Pengiriman beton/jarak"
                        accent="blue"
                        badge={pengirimanRows.length}
                        href="/production/pengiriman"
                    >
                        <DashboardRowList
                            rows={pengirimanRows}
                            getHref={(row) => route('production.pengiriman.show', { pengiriman: row.id })}
                            empty="Tidak ada pengiriman hari ini"
                            max={5}
                        />
                    </DashboardPanel>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(widgets.output_per_produk || []).length > 0 && (
                    <DashboardPanel
                        icon={BarChart3}
                        title="Output per Produk (Hari Ini)"
                        subtitle="Total output produksi"
                        accent="green"
                        href="/production/dashboard"
                    >
                        <div className="h-56 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={widgets.output_per_produk} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="produk" fontSize={10} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="output" name="Output" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardPanel>
                )}

                {(widgets.tren_7_hari || []).length > 0 && (
                    <DashboardPanel
                        icon={TrendingUp}
                        title="Tren Output 7 Hari"
                        subtitle="Histori produksi harian"
                        accent="indigo"
                    >
                        <div className="h-56 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={widgets.tren_7_hari} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="tanggal" fontSize={10} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="output" name="Output" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </DashboardPanel>
                )}
            </div>
        </>
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

function KontraktorDashboard({ ownerData }) {
    const summaryToday = ownerData?.summary_today || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
                icon={Building2}
                label="Proyek Aktif"
                value={summaryToday.proyek_aktif ?? '—'}
                suffix="Proyek"
                color="teal"
                href="/kontraktor/dashboard"
                hrefLabel="Portal Kontraktor"
            />
            <StatCard
                icon={ClipboardList}
                label="Invoice"
                value={summaryToday.invoice_count ?? '—'}
                suffix="Unit"
                color="teal"
                href="/kontraktor/dashboard"
                hrefLabel="Daftar Invoice"
            />
            <StatCard
                icon={DollarSign}
                label="Tagihan Outstanding"
                value={summaryToday.piutang_outstanding != null
                    ? `Rp ${Number(summaryToday.piutang_outstanding).toLocaleString('id-ID')}`
                    : '—'}
                color="amber"
                href="/kontraktor/dashboard"
                hrefLabel="Detail Tagihan"
            />
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────

export default function Dashboard({ auth, ownerData = {} }) {
    const portal = auth?.portal;
    const activeRole = auth?.active_role;
    const permissions = auth?.permissions || [];
    const rabSummary = ownerData?.rab_summary || {};
    const trenBulanan = ownerData?.tren_bulanan || [];
    const petaTitik = ownerData?.peta_titik || [];
    const proyekList = ownerData?.proyek_list || [];
    const access = ownerData?.access || {};

    // Izin menghadirkan kartu yang menuju halaman terbatas — data sudah
    // dibatasi server-side (OwnerDashboardAggregatorService). Card dengan
    // akses yang tidak dimiliki TIDAK dirender (menghindari link 403).
    const canManageUsers = access.can_manage_users;
    const canViewAudit = access.can_view_audit;
    const canViewFinance = access.can_view_finance;
    const canViewProcurement =
        permissions.includes('manage procurement') ||
        permissions.includes('view procurement') ||
        permissions.includes('approve procurement') ||
        permissions.includes('pay procurement') ||
        access.can_view_finance;

    // Role yang memiliki privilege untuk mengatur/melihat proyek LINTAS UNIT.
    // PENTING: role eksternal Kontraktor (dan pemegang 'view proyek' saja)
    // TIDAK termasuk di sini — mereka tidak boleh menerima peta & daftar
    // proyek seluruh perusahaan. Portal kontraktor punya halaman sendiri
    // (Kontraktor/Index) yang discoping ke proyek miliknya saja.
    const canManageOrViewProyek =
        (permissions.includes('manage proyek') && portal !== 'kontraktor') ||
        permissions.includes('view owner dashboard') ||
        ['Owner', 'Superadmin', 'Admin', 'Mandor Proyek', 'Mandor Titik', 'Ketua Divisi Kontraktor', 'Admin Keuangan'].includes(activeRole);

    const config = portalConfig[portal] || {
        title: 'Dashboard',
        subtitle: 'Ringkasan operasional',
        accent: 'blue',
    };

    const renderPortalDashboard = () => {
        switch (portal) {
            case 'admin':
                return (
                    <AdminDashboard
                        ownerData={ownerData}
                        canManageUsers={canManageUsers}
                        canViewAudit={canViewAudit}
                        canViewFinance={canViewFinance}
                        canViewProcurement={canViewProcurement}
                    />
                );
            case 'armada':
                return <ArmadaDashboard ownerData={ownerData} />;
            case 'produksi':
                return <ProduksiDashboard ownerData={ownerData} />;
            case 'keuangan':
                return <KeuanganDashboard ownerData={ownerData} />;
            case 'sdm':
                return <SDMDashboard ownerData={ownerData} />;
            case 'kontraktor':
                return <KontraktorDashboard ownerData={ownerData} />;
            default:
                return (
                    <AdminDashboard
                        ownerData={ownerData}
                        canManageUsers={canManageUsers}
                        canViewAudit={canViewAudit}
                        canViewFinance={canViewFinance}
                        canViewProcurement={canViewProcurement}
                    />
                );
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

                    {/* RAB Summary — hanya untuk yang bisa akses laporan keuangan (menghindari link 403) */}
                    {canViewFinance && (
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

                    {/* Tren Grafik — hanya untuk yang bisa akses laporan keuangan */}
                    {canViewFinance && trenBulanan.length > 0 && (
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