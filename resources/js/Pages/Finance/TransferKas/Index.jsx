import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Search, Eye, Plus, ArrowRight } from 'lucide-react';

export default function Index({ transfers, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [tanggalFrom, setTanggalFrom] = useState(filters.tanggal_from || '');
    const [tanggalTo, setTanggalTo] = useState(filters.tanggal_to || '');

    const handleSearch = () => {
        router.get(route('finance.transfer-kas.index'), { search, tanggal_from: tanggalFrom, tanggal_to: tanggalTo });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Transfer Antar Kas</h1>
                <Link href={route('finance.transfer-kas.create')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Transfer
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <div className="flex">
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari..." className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                            <button onClick={handleSearch} className="bg-gray-50 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 hover:bg-gray-100"><Search className="w-4 h-4 text-gray-600" /></button>
                        </div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Dari</label><input type="date" value={tanggalFrom} onChange={(e) => setTanggalFrom(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Sampai</label><input type="date" value={tanggalTo} onChange={(e) => setTanggalTo(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2" /></div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dari</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ke</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transfers.data?.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            transfers.data?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.dari_akun?.nama || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center"><ArrowRight className="w-4 h-4 inline text-gray-400" /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.ke_akun?.nama || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">{formatCurrency(item.jumlah)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link href={route('finance.transfer-kas.show', item.id)} className="text-blue-600 hover:text-blue-900"><Eye className="w-4 h-4" /></Link>
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