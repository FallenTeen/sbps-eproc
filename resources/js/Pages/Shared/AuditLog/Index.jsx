import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { Eye, Download } from 'lucide-react';

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
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[action] || 'bg-gray-200 text-gray-800'}`}>{action}</span>;
    };

    const columns = [
        {
            key: 'created_at',
            label: 'Waktu',
            type: 'dateRange',
            render: (item) => new Date(item.created_at).toLocaleString('id-ID'),
        },
        {
            key: 'user',
            label: 'User',
            type: 'text',
            render: (item) => item.causer?.name || 'System',
        },
        {
            key: 'model_type',
            label: 'Model',
            type: 'select',
            options: modelTypes.map((m) => ({ value: m, label: m.split('\\').pop() })),
            render: (item) => item.subject_type?.split('\\').pop() || '-',
        },
        {
            key: 'event',
            label: 'Aksi',
            type: 'select',
            options: [
                { value: 'created', label: 'Created' },
                { value: 'updated', label: 'Updated' },
                { value: 'deleted', label: 'Deleted' },
            ],
            render: (item) => getActionBadge(item.event),
        },
        {
            key: 'description',
            label: 'Deskripsi',
            type: 'text',
            cellClassName: 'px-4 py-3 text-sm text-gray-600 max-w-xs truncate',
            render: (item) => item.description || '-',
        },
        {
            key: 'detail',
            label: 'Detail',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 text-right text-sm',
            render: (item) => (
                <Link href={route('audit.logs.show', item.id)} className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                <button
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-1 text-sm font-semibold"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            <DataTable
                routeName="audit.logs"
                columns={columns}
                rows={logs}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
