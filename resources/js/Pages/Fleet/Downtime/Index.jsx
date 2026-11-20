import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { Plus, Clock, CheckCircle } from 'lucide-react';

const KATEGORI_COLORS = {
    kerusakan: 'bg-red-100 text-red-800',
    menunggu_sparepart: 'bg-yellow-100 text-yellow-800',
    lainnya: 'bg-gray-100 text-gray-800',
};

export default function Index({ downtimes, filters = {}, sort, direction, serviceable, serviceableType }) {
    const formatDuration = (start, end) => {
        if (!start) return '-';
        const diff = end ? new Date(end) - new Date(start) : new Date() - new Date(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const columns = [
        {
            key: 'unit',
            label: 'Unit',
            search: false,
            sortable: false,
            cellClassName: 'px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900',
            render: (item) => item.serviceable?.nama || item.serviceable?.plat_nomor || '-',
        },
        {
            key: 'kategori',
            label: 'Kategori',
            type: 'select',
            options: [
                { value: 'kerusakan', label: 'Kerusakan' },
                { value: 'menunggu_sparepart', label: 'Menunggu Sparepart' },
                { value: 'lainnya', label: 'Lainnya' },
            ],
            cellClassName: 'px-4 py-3 whitespace-nowrap',
            render: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${KATEGORI_COLORS[item.kategori] || KATEGORI_COLORS.lainnya}`}>
                    {item.kategori}
                </span>
            ),
        },
        {
            key: 'mulai',
            label: 'Mulai',
            type: 'dateRange',
            cellClassName: 'px-4 py-3 whitespace-nowrap text-sm text-gray-600',
            render: (item) => new Date(item.mulai).toLocaleString('id-ID'),
        },
        {
            key: 'selesai',
            label: 'Selesai',
            search: false,
            cellClassName: 'px-4 py-3 whitespace-nowrap text-sm text-gray-600',
            render: (item) => (item.selesai ? new Date(item.selesai).toLocaleString('id-ID') : '-'),
        },
        {
            key: 'durasi',
            label: 'Durasi',
            search: false,
            sortable: false,
            cellClassName: 'px-4 py-3 whitespace-nowrap text-sm text-gray-600',
            render: (item) => formatDuration(item.mulai, item.selesai),
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'active', label: 'Aktif' },
                { value: 'done', label: 'Selesai' },
            ],
            sortable: false,
            cellClassName: 'px-4 py-3 whitespace-nowrap',
            render: (item) =>
                !item.selesai ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" /> Aktif
                    </span>
                ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800 flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" /> Selesai
                    </span>
                ),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 whitespace-nowrap text-right text-sm',
            render: (item) =>
                !item.selesai && (
                    <Link
                        method="post"
                        href={route('fleet.downtime.end', item.id)}
                        as="button"
                        className="text-green-600 hover:text-green-900 inline-block"
                        title="Selesaikan downtime"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </Link>
                ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Downtime Log</h1>
                <Link
                    href={route('fleet.downtime.create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Mulai Downtime
                </Link>
            </div>

            <DataTable
                routeName="fleet.downtime.index"
                routeParams={{ type: serviceableType, id: serviceable?.id }}
                columns={columns}
                rows={downtimes}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada data downtime."
            />
        </AuthenticatedLayout>
    );
}
