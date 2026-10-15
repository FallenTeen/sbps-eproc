import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import { Plus, Eye, AlertCircle } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Index({ auth, invoices, unitBisnisList = [], statusFilter = 'all', selectedUnit = '', filters, sort, direction }) {
    const applyTopFilter = (key, value) => {
        const status = key === 'status' ? value : statusFilter;
        const unit = key === 'unit_bisnis_id' ? value : selectedUnit;

        const params = {};
        if (status && status !== 'all') params.status = status;
        if (unit) params.unit_bisnis_id = unit;
        if (filters && Object.keys(filters).length) params.filters = filters;
        if (sort) {
            params.sort = sort;
            params.direction = direction;
        }

        router.get(route('finance.invoice.index'), params, { preserveState: true });
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

    const columns = [
        {
            key: 'kode_invoice',
            label: 'Kode Invoice',
            type: 'text',
            cellClassName: 'px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600',
        },
        {
            key: 'unit_bisnis',
            label: 'Unit Bisnis',
            search: false,
            sortable: false,
        },
        {
            key: 'proyek_klien',
            label: 'Proyek / Klien',
            type: 'text',
            cellClassName: 'px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium',
        },
        {
            key: 'total',
            label: 'Total (Rp)',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 whitespace-nowrap text-sm font-bold text-right text-gray-900',
            render: (inv) => `Rp ${Number(inv.total).toLocaleString('id-ID')}`,
        },
        {
            key: 'status',
            label: 'Status',
            search: false,
            render: (inv) => getStatusBadge(inv.status),
        },
        {
            key: 'tanggal_jatuh_tempo',
            label: 'Jatuh Tempo',
            type: 'dateRange',
            render: (inv) => (inv.tanggal_jatuh_tempo ? new Date(inv.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 whitespace-nowrap text-right text-sm font-medium',
            render: (inv) => (
                <Link href={route('finance.invoice.show', inv.id)} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-medium">
                    <Eye className="w-4 h-4 mr-1" /> Detail
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Daftar Invoice & Tagihan</h2>}
        >
            <Head title="Daftar Invoice" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Status Invoice</label>
                                <select
                                    className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={statusFilter || 'all'}
                                    onChange={(e) => applyTopFilter('status', e.target.value)}
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
                                    value={selectedUnit || ''}
                                    onChange={(e) => applyTopFilter('unit_bisnis_id', e.target.value)}
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

                    <DataTable
                        routeName="finance.invoice.index"
                        baseParams={{ status: statusFilter !== 'all' ? statusFilter : '', unit_bisnis_id: selectedUnit }}
                        columns={columns}
                        rows={invoices}
                        filters={filters}
                        sort={sort}
                        direction={direction}
                        emptyMessage="Tidak ada data invoice yang sesuai dengan filter."
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
