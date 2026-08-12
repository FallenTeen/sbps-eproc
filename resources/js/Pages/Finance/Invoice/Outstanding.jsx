import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { ArrowLeft, AlertCircle, Clock, Calendar, ShieldAlert } from 'lucide-react';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Outstanding({ auth, invoices = [], unitBisnisList = [], proyekList = [], summary = {}, filters = {} }) {

    const handleFilterChange = (key, value) => {
        router.get(route('finance.invoice.outstanding'), {
            ...filters,
            [key]: value
        }, { preserveState: true });
    };

    const getAgingBadge = (category) => {
        switch (category) {
            case '0-30 Hari':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">0 - 30 Hari</span>;
            case '31-60 Hari':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">31 - 60 Hari</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 font-bold">&gt; 60 Hari</span>;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('finance.invoice.index')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Laporan Piutang Outstanding & Aging Report
                    </h2>
                </div>
            }
        >
            <Head title="Piutang Outstanding" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Summary Aging Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
                            <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1 text-indigo-600" /> Total Outstanding
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(summary.total_outstanding || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                            <div className="text-sm font-medium text-green-600 mb-1 flex items-center">
                                <Clock className="w-4 h-4 mr-1" /> Aging 0 – 30 Hari
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(summary.aging_0_30 || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
                            <div className="text-sm font-medium text-amber-600 mb-1 flex items-center">
                                <Calendar className="w-4 h-4 mr-1" /> Aging 31 – 60 Hari
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(summary.aging_31_60 || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-600">
                            <div className="text-sm font-medium text-red-600 mb-1 flex items-center">
                                <ShieldAlert className="w-4 h-4 mr-1" /> Aging &gt; 60 Hari
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                                Rp {Number(summary.aging_over_60 || 0).toLocaleString('id-ID')}
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar */}
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
                                <label className="block text-xs font-medium text-gray-500 mb-1">Proyek / Klien</label>
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

                        <Link href={route('finance.invoice.index')}>
                            <SecondaryButton>Kembali ke Daftar Invoice</SecondaryButton>
                        </Link>
                    </div>

                    {/* Table Data */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Invoice</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Bisnis</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyek / Klien</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jatuh Tempo</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sisa Piutang</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Umur (Hari)</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori Aging</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                                Tidak ada piutang outstanding untuk filter saat ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                                                    {inv.kode_invoice}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {inv.unit_bisnis}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {inv.proyek_klien}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                                    {inv.tanggal_jatuh_tempo ? new Date(inv.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-red-600">
                                                    Rp {Number(inv.sisa).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-700">
                                                    {inv.age_days} hari
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {getAgingBadge(inv.aging_category)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <Link
                                                        href={route('finance.invoice.show', inv.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Detail
                                                    </Link>
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
