import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { MessageSquare, Search, ArrowRight, Building2 } from 'lucide-react';

function formatWaktu(value) {
    if (!value) return 'Belum ada pesan';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Belum ada pesan';
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getStatusBadge(status) {
    const colors = {
        draft: 'bg-gray-200 text-gray-800',
        aktif: 'bg-green-200 text-green-800',
        selesai: 'bg-blue-200 text-blue-800',
        dihentikan: 'bg-red-200 text-red-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
}

export default function Index({ proyeks, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get(route('komunikasi.index'), { search }, { preserveState: true });
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Komunikasi Proyek</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Thread kantor ↔ kontraktor per proyek (scoping sesuai unit/role Anda).
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Cari kode / nama / client proyek..."
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSearch}
                                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                Cari
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Proyek */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {proyeks.data && proyeks.data.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        Tidak ada proyek yang bisa diakses.
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {proyeks.data.map((proyek) => (
                            <li key={proyek.id}>
                                <Link
                                    href={route('komunikasi.show', proyek.id)}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
                                >
                                    <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-gray-900">{proyek.nama}</span>
                                            <span className="text-xs font-mono text-gray-500">{proyek.kode_proyek}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(proyek.status)}`}>
                                                {proyek.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-3.5 h-3.5" /> {(proyek.unit_bisnis && proyek.unit_bisnis.nama) || '-'}
                                            </span>
                                            {proyek.client && <span>Klien: {proyek.client}</span>}
                                            <span>
                                                {proyek.pesan_count || 0} pesan · terakhir {formatWaktu(proyek.komunikasi_logs_max_created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {proyeks.from || 0} - {proyeks.to || 0} dari {proyeks.total || 0} data
                </div>
                <div className="flex gap-2">
                    {proyeks.links && proyeks.links.map((link, index) => (
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