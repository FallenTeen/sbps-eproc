import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Search, Eye, Download } from 'lucide-react';

export default function Index({ logs, modelTypes = [], filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [modelType, setModelType] = useState(filters.model_type || '');
    const [event, setEvent] = useState(filters.event || '');
    const [tanggalFrom, setTanggalFrom] = useState(filters.tanggal_from || '');
    const [tanggalTo, setTanggalTo] = useState(filters.tanggal_to || '');

    const handleSearch = () => {
        router.get(route('audit.logs'), {
            search,
            model_type: modelType,
            event,
            tanggal_from: tanggalFrom,
            tanggal_to: tanggalTo,
        });
    };

    const handleExport = () => {
        router.get(route('audit.logs.export'), {
            search,
            model_type: modelType,
            event,
            tanggal_from: tanggalFrom,
            tanggal_to: tanggalTo,
        });
    };

    const getActionBadge = (action) => {
        const colors = {
            created: 'bg-green-200 text-green-800',
            updated: 'bg-blue-200 text-blue-800',
            deleted: 'bg-red-200 text-red-800',
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[action] || 'bg-gray-200 text-gray-800'}`}>{action}</span>;
    };

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                <button
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-1 text-sm font-semibold"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Cari deskripsi, model..."
                                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2"
                            />
                            <button onClick={handleSearch} className="bg-gray-50 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 hover:bg-gray-100">
                                <Search className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                    <div className="w-56">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                        <select value={modelType} onChange={(e) => setModelType(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="">Semua</option>
                            {modelTypes.map((m) => (
                                <option key={m} value={m}>{m.split('\\').pop()}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-40">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aksi</label>
                        <select value={event} onChange={(e) => setEvent(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="">Semua</option>
                            <option value="created">Created</option>
                            <option value="updated">Updated</option>
                            <option value="deleted">Deleted</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dari</label>
                        <input type="date" value={tanggalFrom} onChange={(e) => setTanggalFrom(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sampai</label>
                        <input type="date" value={tanggalTo} onChange={(e) => setTanggalTo(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <button onClick={handleSearch} className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-semibold">
                        Filter
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Waktu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Model</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Aksi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Deskripsi</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.data?.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            logs.data?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(item.created_at).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.causer?.name || 'System'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.subject_type?.split('\\').pop() || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getActionBadge(item.event)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{item.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link href={route('audit.logs.show', item.id)} className="text-blue-600 hover:text-blue-900">
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {logs.from || 0} - {logs.to || 0} dari {logs.total || 0} data
                </div>
                <div className="flex gap-2">
                    {logs.links?.map((link, index) => (
                        <button
                            key={index}
                            onClick={() => link.url && router.get(link.url)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-3 py-1 border rounded ${link.active ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-100'}`}
                            disabled={!link.url}
                        />
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}