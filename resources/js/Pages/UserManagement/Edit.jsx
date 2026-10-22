import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, UserPlus, Link2, Unlink } from 'lucide-react';

export default function Edit({ user, roles, userRole, karyawans = [] }) {
    const { errors, success, error } = usePage().props;
    const [pending, setPending] = useState(false);
    const [linkPending, setLinkPending] = useState(false);
    const [modeKaryawan, setModeKaryawan] = useState('existing');
    const [data, setData] = useState({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role: userRole || '',
        is_active: user.is_active !== false,
        karyawan_id: '',
        new_nama: '',
        new_tipe: 'tetap',
        new_jabatan: '',
        new_no_hp: '',
    });

    const set = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(route('users.update', user.id), {
            name: data.name,
            email: data.email,
            password: data.password,
            password_confirmation: data.password_confirmation,
            role: data.role,
            is_active: data.is_active,
        }, {
            onStart: () => setPending(true),
            onFinish: () => setPending(false),
        });
    };

    const linkKaryawan = (e) => {
        e.preventDefault();
        const payload = {};
        if (modeKaryawan === 'existing') {
            payload.karyawan_id = data.karyawan_id;
        } else {
            payload.new_karyawan = {
                nama: data.new_nama,
                tipe: data.new_tipe,
                jabatan: data.new_jabatan,
                no_hp: data.new_no_hp,
            };
        }
        router.post(route('users.link-karyawan', user.id), payload, {
            onStart: () => setLinkPending(true),
            onFinish: () => setLinkPending(false),
        });
    };

    const unlinkKaryawan = () => {
        if (confirm(`Lepas tautan karyawan "${user.karyawan.nama}" dari akun ini? Data karyawan tetap ada di modul SDM, hanya tidak lagi memakai akun ini.`)) {
            router.post(route('users.unlink-karyawan', user.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Edit User: {user.name}</h1>
            </div>

            {success && (
                <div className="mb-4 max-w-2xl rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{success}</div>
            )}
            {!success && error && (
                <div className="mb-4 max-w-2xl rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                        <input type="text" value={data.name} onChange={(e) => set('name', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input type="email" value={data.email} onChange={(e) => set('email', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password (kosongkan jika tidak diubah)</label>
                        <input type="password" value={data.password} onChange={(e) => set('password', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                        <input type="password" value={data.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                        <select value={data.role} onChange={(e) => set('role', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Pilih Role</option>
                            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                        {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Aktif</label>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => window.history.back()} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={pending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                        {pending ? 'Menyimpan...' : 'Update'}
                    </button>
                </div>
            </form>

            <div className="bg-white rounded-lg shadow p-6 max-w-2xl mt-6">
                <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-bold text-gray-900">Karyawan Terkait</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    Data karyawan yang memakai akun ini (muncul di modul SDM &amp; Payroll). Karyawan tidak wajib punya akun &mdash; satu karyawan hanya boleh menaungi satu akun.
                </p>

                {user.karyawan ? (
                    <div className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                        <div>
                            <p className="font-semibold text-sm text-gray-900">{user.karyawan.nama}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {user.karyawan.jabatan || '-'} &middot; {user.karyawan.tipe || '-'}
                                {user.karyawan.no_hp ? ` &middot; ${user.karyawan.no_hp}` : ''}
                            </p>
                        </div>
                        <button onClick={unlinkKaryawan} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-red-300 text-red-600 hover:bg-red-50">
                            <Unlink className="w-3.5 h-3.5" />
                            Lepas Tautan
                        </button>
                    </div>
                ) : (
                    <form onSubmit={linkKaryawan} className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                                { value: 'existing', label: 'Tautkan Karyawan', icon: Link2 },
                                { value: 'new', label: 'Buat Karyawan Baru', icon: UserPlus },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <label key={opt.value} className={`cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-xs font-semibold transition ${modeKaryawan === opt.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                        <input type="radio" className="sr-only" name="mode_karyawan" value={opt.value} checked={modeKaryawan === opt.value} onChange={() => setModeKaryawan(opt.value)} />
                                        {Icon && <Icon className="w-3.5 h-3.5" />}
                                        {opt.label}
                                    </label>
                                );
                            })}
                        </div>

                        {modeKaryawan === 'existing' ? (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Pilih Karyawan (belum punya akun)</label>
                                <select
                                    value={data.karyawan_id}
                                    onChange={(e) => set('karyawan_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- Pilih Karyawan --</option>
                                    {karyawans.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.nama} — {k.jabatan}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Karyawan yang sudah menaungi akun lain tidak muncul di daftar ini.</p>
                                {errors.karyawan_id && <p className="text-red-600 text-sm mt-1">{errors.karyawan_id}</p>}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Nama Karyawan *</label>
                                    <input type="text" value={data.new_nama} onChange={(e) => set('new_nama', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                                    {errors['new_karyawan.nama'] && <p className="text-red-600 text-sm mt-1">{errors['new_karyawan.nama']}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Jabatan *</label>
                                    <input type="text" value={data.new_jabatan} onChange={(e) => set('new_jabatan', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                                    {errors['new_karyawan.jabatan'] && <p className="text-red-600 text-sm mt-1">{errors['new_karyawan.jabatan']}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipe Penggajian *</label>
                                    <select value={data.new_tipe} onChange={(e) => set('new_tipe', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                                        <option value="tetap">Karyawan Tetap (gaji pokok)</option>
                                        <option value="harian">Harian (rate per hari)</option>
                                        <option value="borongan_rit">Borongan Per Rit</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Perincian gaji/BPJS/alias dapat dilengkapi di modul SDM &amp; Payroll setelahnya.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">No. HP</label>
                                    <input type="text" value={data.new_no_hp} onChange={(e) => set('new_no_hp', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-1">
                            <button type="submit" disabled={linkPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-50">
                                {linkPending ? 'Menautkan...' : 'Tautkan Karyawan'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
