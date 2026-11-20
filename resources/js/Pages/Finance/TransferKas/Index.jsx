import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { Eye, Plus, ArrowRight } from 'lucide-react';

export default function Index({ transfers, akunList, filters, sort, direction }) {
    const formatCurrency = (value) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);

    const akunOptions = (akunList ?? []).map((a) => ({ value: String(a.id), label: a.nama }));

    const columns = [
        {
            key: 'tanggal',
            label: 'Tanggal',
            type: 'dateRange',
            render: (item) => new Date(item.tanggal).toLocaleDateString('id-ID'),
        },
        {
            key: 'dari',
            label: 'Dari',
            type: 'select',
            options: akunOptions,
            render: (item) => item.dari_akun?.nama || '-',
        },
        {
            key: 'ke',
            label: 'Ke',
            type: 'select',
            options: akunOptions,
            render: (item) => item.ke_akun?.nama || '-',
        },
        {
            key: 'jumlah',
            label: 'Jumlah',
            search: false,
            align: 'right',
            cellClassName: 'px-4 py-3 text-right text-sm font-medium',
            render: (item) => formatCurrency(item.jumlah),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 text-right text-sm',
            render: (item) => (
                <Link href={route('finance.transfer-kas.show', item.id)} className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4 inline" />
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Transfer Antar Kas</h1>
                <Link href={route('finance.transfer-kas.create')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Transfer
                </Link>
            </div>

            <DataTable
                routeName="finance.transfer-kas.index"
                columns={columns}
                rows={transfers}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
