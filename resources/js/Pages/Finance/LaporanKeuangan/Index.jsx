import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { BarChart3, PieChart, DollarSign, TrendingUp, Calendar, Building2, ArrowRight } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index({ auth, unitBisnisList = [], filters = {} }) {

    const handleFilterChange = (key, value) => {
        router.get(route('laporan-keuangan.index'), {
            ...filters,
            [key]: value
        }, { preserveState: true });
    };

    const months = [
        { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
        { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
        { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
        { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Pusat Laporan Keuangan</h2>}
        >
            <Head title="Laporan Keuangan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Period & Unit Bisnis Filter */}
                    <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                                    <Building2 className="w-3.5 h-3.5 mr-1" /> Unit Bisnis
                                </label>
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
                                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                                    <Calendar className="w-3.5 h-3.5 mr-1" /> Bulan
                                </label>
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
                                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                                    <Calendar className="w-3.5 h-3.5 mr-1" /> Tahun
                                </label>
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
                    </div>

                    {/* Report Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* RAB vs Realisasi Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                            <div className="space-y-4">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg w-fit">
                                    <BarChart3 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Laporan RAB vs Realisasi</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Perbandingan anggaran Rencana Anggaran Biaya (RAB) dengan realisasi pengeluaran fisik per proyek dan per titik lokasi operasional.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t flex justify-end">
                                <Link href={route('laporan-keuangan.rab-realisasi', { unit_bisnis_id: filters.unit_bisnis_id })}>
                                    <PrimaryButton className="flex items-center gap-2">
                                        Buka Laporan <ArrowRight className="w-4 h-4" />
                                    </PrimaryButton>
                                </Link>
                            </div>
                        </div>

                        {/* Laba Rugi Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                            <div className="space-y-4">
                                <div className="p-3 bg-green-100 text-green-600 rounded-lg w-fit">
                                    <TrendingUp className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Laporan Laba Rugi Unit Bisnis</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Konsolidasi pendapatan dari invoice terbit dan rincian beban pengeluaran (Material, Ritase, Produksi, Gaji) per unit bisnis.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t flex justify-end">
                                <Link href={route('laporan-keuangan.laba-rugi', { unit_bisnis_id: filters.unit_bisnis_id, bulan: filters.bulan, tahun: filters.tahun })}>
                                    <PrimaryButton className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                                        Buka Laporan <ArrowRight className="w-4 h-4" />
                                    </PrimaryButton>
                                </Link>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
