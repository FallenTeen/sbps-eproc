import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Search, Eye, Plus, Calendar, Check, X } from 'lucide-react';

export default function Index({ checklists, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [tanggal, setTanggal] = useState(filters.tanggal || new Date().toISOString().split('T')[0]);

    const handleSearch = () => {
        router.get(route('fleet.checklist.index'), { search, tanggal });
    };

    const getStatusBadge = (kondisi) => {
        return kondisi
            ? <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800 flex items-center gap-1"><Check className="w-3 h-3" /> Baik</span>
            : <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800 flex items-center gap-1"><X className="w-3 h-3" /> Bermasalah</span>;
    };

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Checklist Harian</h1>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={() => router.get(route('fleet.checklist.index'), { tanggal })}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-1"
                    >
                        <Calendar className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            {/* Stats Ringkas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Checklist</div>
                    <div className="text-2xl font-bold">{checklists.total || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Kondisi Baik</div>
                    <div className="text-2xl font-bold text-green-600">{checklists.stats?.baik || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Bermasalah</div>
                    <div className="text-2xl font-bold text-red-600">{checklists.stats?.bermasalah || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Unit Dicek</div>
                    <div className="text-2xl font-bold">{checklists.stats?.unit_dicek || 0}</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kondisi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dicatat Oleh</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {checklists.data?.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td>
                            </tr>
                        ) : (
                            checklists.data?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.checkable?.nama || item.checkable?.plat_nomor || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.checkable_type === 'armada' ? '🚛 Armada' : '🏭 Mesin'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(item.kondisi_baik)}
                                        {!item.kondisi_baik && item.item_bermasalah && (
                                            <span className="ml-2 text-xs text-gray-500">({item.item_bermasalah})</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.dicatat_oleh?.nama || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link
                                            href={route('fleet.checklist.show', item.id)}
                                            className="text-blue-600 hover:text-blue-900 inline-block"
                                        >
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