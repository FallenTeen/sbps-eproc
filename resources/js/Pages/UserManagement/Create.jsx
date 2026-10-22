import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, UserPlus, Link2 } from 'lucide-react';

export default function Create({ roles, karyawans = [] }) {
    const { errors } = usePage().props;
    const [modeKaryawan, setModeKaryawan] = useState('none');
    const [pending, setPending] = useState(false);
    const [data, setData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        is_active: true,
        karyawan_id: '',
        new_nama: '',
        new_tipe: 'tetap',
        new_jabatan: '',
        new_no_hp: '',
    });

    const set = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            name: data.name,
            email: data.email,
            password: data.password,
            password_confirmation: data.password_confirmation,
            role: data.role,
            is_active: data.is_active,
            karyawan_id: modeKaryawan === 'existing' ? data.karyawan_id : '',
        };

        if (modeKaryawan === 'new') {
            payload.new_karyawan = {
                nama: data.new_nama,
                tipe: data.new_tipe,
                jabatan: data.new_jabatan,
                no_hp: data.new_no_hp,
            };
        }

        router.post(route('users.store'), payload, {
            onStart: () => setPending(true),
            onFinish: () => setPending(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Tambah User</h1>
            </div>

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input type="password" value={data.password} onChange={(e) => set('password', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password *</label>
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

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 pt-5 -mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <UserPlus className="w-4 h-4 text-gray-600" />
                        <h3 className="text-sm font-bold text-gray-900">Data Karyawan Terkait (opsional)</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                        Karyawan tidak wajib punya akun. Opsinya: tautkan data karyawan yang sudah ada yang belum memakai akun, atau buat data karyawan baru langsung tertaut ke akun ini.
                        Data karyawan yang tertaut yang muncul di modul SDM & Payroll (penggajian dsb). Lewati jika hanya perlu akunnya.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        {[
                            { value: 'none', label: 'Tanpa Karyawan', icon: null },
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

                    {modeKaryawan === 'existing' && (
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
                    )}

                    {modeKaryawan === 'new' && (
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
                                <p className="text-xs text-gray-500 mt-1">Perincian gaji/BPJS/alias dapat dilengkapi di modul SDM & Payroll setelahnya.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">No. HP</label>
                                <input type="text" value={data.new_no_hp} onChange={(e) => set('new_no_hp', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => window.history.back()} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={pending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                        {pending ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
