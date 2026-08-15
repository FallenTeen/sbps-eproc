import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { ArrowLeft, Download, TrendingUp, DollarSign, PieChart as PieIcon, BarChart3, Building2 } from 'lucide-react';
import SecondaryButton from '@/Components/SecondaryButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function LabaRugi({ auth, reportUnits = [], unitBisnisList = [], summary = {}, filters = {} }) {

    const handleFilterChange = (key, value) => {
        router.get(route('finance.laporan-keuangan.laba-rugi'), {
            ...filters,
            [key]: value
        }, { preserveState: true });
    };

    const exportToExcel = () => {
        const params = new URLSearchParams({
            type: 'laba_rugi',
            unit_bisnis_id: filters.unit_bisnis_id || '',
            bulan: filters.bulan || '',
            tahun: filters.tahun || '',
        });
        window.location.href = route('finance.laporan-keuangan.export-excel') + '?' + params.toString();
    };

    const months = [
        { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
        { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
        { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
        { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    // Bar chart data: Pendapatan vs Beban per Unit
    const barData = reportUnits.map(unit => ({
        name: unit.unit_bisnis_nama,
        Pendapatan: unit.pendapatan,
        Beban: unit.total_beban,
        Laba: unit.laba_bersih,
    }));

    // Pie chart data: Total cost breakdown across selected units
    const totalPO = reportUnits.reduce((a, c) => a + c.beban_po, 0);
    const totalRitase = reportUnits.reduce((a, c) => a + c.beban_ritase, 0);
    const totalProduksi = reportUnits.reduce((a, c) => a + c.beban_produksi, 0);
    const totalGaji = reportUnits.reduce((a, c) => a + c.beban_gaji, 0);

    const pieData = [
        { name: 'Beban PO / Material', value: totalPO, color: '#f59e0b' },
        { name: 'Beban Ritase', value: totalRitase, color: '#3b82f6' },
        { name: 'Beban Produksi', value: totalProduksi, color: '#8b5cf6' },
        { name: 'Beban Gaji SDM', value: totalGaji, color: '#ec4899' },
    ].filter(item => item.value > 0);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('finance.laporan-keuangan.index')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Laporan Laba Rugi Unit Bisnis
                    </h2>
                </div>
            }
        >
            <Head title="Laporan Laba Rugi" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                            <div className="text-sm font-medium text-green-600 mb-1 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1" /> Total Pendapatan
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(summary.total_pendapatan || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                            <div className="text-sm font-medium text-red-600 mb-1 flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" /> Total Beban Pengeluaran
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(summary.total_beban || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
                            <div className="text-sm font-medium text-indigo-600 mb-1 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1" /> Total Laba Bersih
                            </div>
                            <div className={`text-2xl font-bold ${summary.total_laba_bersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Rp {Number(summary.total_laba_bersih || 0).toLocaleString('id-ID')}
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
                                <label className="block text-xs font-medium text-gray-500 mb-1">Bulan</label>
                                <select
                                    className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={filters.bulan || '01'}
                                    onChange={(e) => handleFilterChange('bulan', e.target.value)}
                                >
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Tahun</label>
                                <select
                                    className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={filters.tahun || currentYear.toString()}
                                    onChange={(e) => handleFilterChange('tahun', e.target.value)}
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
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

                    {/* Recharts Graphical Visualizations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Bar Chart: Pendapatan vs Beban */}
                        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" /> Pendapatan vs Total Beban
                            </h3>
                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`} />
                                        <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                                        <Legend />
                                        <Bar dataKey="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Beban" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart: Cost Breakdown */}
                        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                                <PieIcon className="w-5 h-5 text-purple-600" /> Komposisi Beban Pengeluaran
                            </h3>
                            {pieData.length === 0 ? (
                                <div className="py-16 text-center text-gray-500">Belum ada data pengeluaran.</div>
                            ) : (
                                <div className="h-72 w-full pt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={90}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Detailed Data Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Laba Rugi per Unit Bisnis</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Bisnis</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pendapatan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Beban Material</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Beban Ritase</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Beban Produksi</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Beban Gaji</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Beban</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Laba Bersih</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportUnits.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                                Tidak ada data laba rugi untuk periode yang dipilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportUnits.map((unit) => (
                                            <tr key={unit.unit_bisnis_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{unit.unit_bisnis_nama}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                                                    Rp {Number(unit.pendapatan).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                                    Rp {Number(unit.beban_po).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                                    Rp {Number(unit.beban_ritase).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                                    Rp {Number(unit.beban_produksi).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                                    Rp {Number(unit.beban_gaji).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
                                                    Rp {Number(unit.total_beban).toLocaleString('id-ID')}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${unit.laba_bersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    Rp {Number(unit.laba_bersih).toLocaleString('id-ID')}
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
