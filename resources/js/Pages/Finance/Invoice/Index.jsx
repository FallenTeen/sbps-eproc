import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { Plus, Eye, FileText, AlertCircle } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Index({ auth, invoices = [], unitBisnisList = [], filters = {} }) {

    const handleFilterChange = (key, value) => {
        router.get(route('finance.invoice.index'), {
            ...filters,
            [key]: value
        }, { preserveState: true });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'lunas':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Lunas</span>;
            case 'lunas_sebagian':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Lunas Sebagian</span>;
            case 'terkirim':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Terkirim</span>;
            case 'jatuh_tempo':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Jatuh Tempo</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Draft</span>;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Daftar Invoice & Tagihan</h2>}
        >
            <Head title="Daftar Invoice" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Actions & Filters */}
                    <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Status Invoice</label>
                                <select
                                    className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={filters.status || 'all'}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="terkirim">Terkirim</option>
                                    <option value="lunas_sebagian">Lunas Sebagian</option>
                                    <option value="lunas">Lunas</option>
                                    <option value="jatuh_tempo">Jatuh Tempo</option>
                                </select>
                            </div>

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
                        </div>

                        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                            <Link href={route('finance.invoice.outstanding')}>
                                <SecondaryButton className="flex items-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                                    <AlertCircle className="w-4 h-4" /> Piutang Outstanding
                                </SecondaryButton>
                            </Link>
                            <Link href={route('finance.invoice.create')}>
                                <PrimaryButton className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Buat Invoice
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>

                    {/* Invoice Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Invoice</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Bisnis</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyek / Klien</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total (Rp)</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jatuh Tempo</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                Tidak ada data invoice yang sesuai dengan filter.
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900">
                                                    Rp {Number(inv.total).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {getStatusBadge(inv.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                                    {inv.tanggal_jatuh_tempo ? new Date(inv.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <Link
                                                        href={route('finance.invoice.show', inv.id)}
                                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-medium"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" /> Detail
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
