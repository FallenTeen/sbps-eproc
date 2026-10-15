import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { Eye, Download } from 'lucide-react';

export default function Index({ mutasis, akunList, filters, sort, direction }) {
    const formatCurrency = (value) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);

    const getTipeBadge = (tipe) =>
        tipe === 'masuk' ? (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">Masuk</span>
        ) : (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800">Keluar</span>
        );

    const columns = [
        {
            key: 'tanggal',
            label: 'Tanggal',
            type: 'dateRange',
            render: (item) => new Date(item.tanggal).toLocaleDateString('id-ID'),
        },
        {
            key: 'akun',
            label: 'Akun',
            type: 'select',
            options: (akunList ?? []).map((a) => ({ value: String(a.id), label: a.nama })),
            render: (item) => item.akun_kas_bank?.nama || '-',
        },
        { key: 'kategori', label: 'Kategori', type: 'text' },
        { key: 'tipe', label: 'Tipe', type: 'select', options: [
            { value: 'masuk', label: 'Masuk' },
            { value: 'keluar', label: 'Keluar' },
        ], render: (item) => getTipeBadge(item.tipe) },
        {
            key: 'jumlah',
            label: 'Jumlah',
            search: false,
            align: 'right',
            render: (item) => (
                <span className={item.tipe === 'masuk' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {formatCurrency(item.jumlah)}
                </span>
            ),
        },
        {
            key: 'referensi',
            label: 'Referensi',
            search: false,
            sortable: false,
            render: (item) => (item.referensi_type ? item.referensi_type.split('\\').pop() : '-'),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 text-right text-sm',
            render: (item) => (
                <Link href={route('finance.mutasi-kas.show', item.id)} className="text-blue-600 hover:text-blue-900 inline-block">
                    <Eye className="w-4 h-4" />
                </Link>
            ),
        },
    ];

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

            <DataTable
                routeName="finance.mutasi-kas.index"
                columns={columns}
                rows={mutasis}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
