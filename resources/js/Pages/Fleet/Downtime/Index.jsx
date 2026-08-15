import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Search, Plus, Clock, CheckCircle } from 'lucide-react';

export default function Index({ downtimes, filters, serviceable, serviceableType }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const indexRoute = (params = {}) => route('fleet.downtime.index', {
        type: serviceableType,
        id: serviceable?.id,
        ...params,
    });

    const handleSearch = () => {
        router.get(indexRoute(), { search, status });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        router.get(indexRoute());
    };

    const formatDuration = (start, end) => {
        if (!start) return '-';
        const diff = end ? new Date(end) - new Date(start) : new Date() - new Date(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const getStatusBadge = (start, end) => {
        if (!end) {
            return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Aktif</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Selesai</span>;
    };

    const getKategoriBadge = (kategori) => {
        const colors = {
            kerusakan: 'bg-red-100 text-red-800',
            menunggu_sparepart: 'bg-yellow-100 text-yellow-800',
            lainnya: 'bg-gray-100 text-gray-800',
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[kategori] || colors.lainnya}`}>{kategori}</span>;
    };

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Downtime Log</h1>
                <Link
                    href={route('fleet.downtime.create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Mulai Downtime
                </Link>
            </div>

            {/* Filter */}
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
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua</option>
                            <option value="active">Aktif</option>
                            <option value="done">Selesai</option>
                        </select>
                    </div>
                    <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">Reset</button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mulai</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selesai</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durasi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {downtimes.data?.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            downtimes.data?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.serviceable?.nama || item.serviceable?.plat_nomor || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getKategoriBadge(item.kategori)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(item.mulai).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.selesai ? new Date(item.selesai).toLocaleString('id-ID') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {formatDuration(item.mulai, item.selesai)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.mulai, item.selesai)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                        {!item.selesai && (
                                            <Link
                                                method="post"
                                                href={route('fleet.downtime.end', item.id)}
                                                as="button"
                                                className="text-green-600 hover:text-green-900 inline-block"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">Menampilkan {downtimes.from || 0} - {downtimes.to || 0} dari {downtimes.total || 0} data</div>
                <div className="flex gap-2">
                    {downtimes.links?.map((link, index) => (
                        <button key={index} onClick={() => link.url && router.get(link.url)} dangerouslySetInnerHTML={{ __html: link.label }} className={`px-3 py-1 border rounded ${link.active ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`} disabled={!link.url} />
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}