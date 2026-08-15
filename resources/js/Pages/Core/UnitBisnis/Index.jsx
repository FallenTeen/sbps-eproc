import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Search, Edit, Eye, Trash2, Check, X } from 'lucide-react';

export default function Index({ unitBisnis, filters }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get(route('core.unit-bisnis.index'), { search });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(route('core.unit-bisnis.index'));
    };

    const can = (permission) => auth.permissions?.includes(permission);

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Unit Bisnis</h1>
                {can('create unit bisnis') && (
                    <Link
                        href={route('core.unit-bisnis.create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Unit
                    </Link>
                )}
            </div>

            {/* Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode / nama..."
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
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {unitBisnis.data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td>
                            </tr>
                        ) : (
                            unitBisnis.data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.kode}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.nama}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                        {item.deskripsi || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.aktif ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {item.aktif ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                        <Link
                                            href={route('core.unit-bisnis.show', item.id)}
                                            className="text-blue-600 hover:text-blue-900 inline-block"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        {can('edit unit bisnis') && (
                                            <Link
                                                href={route('core.unit-bisnis.edit', item.id)}
                                                className="text-yellow-600 hover:text-yellow-900 inline-block"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        )}
                                        {can('delete unit bisnis') && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Yakin hapus unit ini?')) {
                                                        router.delete(route('core.unit-bisnis.destroy', item.id));
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

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {unitBisnis.from || 0} - {unitBisnis.to || 0} dari {unitBisnis.total || 0} data
                </div>
                <div className="flex gap-2">
                    {unitBisnis.links?.map((link, index) => (
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
        </AuthenticatedLayout>
    );
}