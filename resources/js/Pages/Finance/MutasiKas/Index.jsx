import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Search, Eye, Download, Filter } from 'lucide-react';

export default function Index({ mutasis, akunKasList, filters }) {
    const { auth } = usePage().props;
    const [akunId, setAkunId] = useState(filters.akun_kas_bank_id || '');
    const [tanggalFrom, setTanggalFrom] = useState(filters.tanggal_from || '');
    const [tanggalTo, setTanggalTo] = useState(filters.tanggal_to || '');
    const [tipe, setTipe] = useState(filters.tipe || '');

    const handleSearch = () => {
        router.get(route('finance.mutasi-kas.index'), { akun_kas_bank_id: akunId, tanggal_from: tanggalFrom, tanggal_to: tanggalTo, tipe });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    const getTipeBadge = (tipe) => {
        return tipe === 'masuk'
            ? <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">⬆️ Masuk</span>
            : <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800">⬇️ Keluar</span>;
    };

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mutasi Kas/Bank</h1>
                <div className="flex gap-2">
                    <Link href={route('finance.mutasi-kas.report')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-1">
                        <Download className="w-4 h-4" /> Laporan
                    </Link>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Akun Kas/Bank</label>
                        <select
                            value={akunId}
                            onChange={(e) => setAkunId(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua Akun</option>
                            {akunKasList?.map((akun) => (
                                <option key={akun.id} value={akun.id}>{akun.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dari</label>
                        <input type="date" value={tanggalFrom} onChange={(e) => setTanggalFrom(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sampai</label>
                        <input type="date" value={tanggalTo} onChange={(e) => setTanggalTo(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="w-40">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                        <select value={tipe} onChange={(e) => setTipe(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Semua</option>
                            <option value="masuk">Masuk</option>
                            <option value="keluar">Keluar</option>
                        </select>
                    </div>
                    <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akun</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referensi</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {mutasis.data?.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            mutasis.data?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.akun_kas_bank?.nama || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.kategori}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getTipeBadge(item.tipe)}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${item.tipe === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(item.jumlah)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.referensi_type ? item.referensi_type.split('\\').pop() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link href={route('finance.mutasi-kas.show', item.id)} className="text-blue-600 hover:text-blue-900 inline-block">
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Saldo Ringkas */}
            {mutasis.saldo && (
                <div className="mt-4 bg-white rounded-lg shadow p-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div><strong>Saldo Awal:</strong> {formatCurrency(mutasis.saldo.saldo_awal)}</div>
                        <div><strong>Total Masuk:</strong> <span className="text-green-600">{formatCurrency(mutasis.saldo.total_masuk)}</span></div>
                        <div><strong>Total Keluar:</strong> <span className="text-red-600">{formatCurrency(mutasis.saldo.total_keluar)}</span></div>
                        <div className="col-span-3"><strong>Saldo Akhir:</strong> {formatCurrency(mutasis.saldo.saldo_akhir)}</div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}