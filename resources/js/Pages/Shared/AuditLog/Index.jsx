import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { ArrowDownToLine, ArrowRight } from 'lucide-react';
import { formatTanggalWaktu } from '@/utils/date';
import { getAuditActionLabel, getAuditSubjectLabel } from '@/utils/auditLog';

export default function Index({ logs, modelTypes = [], filters, sort, direction }) {
    const handleExport = () => {
        const query = window.location.search;
        window.location.href = route('audit.logs.export') + query;
    };

    const getActionBadge = (action) => {
        const colors = {
            created: 'bg-green-200 text-green-800',
            updated: 'bg-blue-200 text-blue-800',
            deleted: 'bg-red-200 text-red-800',
        };
        return (
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${colors[action] || 'bg-gray-200 text-gray-800'}`}>
                {getAuditActionLabel(action)}
            </span>
        );
    };

    const columns = [
        {
            key: 'created_at',
            label: 'Tanggal dan waktu',
            type: 'dateRange',
            render: (item) => formatTanggalWaktu(item.created_at),
        },
        {
            key: 'user',
            label: 'Dilakukan oleh',
            type: 'text',
            placeholder: 'Cari nama pengguna',
            render: (item) => item.causer?.name || item.causer?.nama_lengkap || 'Sistem',
        },
        {
            key: 'model_type',
            label: 'Bagian data',
            type: 'select',
            options: modelTypes.map((type) => ({ value: type, label: getAuditSubjectLabel(type) })),
            render: (item) => getAuditSubjectLabel(item.subject_type),
        },
        {
            key: 'event',
            label: 'Perubahan',
            type: 'select',
            options: [
                { value: 'created', label: 'Data dibuat' },
                { value: 'updated', label: 'Data diubah' },
                { value: 'deleted', label: 'Data dihapus' },
            ],
            render: (item) => getActionBadge(item.event),
        },
        {
            key: 'description',
            label: 'Keterangan',
            type: 'text',
            placeholder: 'Cari keterangan',
            cellClassName: 'px-4 py-3 text-sm text-gray-700 max-w-sm',
            render: (item) => item.description || `${getAuditActionLabel(item.event)} — ${getAuditSubjectLabel(item.subject_type)}`,
        },
        {
            key: 'detail',
            label: 'Rincian',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 text-right text-sm',
            render: (item) => (
                <Link
                    href={route('audit.logs.show', item.id)}
                    className="inline-flex items-center gap-1 font-semibold text-gray-900 hover:underline"
                >
                    Lihat perubahan <ArrowRight className="w-4 h-4" />
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Riwayat Perubahan" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Riwayat Perubahan</h1>
                    <p className="mt-1 max-w-2xl text-sm text-gray-600">
                        Lihat siapa yang membuat, mengubah, atau menghapus data dan kapan hal itu terjadi.
                        Buka rincian untuk melihat informasi yang dicatat pada setiap aktivitas.
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-800" aria-live="polite">
                        {Number(logs?.total || 0).toLocaleString('id-ID')} aktivitas tercatat
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="inline-flex min-h-10 items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                    <ArrowDownToLine className="h-4 w-4" /> Unduh Excel
                </button>
            </div>

            <DataTable
                routeName="audit.logs"
                columns={columns}
                rows={logs}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Belum ada aktivitas yang cocok. Coba ubah kata pencarian atau rentang tanggal."
            />
        </AuthenticatedLayout>
    );
}
