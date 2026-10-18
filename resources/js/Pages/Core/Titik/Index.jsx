import React, { useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import DataTable from '@/Components/DataTable';
import { ArrowLeft, Plus, Edit, Eye, Trash2 } from 'lucide-react';

export default function Index({ proyek, titiks, filters, sort, direction }) {
    const { auth } = usePage().props;

    const permissions = auth?.permissions || [];
    const roles = auth?.roles || [];

    const can = useMemo(() => ({
        createTitik: () => {
            if (roles.includes('Owner')) return true;
            if (roles.includes('Koordinator Procurement')
                || roles.includes('Koordinator GCS')
                || roles.includes('Koordinator CBP')
                || roles.includes('Koordinator AMP')
                || roles.includes('Koordinator SDM')) return true;
            return permissions.some(p => ['manage titik', 'manage proyek'].includes(p));
        },
        updateTitik: () => {
            if (roles.includes('Owner')) return true;
            if (roles.includes('Koordinator Procurement')
                || roles.includes('Koordinator GCS')
                || roles.includes('Koordinator CBP')
                || roles.includes('Koordinator AMP')
                || roles.includes('Koordinator SDM')) return true;
            return permissions.some(p => ['manage titik', 'manage proyek'].includes(p));
        },
        deleteTitik: () => roles.includes('Owner'),
    }), [permissions, roles]);

    const handleDelete = (id) => {
        if (window.confirm('Yakin hapus titik ini?')) {
            router.delete(route('core.titik.destroy', id));
        }
    };

    const columns = [
        { key: 'nama', label: 'Nama Titik', type: 'text' },
        {
            key: 'koordinat',
            label: 'Koordinat',
            search: false,
            sortable: false,
            cellClassName: 'px-4 py-3 text-sm font-mono text-gray-600',
            render: (titik) =>
                titik.latitude != null && titik.longitude != null ? (
                    `${Number(titik.latitude).toFixed(6)}, ${Number(titik.longitude).toFixed(6)}`
                ) : (
                    <span className="text-gray-400 italic">Belum ada koordinat</span>
                ),
        },
        {
            key: 'radius_presensi_meter',
            label: 'Radius',
            search: false,
            render: (titik) => `${titik.radius_presensi_meter ?? 0}m`,
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Nonaktif' },
            ],
            render: (titik) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        titik.status === 'nonaktif'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-green-200 text-green-800'
                    }`}
                >
                    {titik.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
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
            render: (titik) => (
                <>
                    <Link
                        href={route('core.titik.show', titik.id)}
                        className="text-blue-600 hover:text-blue-900 inline-block"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                    {can.updateTitik() && (
                        <Link
                            href={route('core.titik.edit', titik.id)}
                            className="text-yellow-600 hover:text-yellow-900 inline-block"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                    )}
                    {can.deleteTitik() && (
                        <button
                            onClick={() => handleDelete(titik.id)}
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
        <Layout>
            <div className="mb-6 flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Titik Proyek</h1>
                    <p className="text-sm text-gray-500">{proyek.nama} ({proyek.kode_proyek})</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Link
                        href={route('core.proyek.show', proyek.id)}
                        aria-label="Kembali ke proyek"
                        className="inline-flex items-center gap-1.5 bg-gray-600 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary transition-colors text-white border-2 border-black"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        kembali
                    </Link>
                    {can.createTitik() && (
                        <Link
                            href={route('core.titik.create', { proyek_id: proyek.id })}
                            className="inline-flex items-center gap-1.5 border-2 border-black bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary transition-colors hover:bg-gray-900 hover:text-white"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Titik
                        </Link>
                    )}
                </div>
            </div>

            <DataTable
                routeName="core.titik.index"
                routeParams={{ proyek: proyek.id }}
                columns={columns}
                rows={titiks}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </Layout>
    );
}
