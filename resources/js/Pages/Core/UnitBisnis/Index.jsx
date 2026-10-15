import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';

export default function Index({ unitBisnis, filters, sort, direction }) {
    const { auth } = usePage().props;

    const can = (permission) => auth.permissions?.includes(permission);

    const handleDelete = (id) => {
        if (window.confirm('Yakin hapus unit ini?')) {
            router.delete(route('core.unit-bisnis.destroy', id));
        }
    };

    const columns = [
        { key: 'kode', label: 'Kode', type: 'text' },
        { key: 'nama', label: 'Nama', type: 'text' },
        {
            key: 'deskripsi',
            label: 'Deskripsi',
            type: 'text',
            cellClassName: 'px-4 py-3 text-sm text-gray-600 max-w-xs truncate',
            render: (item) => item.deskripsi || '-',
        },
        {
            key: 'aktif',
            label: 'Status',
            type: 'select',
            options: [
                { value: '1', label: 'Aktif' },
                { value: '0', label: 'Nonaktif' },
            ],
            render: (item) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.aktif ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}
                >
                    {item.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
            ),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 text-right text-sm space-x-2',
            render: (item) => (
                <>
                    <Link
                        href={route('core.unit-bisnis.show', item.id)}
                        className="text-blue-600 hover:text-blue-900 inline-block"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                    {can('edit unit bisnis') && (
                        <Link
                            href={route('core.unit-bisnis.edit', item.id)}
                            className="text-yellow-600 hover:text-yellow-900 inline-block"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                    )}
                    {can('delete unit bisnis') && (
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 inline-block"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Unit Bisnis</h1>
                {can('create unit bisnis') && (
                    <Link
                        href={route('core.unit-bisnis.create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Unit
                    </Link>
                )}
            </div>

            <DataTable
                routeName="core.unit-bisnis.index"
                columns={columns}
                rows={unitBisnis}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
