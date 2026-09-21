import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Plus, Search, Filter, Truck, MapPin, Calendar,
    ChevronRight, TrendingUp, Download, Eye
} from 'lucide-react';
import { formatTanggal } from '@/utils/date';

const STATUS_COLOR = {
    selesai:    'bg-green-100 text-green-800',
    dalam_proses: 'bg-blue-100 text-blue-800',
    batal:      'bg-red-100 text-red-800',
};

function StatCard({ label, value, sub, color = 'blue' }) {
    const colors = {
        blue:   'from-blue-600 to-blue-700',
        green:  'from-green-600 to-green-700',
        amber:  'from-amber-500 to-amber-600',
        purple: 'from-purple-600 to-purple-700',
    };
    return (
        <div className={`rounded-xl bg-gradient-to-br ${colors[color]} text-white p-5 shadow-md`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
        </div>
    );
}

export default function RitaseIndex({ auth, ritase, filters = {}, armadaList = [], stats = {}, can = {} }) {
    const { flash } = usePage().props;
    const [showFlash, setShowFlash] = useState(!!flash?.success);

    const [search, setSearch] = useState(filters.search || '');
    const [filterArmada, setFilterArmada] = useState(filters.armada_id || '');
    const [filterDate, setFilterDate] = useState(filters.tanggal || '');

    const applyFilter = () => {
        router.get(route('fleet.ritase.index'), {
            search, armada_id: filterArmada, tanggal: filterDate
        }, { preserveState: true, replace: true });
    };

    const clearFilter = () => {
        setSearch(''); setFilterArmada(''); setFilterDate('');
        router.get(route('fleet.ritase.index'), {}, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Ritase Harian</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Rekap perjalanan dan upah borongan armada</p>
                    </div>
                    {(can?.create ?? true) && (
                        <Link
                            href={route('fleet.ritase.create')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Catat Ritase
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Ritase Harian" />

            {showFlash && flash?.success && (
                <div className="mb-4 flex items-center justify-between bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    <span className="text-sm">{flash.success}</span>
                    <button onClick={() => setShowFlash(false)} className="text-green-600 font-bold">×</button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Trip Hari Ini" value={stats.total_trip_today ?? 0} color="blue" />
                <StatCard label="Total Kubik Hari Ini" value={`${Number(stats.total_volume_today ?? 0).toLocaleString('id-ID')} m³`} color="green" />
                <StatCard label="Upah Borongan Bulan Ini" value={`Rp ${Number(stats.total_upah_bulan ?? 0).toLocaleString('id-ID')}`} color="amber" />
                <StatCard label="Armada Aktif Beroperasi" value={stats.armada_beroperasi ?? 0} color="purple" />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex flex-wrap gap-3 items-end shadow-sm">
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cari driver / nomor pol</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari..." onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                            className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="min-w-[160px]">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Armada</label>
                    <select value={filterArmada} onChange={(e) => setFilterArmada(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">Semua Armada</option>
                        {armadaList.map((a) => (
                            <option key={a.id} value={a.id}>{a.nama_unit} ({a.nomor_polisi})</option>
                        ))}
                    </select>
                </div>
                <div className="min-w-[160px]">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal</label>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2">
                    <button onClick={applyFilter}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                        <Filter className="w-3.5 h-3.5" /> Filter
                    </button>
                    <button onClick={clearFilter}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition">
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Tanggal', 'Armada / Driver', 'Rute', 'Trip / Volume', 'Tarif/Trip', 'Total Upah', 'Status', 'Aksi'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(!ritase?.data || ritase.data.length === 0) && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                                        <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        Belum ada data ritase.{' '}
                                        <Link href={route('fleet.ritase.create')} className="text-blue-600 font-semibold">Catat sekarang →</Link>
                                    </td>
                                </tr>
                            )}
                            {ritase?.data?.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {formatTanggal(r.tanggal)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold text-slate-800">{r.armada?.nama_unit}</p>
                                        <p className="text-xs text-slate-500">{r.armada?.nomor_polisi} · {r.driver?.nama_lengkap ?? r.driver?.name ?? '–'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-1 text-xs text-slate-600">
                                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                                            <span>{r.rute_tarif?.nama_rute ?? r.lokasi_muat + ' → ' + r.lokasi_bongkar}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                        <span className="font-semibold">{r.jumlah_trip}x</span>
                                        <span className="text-slate-400 mx-1">·</span>
                                        {Number(r.total_volume ?? 0).toLocaleString('id-ID')} m³
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                        Rp {Number(r.tarif_snapshot ?? 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                                        Rp {Number(r.total_upah_rit ?? 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={route('fleet.armada.show', r.armada_id)}
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Detail
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {ritase?.links && (
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan {ritase.from ?? 0}–{ritase.to ?? 0} dari {ritase.total ?? 0} data
                        </p>
                        <div className="flex gap-1">
                            {ritase.links.map((link, i) => (
                                <button key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    className={`px-3 py-1 rounded text-xs font-medium border transition
                                        ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
