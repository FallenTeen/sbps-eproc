import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft } from 'lucide-react';

export default function Create({ roles }) {
    const { auth } = usePage().props;
    const { data, setData, post, errors, processing } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        is_active: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('users.store'));
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Tambah User</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password *</label>
                        <input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                        <select value={data.role} onChange={(e) => setData('role', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Pilih Role</option>
                            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                        {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Aktif</label>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => window.history.back()} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}