import React, { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeft, Plus, Search, Edit, Eye, Trash2, MapPin } from 'lucide-react';

export default function Index({ proyek, titiks, filters }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const permissions = auth?.permissions || [];
    const roles = auth?.roles || [];

    const can = useMemo(() => ({
        createTitik: () => {
            if (roles.includes('Owner')) return true;
            if (roles.includes('Koordinator Procurement')
                || roles.includes('Koordinator GCS')
                || roles.includes('Koordinator CBP')
                || roles.includes('Koordinator AMP')
                || roles.includes('Koordinator SDM')) return true;
            return permissions.some(p => ['manage titik', 'manage proyek'].includes(p));
        },
        updateTitik: () => {
            if (roles.includes('Owner')) return true;
            if (roles.includes('Koordinator Procurement')
                || roles.includes('Koordinator GCS')
                || roles.includes('Koordinator CBP')
                || roles.includes('Koordinator AMP')
                || roles.includes('Koordinator SDM')) return true;
            return permissions.some(p => ['manage titik', 'manage proyek'].includes(p));
        },
        deleteTitik: () => roles.includes('Owner'),
    }), [permissions, roles]);

    const handleSearch = () => {
        router.get(route('core.titik.index', proyek.id), {
            search,
            status: statusFilter,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        router.get(route('core.titik.index', proyek.id));
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('core.proyek.show', proyek.id)} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Titik Proyek</h1>
                    <p className="text-sm text-gray-500">{proyek.nama} ({proyek.kode_proyek})</p>
                </div>
                {can.createTitik() && (
                    <Link
                        href={route('core.titik.create', { proyek_id: proyek.id })}
                        className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Titik Baru
                    </Link>
                )}
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama titik..."
                                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={handleSearch}
                                className="bg-gray-50 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 hover:bg-gray-100"
                            >
                                <Search className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua</option>
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Titik</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Koordinat</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Radius</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {titiks.data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    Tidak ada titik
                                </td>
                            </tr>
                        ) : (
                            titiks.data.map((titik) => (
                                <tr key={titik.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {titik.nama}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                        {titik.latitude != null && titik.longitude != null ? (
                                            `${Number(titik.latitude).toFixed(6)}, ${Number(titik.longitude).toFixed(6)}`
                                        ) : (
                                            <span className="text-gray-400 italic">Belum ada koordinat</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {titik.radius_presensi_meter ?? 0}m
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            titik.status === 'nonaktif'
                                                ? 'bg-red-200 text-red-800'
                                                : 'bg-green-200 text-green-800'
                                        }`}>
                                            {titik.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                        <Link
                                            href={route('core.titik.show', titik.id)}
                                            className="text-blue-600 hover:text-blue-900 inline-block"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        {can.updateTitik() && (
                                            <Link
                                                href={route('core.titik.edit', titik.id)}
                                                className="text-yellow-600 hover:text-yellow-900 inline-block"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        )}
                                        {can.deleteTitik() && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Yakin hapus titik ini?')) {
                                                        router.delete(route('core.titik.destroy', titik.id));
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900 inline-block"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {titiks.from || 0} - {titiks.to || 0} dari {titiks.total || 0} data
                </div>
                <div className="flex gap-2">
                    {titiks.links && titiks.links.map((link, index) => (
                        <button
                            key={index}
                            onClick={() => link.url && router.get(link.url)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-3 py-1 border rounded ${link.active ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                            disabled={!link.url}
                        />
                    ))}
                </div>
            </div>
        </Layout>
    );
}
