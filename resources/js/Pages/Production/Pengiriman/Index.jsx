import React from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { Truck, CheckCircle2, Play, Search, XCircle } from 'lucide-react';

export default function Index({ pengirimen, filters }) {
    const { data, setData, get } = useForm({
        status: filters.status || '',
        tanggal: filters.tanggal || '',
    });

    const handleFilter = (e) => {
        e.preventDefault();
        get(route('production.pengiriman.index'));
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'dijadwalkan': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'dalam_perjalanan': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'selesai': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'dibatalkan': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pengiriman Produksi</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola jadwal dan riwayat pengiriman produk beton ke proyek/customer.</p>
                </div>
                <Link href={route('production.pengiriman.create')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                    <Truck className="w-4 h-4" /> Jadwalkan Baru
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
                <form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                        <select value={data.status} onChange={e => setData('status', e.target.value)} className="border-gray-300 rounded-lg text-sm focus:ring-blue-300">
                            <option value="">Semua Status</option>
                            <option value="dijadwalkan">Dijadwalkan</option>
                            <option value="dalam_perjalanan">Dalam Perjalanan</option>
                            <option value="selesai">Selesai</option>
                            <option value="dibatalkan">Dibatalkan</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Muat</label>
                        <input type="date" value={data.tanggal} onChange={e => setData('tanggal', e.target.value)} className="border-gray-300 rounded-lg text-sm focus:ring-blue-300" />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <Search className="w-4 h-4" /> Filter
                    </button>
                    {(data.status || data.tanggal) && (
                        <Link href={route('production.pengiriman.index')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                            Reset
                        </Link>
                    )}
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Waktu Muat</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sesi / Produk</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tujuan</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Armada & Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {pengirimen.data.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">Tidak ada data pengiriman.</td></tr>
                        ) : pengirimen.data.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-700">{new Date(p.waktu_muat).toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-semibold text-gray-900">{p.session?.produk?.nama}</div>
                                    <div className="text-xs text-gray-500">Vol: {p.session?.hasil_output} {p.session?.produk?.satuan_output}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={p.tujuan_alamat}>{p.tujuan_alamat}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{p.armada?.nopol ?? '-'}</div>
                                    <div className="text-xs text-gray-500">{p.driver?.nama ?? '-'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(p.status)}`}>
                                        {p.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={route('production.pengiriman.show', p.id)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                        Detail
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination placeholder (assuming Inertia Links or standard paginator component usually goes here) */}
        </Layout>
    );
}
