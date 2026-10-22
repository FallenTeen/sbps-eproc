import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Index({ users, roles, filters, sort, direction }) {
    const handleDestroy = (user) => {
        if (confirm(`Yakin menghapus user "${user.name}"?`)) {
            router.delete(route('users.destroy', user.id));
        }
    };

    const getRoleBadge = (rolesList) => {
        const roleName = rolesList?.[0]?.name || '-';
        const colors = {
            Owner: 'bg-black text-white',
            'Admin Keuangan': 'bg-purple-100 text-purple-800',
            'Koordinator SDM': 'bg-green-100 text-green-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[roleName] || 'bg-gray-100 text-gray-800'}`}>
                {roleName}
            </span>
        );
    };

    const columns = [
        { key: 'name', label: 'Nama', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        {
            key: 'karyawan',
            label: 'Karyawan',
            search: false,
            sortable: false,
            render: (user) => {
                const karyawan = user.karyawan;
                if (!karyawan) return <span className="text-gray-400 italic">Tidak tertaut</span>;
                return (
                    <span className="inline-block text-sm" title={`${karyawan.jabatan || '-'} · ${karyawan.tipe || '-'}`}>
                        {karyawan.nama}
                    </span>
                );
            },
        },
        {
            key: 'role',
            label: 'Role',
            type: 'select',
            options: roles.map((r) => ({ value: r, label: r })),
            render: (user) => getRoleBadge(user.roles),
        },
        {
            key: 'is_active',
            label: 'Status',
            type: 'select',
            options: [
                { value: '1', label: 'Aktif' },
                { value: '0', label: 'Nonaktif' },
            ],
            render: (user) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
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
            render: (user) => (
                <>
                    <Link href={route('users.edit', user.id)} className="text-blue-600 hover:text-blue-900 inline-block">
                        <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDestroy(user)} className="text-red-600 hover:text-red-900 inline-block">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen User" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
                    <p className="mt-1 text-sm text-gray-500">Kelola akun pengguna dan role akses</p>
                </div>
                <Link
                    href={route('users.create')}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Tambah User
                </Link>
            </div>

            <DataTable
                routeName="users.index"
                columns={columns}
                rows={users}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
