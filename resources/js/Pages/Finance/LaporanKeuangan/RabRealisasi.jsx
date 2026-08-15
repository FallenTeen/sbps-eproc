import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { ArrowLeft, Download, BarChart3, TrendingUp, AlertCircle, PieChart } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RabRealisasi({ auth, items = [], unitBisnisList = [], proyekList = [], summary = {}, filters = {} }) {

    const handleFilterChange = (key, value) => {
        router.get(route('finance.laporan-keuangan.rab-realisasi'), {
            ...filters,
            [key]: value
        }, { preserveState: true });
    };

    const exportToExcel = () => {
        const params = new URLSearchParams({
            type: 'rab_realisasi',
            unit_bisnis_id: filters.unit_bisnis_id || '',
            proyek_id: filters.proyek_id || '',
        });
        window.location.href = route('finance.laporan-keuangan.export-excel') + '?' + params.toString();
    };

    // Prepare chart data (limit top 10 items for readability if long)
    const chartData = items.slice(0, 10).map(item => ({
        name: item.deskripsi.length > 20 ? item.deskripsi.substring(0, 18) + '...' : item.deskripsi,
        Rencana: item.rencana,
        Realisasi: item.realisasi,
    }));

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('finance.laporan-keuangan.index')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Laporan Perbandingan RAB vs Realisasi
                    </h2>
                </div>
            }
        >
            <Head title="RAB vs Realisasi" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Rencana Anggaran (RAB)</div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(summary.total_rencana || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                            <div className="text-sm font-medium text-blue-600 mb-1">Total Realisasi Pengeluaran</div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(summary.total_realisasi || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
                            <div className="text-sm font-medium text-amber-600 mb-1">Selisih Anggaran</div>
                            <div className={`text-2xl font-bold ${summary.total_selisih < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                Rp {Number(summary.total_selisih || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                            <div className="text-sm font-medium text-purple-600 mb-1">Persentase Penyerapan</div>
                            <div className="text-2xl font-bold text-purple-700">
                                {summary.total_persentase || 0}%
                            </div>
                        </div>
                    </div>

                    {/* Filter & Export Bar */}
                    <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Unit Bisnis</label>
                                <select
                                    className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={filters.unit_bisnis_id || ''}
                                    onChange={(e) => handleFilterChange('unit_bisnis_id', e.target.value)}
                                >
                                    <option value="">Semua Unit Bisnis</option>
                                    {unitBisnisList.map((ub) => (
                                        <option key={ub.id} value={ub.id}>{ub.nama}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Proyek</label>
                                <select
                                    className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={filters.proyek_id || ''}
                                    onChange={(e) => handleFilterChange('proyek_id', e.target.value)}
                                >
                                    <option value="">Semua Proyek</option>
                                    {proyekList.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nama}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <SecondaryButton
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                        >
                            <Download className="w-4 h-4" /> Export ke Excel
                        </SecondaryButton>
                    </div>

                    {/* Recharts Graphical Visualization */}
                    <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" /> Grafik Perbandingan RAB vs Realisasi
                        </h3>

                        {chartData.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">Belum ada data untuk grafik.</div>
                        ) : (
                            <div className="h-80 w-full pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`} />
                                        <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                                        <Legend />
                                        <Bar dataKey="Rencana" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Realisasi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Data Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Rincian Anggaran & Realisasi</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyek</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titik</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rencana (Rp)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Realisasi (Rp)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Selisih (Rp)</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Penyerapan</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                Tidak ada data RAB untuk filter yang dipilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.proyek}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.titik}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{item.kategori.replace('_', ' ')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                                    Rp {Number(item.rencana).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                                                    Rp {Number(item.realisasi).toLocaleString('id-ID')}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${item.selisih < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    Rp {Number(item.selisih).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-purple-700">
                                                    {item.persentase}%
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
