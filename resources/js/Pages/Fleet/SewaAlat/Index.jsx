import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Search, Filter, Clock, Calendar, Eye, Wrench } from 'lucide-react';

const STATUS_COLOR = {
    aktif:    'bg-green-100 text-green-800',
    selesai:  'bg-slate-100 text-slate-600',
    batal:    'bg-red-100 text-red-800',
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

export default function SewaAlatIndex({ auth, sewaList, filters = {}, armadaList = [], stats = {}, can = {} }) {
    const { flash } = usePage().props;
    const [showFlash, setShowFlash] = useState(!!flash?.success);
    const [search, setSearch] = useState(filters.search || '');
    const [filterArmada, setFilterArmada] = useState(filters.armada_id || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || '');

    const applyFilter = () => {
        router.get(route('fleet.sewa-alat.index'), {
            search, armada_id: filterArmada, status: filterStatus
        }, { preserveState: true, replace: true });
    };

    const clearFilter = () => {
        setSearch(''); setFilterArmada(''); setFilterStatus('');
        router.get(route('fleet.sewa-alat.index'), {}, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Sewa Alat Berat</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Rekap sewa alat berbasis Jam Mesin (HM)</p>
                    </div>
                    {(can?.create ?? true) && (
                        <Link
                            href={route('fleet.sewa-alat.create')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Catat Sewa
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Sewa Alat Berat" />

            {showFlash && flash?.success && (
                <div className="mb-4 flex items-center justify-between bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    <span className="text-sm">{flash.success}</span>
                    <button onClick={() => setShowFlash(false)} className="font-bold">×</button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Sewa Aktif" value={stats.total_aktif ?? 0} color="blue" />
                <StatCard label="HM Total Bulan Ini" value={`${Number(stats.hm_bulan ?? 0).toLocaleString('id-ID')} HM`} color="green" />
                <StatCard label="Pendapatan Bulan Ini" value={`Rp ${Number(stats.pendapatan_bulan ?? 0).toLocaleString('id-ID')}`} color="amber" />
                <StatCard label="Alat Tersewa Sekarang" value={stats.alat_tersewa ?? 0} color="purple" />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex flex-wrap gap-3 items-end shadow-sm">
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cari pelanggan / alat</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari..." onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                            className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="min-w-[160px]">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Armada / Alat</label>
                    <select value={filterArmada} onChange={(e) => setFilterArmada(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">Semua Alat</option>
                        {armadaList.map((a) => (
                            <option key={a.id} value={a.id}>{a.nama_unit} ({a.nomor_polisi})</option>
                        ))}
                    </select>
                </div>
                <div className="min-w-[130px]">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">Semua Status</option>
                        <option value="aktif">Aktif</option>
                        <option value="selesai">Selesai</option>
                        <option value="batal">Batal</option>
                    </select>
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
                                {['Alat / Armada', 'Pelanggan', 'Periode', 'HM Awal', 'HM Akhir', 'Total HM', 'Tarif/HM', 'Total Pendapatan', 'Status', 'Aksi'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(!sewaList?.data || sewaList.data.length === 0) && (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-sm">
                                        <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        Belum ada data sewa alat.{' '}
                                        <Link href={route('fleet.sewa-alat.create')} className="text-blue-600 font-semibold">Catat sekarang →</Link>
                                    </td>
                                </tr>
                            )}
                            {sewaList?.data?.map((s) => {
                                const totalHm = (s.hm_akhir ?? 0) - (s.hm_awal ?? 0);
                                const totalPendapatan = totalHm * (s.tarif_per_jam ?? 0);
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-slate-800">{s.armada?.nama_unit}</p>
                                            <p className="text-xs text-slate-500">{s.armada?.nomor_polisi}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{s.nama_pelanggan ?? '–'}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {s.tanggal_mulai} – {s.tanggal_selesai ?? '…'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{s.hm_awal}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{s.hm_akhir ?? '–'}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">{totalHm > 0 ? totalHm + ' HM' : '–'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            Rp {Number(s.tarif_per_jam ?? 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                                            {totalPendapatan > 0 ? 'Rp ' + totalPendapatan.toLocaleString('id-ID') : '–'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                                {s.status}
                                            </span>
                                        </td>
<td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <Link href={route('fleet.armada.show', s.armada_id)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                                <Eye className="w-3 h-3" /> Detail
                            </Link>
                            <Link href={route('fleet.sewa-alat.serah-terima.show', s.id)}
                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-semibold">
                                <Clock className="w-3 h-3" /> Serah Terima
                            </Link>
                        </div>
                    </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {sewaList?.links && (
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan {sewaList.from ?? 0}–{sewaList.to ?? 0} dari {sewaList.total ?? 0} data
                        </p>
                        <div className="flex gap-1">
                            {sewaList.links.map((link, i) => (
                                <button key={i} disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    className={`px-3 py-1 rounded text-xs font-medium border transition
                                        ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40'}`}
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
