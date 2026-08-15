import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Download } from 'lucide-react';

export default function Report({ reportData, filters }) {
    const [bulan, setBulan] = useState(filters.bulan || new Date().getMonth() + 1);
    const [tahun, setTahun] = useState(filters.tahun || new Date().getFullYear());

    const handleGenerate = () => {
        router.get(route('finance.mutasi-kas.report'), { bulan, tahun });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Laporan Mutasi Kas</h1>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                        <select value={bulan} onChange={(e) => setBulan(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>{new Date(2024, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                        <input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 w-24" />
                    </div>
                    <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Generate</button>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-1">
                        <Download className="w-4 h-4" /> Export Excel
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akun</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Awal</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Masuk</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Keluar</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Akhir</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData?.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            reportData?.map((item) => (
                                <tr key={item.akun_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.akun_nama}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatCurrency(item.saldo_awal)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">{formatCurrency(item.total_masuk)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">{formatCurrency(item.total_keluar)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">{formatCurrency(item.saldo_akhir)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}