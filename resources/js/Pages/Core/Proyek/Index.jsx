import React, { useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import DataTable from '@/Components/DataTable';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import {formatTanggal} from '@/utils/date';

export default function Index({ proyeks, unitBisnis, filters, sort, direction }) {
    const { auth } = usePage().props;

    const permissions = auth?.permissions || [];
    const roles = auth?.roles || [];
    const userUnitId = auth?.user?.unit_bisnis_id || null;

    const hasRole = (roleNames) => {
        if (!Array.isArray(roleNames)) roleNames = [roleNames];
        return roles.some(r => roleNames.includes(r));
    };

    const hasPermission = (permNames) => {
        if (!Array.isArray(permNames)) permNames = [permNames];
        return permissions.some(p => permNames.includes(p));
    };

    const can = useMemo(() => ({
        createProyek: () => {
            if (hasRole('Owner')) return true;
            if (hasPermission('manage proyek')) return true;
            if (hasRole([
                'Koordinator Procurement',
                'Koordinator GCS',
                'Koordinator CBP',
                'Koordinator AMP',
                'Koordinator SDM',
            ])) return true;
            return false;
        },
        updateProyek: (proyek) => {
            if (hasRole('Owner')) return true;
            if (!hasPermission('manage proyek') && !hasRole([
                'Koordinator Procurement',
                'Koordinator GCS',
                'Koordinator CBP',
                'Koordinator AMP',
                'Koordinator SDM',
            ])) return false;
            if (userUnitId && proyek?.unit_bisnis_id && userUnitId !== proyek.unit_bisnis_id) {
                return false;
            }
            return true;
        },
        deleteProyek: () => {
            return hasRole('Owner');
        },
    }), [permissions, roles, userUnitId]);

    const getStatusBadge = (status) => {
        const colors = {
            draft: 'bg-gray-200 text-gray-800',
            aktif: 'bg-green-200 text-green-800',
            selesai: 'bg-blue-200 text-blue-800',
            dihentikan: 'bg-red-200 text-red-800',
        };
        return colors[status] || 'bg-gray-200 text-gray-800';
    };

    const getTipeBadge = (tipe) => {
        return tipe === 'internal'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-orange-100 text-orange-800';
    };

    const handleDelete = (id) => {
        if (window.confirm('Yakin hapus proyek ini?')) {
            router.delete(route('core.proyek.destroy', id));
        }
    };

    const columns = [
        { key: 'kode_proyek', label: 'Kode', type: 'text' },
        { key: 'nama', label: 'Nama Proyek', type: 'text' },
        {
            key: 'unit_bisnis',
            label: 'Unit Bisnis',
            type: 'select',
            options: unitBisnis.map((u) => ({ value: u.id, label: u.nama })),
            render: (proyek) => proyek.unit_bisnis?.nama,
        },
        {
            key: 'tipe_proyek',
            label: 'Tipe',
            type: 'select',
            options: [
                { value: 'internal', label: 'Internal' },
                { value: 'kontrak_klien', label: 'Kontrak Klien' },
            ],
            render: (proyek) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTipeBadge(proyek.tipe_proyek)}`}>
                    {proyek.tipe_proyek === 'internal' ? 'Internal' : 'Kontrak Klien'}
                </span>
            ),
        },
        { key: 'client', label: 'Client', type: 'text', render: (proyek) => proyek.client || '-' },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'aktif', label: 'Aktif' },
                { value: 'selesai', label: 'Selesai' },
                { value: 'dihentikan', label: 'Dihentikan' },
            ],
            render: (proyek) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(proyek.status)}`}>
                    {proyek.status.charAt(0).toUpperCase() + proyek.status.slice(1)}
                </span>
            ),
        },
        {
            key: 'tanggal_mulai',
            label: 'Mulai',
            type: 'dateRange',
            render: (proyek) => formatTanggal(proyek.tanggal_mulai),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 text-right text-sm space-x-2 flex justify-end',
            render: (proyek) => (
                <>
                    <Link
                        href={route('core.proyek.show', proyek.id)}
                        className="text-blue-600 hover:text-blue-900 inline-block"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                    {can.updateProyek(proyek) && (
                        <Link
                            href={route('core.proyek.edit', proyek.id)}
                            className="text-yellow-600 hover:text-yellow-900 inline-block"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                    )}
                    {can.deleteProyek() && (
                        <button
                            onClick={() => handleDelete(proyek.id)}
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manajemen Proyek</h1>
                {can.createProyek() && (
                    <Link
                        href={route('core.proyek.create')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Proyek Baru
                    </Link>
                )}
            </div>

            <DataTable
                routeName="core.proyek.index"
                columns={columns}
                rows={proyeks}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </Layout>
    );
}
