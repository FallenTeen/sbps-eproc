import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Pencil, Trash2, Search, UserX, UserCheck } from 'lucide-react';

export default function Index({ users, roles, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [isActive, setIsActive] = useState(filters.is_active ?? '');

    const handleFilter = () => {
        router.get(route('users.index'), { search, role, is_active: isActive });
    };

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

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                placeholder="Nama atau email..."
                                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2"
                            />
                            <button onClick={handleFilter} className="bg-gray-50 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 hover:bg-gray-100">
                                <Search className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="">Semua Role</option>
                            {roles.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-40">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select value={isActive} onChange={(e) => setIsActive(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="">Semua</option>
                            <option value="1">Aktif</option>
                            <option value="0">Nonaktif</option>
                        </select>
                    </div>
                    <button onClick={handleFilter} className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-semibold">
                        Filter
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">Tidak ada data</td>
                            </tr>
                        ) : (
                            users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.roles)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                        <Link href={route('users.edit', user.id)} className="text-blue-600 hover:text-blue-900 inline-block">
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDestroy(user)} className="text-red-600 hover:text-red-900 inline-block">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {users.from || 0} - {users.to || 0} dari {users.total || 0} data
                </div>
                <div className="flex gap-2">
                    {users.links?.map((link, index) => (
                        <button
                            key={index}
                            onClick={() => link.url && router.get(link.url)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-3 py-1 border rounded ${link.active ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-100'}`}
                            disabled={!link.url}
                        />
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}