import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Search, Eye, Plus, AlertTriangle } from 'lucide-react';

export default function Index({ bbmLogs, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [tanggal_from, setTanggalFrom] = useState(filters.tanggal_from || '');
    const [tanggal_to, setTanggalTo] = useState(filters.tanggal_to || '');

    const handleSearch = () => {
        router.get(route('fleet.bbm.index'), { search, tanggal_from, tanggal_to });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    const isAnomaly = (item) => {
        // Di sini akses accessor is_anomaly dari model
        return item.is_anomaly || false;
    };

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Pencatatan BBM</h1>
                <div className="flex gap-2">
                    <Link
                        href={route('fleet.bbm.anomaly')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-1"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Anomali
                    </Link>
                    <Link
                        href={route('fleet.bbm.create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Catat BBM
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari unit..."
                                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button onClick={handleSearch} className="bg-gray-50 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 hover:bg-gray-100">
                                <Search className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dari</label>
                        <input
                            type="date"
                            value={tanggal_from}
                            onChange={(e) => setTanggalFrom(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sampai</label>
                        <input
                            type="date"
                            value={tanggal_to}
                            onChange={(e) => setTanggalTo(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Liter</div>
                    <div className="text-2xl font-bold">{bbmLogs.stats?.total_liter || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Biaya</div>
                    <div className="text-2xl font-bold">{formatCurrency(bbmLogs.stats?.total_biaya || 0)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Rata-rata / Liter</div>
                    <div className="text-2xl font-bold">{formatCurrency(bbmLogs.stats?.rata_harga || 0)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Unit</div>
                    <div className="text-2xl font-bold">{bbmLogs.stats?.total_unit || 0}</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Liter</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Biaya</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bbmLogs.data?.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            bbmLogs.data?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.serviceable?.nama || item.serviceable?.plat_nomor || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                        {item.liter} L
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                        {formatCurrency(item.biaya)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isAnomaly(item) ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800 flex items-center gap-1 w-fit">
                                                <AlertTriangle className="w-3 h-3" /> Anomali
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">Normal</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link href={route('fleet.bbm.show', item.id)} className="text-blue-600 hover:text-blue-900">
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}