import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Save, ArrowLeft } from 'lucide-react';

export default function Edit({ auth, karyawan }) {
    const { data, setData, put, processing, errors } = useForm({
        nama: karyawan.nama || '',
        tipe: karyawan.tipe || 'tetap',
        jabatan: karyawan.jabatan || '',
        no_hp: karyawan.no_hp || '',
        alias: karyawan.alias || '',
        rate_gaji_pokok: karyawan.rate_gaji_pokok || '',
        rate_harian: karyawan.rate_harian || '',
        npwp: karyawan.npwp || '',
        no_bpjs_kesehatan: karyawan.no_bpjs_kesehatan || '',
        no_bpjs_ketenagakerjaan: karyawan.no_bpjs_ketenagakerjaan || '',
        status_ptkp: karyawan.status_ptkp || '',
        status: karyawan.status || 'aktif',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('hr.karyawan.update', karyawan.id));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit Karyawan: {karyawan.nama}</h2>}
        >
            <Head title={`Edit Karyawan - ${karyawan.nama}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Kolom Kiri: Info Dasar */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informasi Dasar</h3>
                                    
                                    <div>
                                        <InputLabel htmlFor="nama" value="Nama Lengkap" />
                                        <TextInput
                                            id="nama"
                                            className="mt-1 block w-full"
                                            value={data.nama}
                                            onChange={(e) => setData('nama', e.target.value)}
                                            required
                                        />
                                        <InputError className="mt-2" message={errors.nama} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="tipe" value="Tipe Karyawan" />
                                        <select
                                            id="tipe"
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            value={data.tipe}
                                            onChange={(e) => setData('tipe', e.target.value)}
                                            required
                                        >
                                            <option value="tetap">Tetap</option>
                                            <option value="harian">Harian</option>
                                            <option value="borongan_rit">Borongan Rit</option>
                                        </select>
                                        <InputError className="mt-2" message={errors.tipe} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="jabatan" value="Jabatan" />
                                        <TextInput
                                            id="jabatan"
                                            className="mt-1 block w-full"
                                            value={data.jabatan}
                                            onChange={(e) => setData('jabatan', e.target.value)}
                                            required
                                        />
                                        <InputError className="mt-2" message={errors.jabatan} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="no_hp" value="No. HP" />
                                        <TextInput
                                            id="no_hp"
                                            type="tel"
                                            className="mt-1 block w-full"
                                            value={data.no_hp}
                                            onChange={(e) => setData('no_hp', e.target.value)}
                                            placeholder="08xx-xxxx-xxxx"
                                        />
                                        <InputError className="mt-2" message={errors.no_hp} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="alias" value="Alias / Julukan" />
                                        <TextInput
                                            id="alias"
                                            className="mt-1 block w-full"
                                            value={data.alias}
                                            onChange={(e) => setData('alias', e.target.value)}
                                            placeholder="contoh: SAMSON"
                                        />
                                        <InputError className="mt-2" message={errors.alias} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="status" value="Status" />
                                        <select
                                            id="status"
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            required
                                        >
                                            <option value="aktif">Aktif</option>
                                            <option value="nonaktif">Non-Aktif</option>
                                        </select>
                                        <InputError className="mt-2" message={errors.status} />
                                    </div>
                                </div>

                                {/* Kolom Kanan: Finansial & Administrasi */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informasi Finansial & Adm</h3>
                                    
                                    {data.tipe === 'tetap' && (
                                        <div>
                                            <InputLabel htmlFor="rate_gaji_pokok" value="Gaji Pokok (Bulanan)" />
                                            <div className="relative mt-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">Rp</span>
                                                </div>
                                                <TextInput
                                                    id="rate_gaji_pokok"
                                                    type="number"
                                                    className="block w-full pl-10"
                                                    value={data.rate_gaji_pokok}
                                                    onChange={(e) => setData('rate_gaji_pokok', e.target.value)}
                                                />
                                            </div>
                                            <InputError className="mt-2" message={errors.rate_gaji_pokok} />
                                        </div>
                                    )}

                                    {data.tipe === 'harian' && (
                                        <div>
                                            <InputLabel htmlFor="rate_harian" value="Rate Harian" />
                                            <div className="relative mt-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">Rp</span>
                                                </div>
                                                <TextInput
                                                    id="rate_harian"
                                                    type="number"
                                                    className="block w-full pl-10"
                                                    value={data.rate_harian}
                                                    onChange={(e) => setData('rate_harian', e.target.value)}
                                                />
                                            </div>
                                            <InputError className="mt-2" message={errors.rate_harian} />
                                        </div>
                                    )}

                                    <div>
                                        <InputLabel htmlFor="npwp" value="NPWP" />
                                        <TextInput
                                            id="npwp"
                                            className="mt-1 block w-full"
                                            value={data.npwp}
                                            onChange={(e) => setData('npwp', e.target.value)}
                                        />
                                        <InputError className="mt-2" message={errors.npwp} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="status_ptkp" value="Status PTKP (contoh: TK/0, K/1)" />
                                        <TextInput
                                            id="status_ptkp"
                                            className="mt-1 block w-full uppercase"
                                            value={data.status_ptkp}
                                            onChange={(e) => setData('status_ptkp', e.target.value.toUpperCase())}
                                        />
                                        <InputError className="mt-2" message={errors.status_ptkp} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="no_bpjs_kesehatan" value="No BPJS Kesehatan" />
                                        <TextInput
                                            id="no_bpjs_kesehatan"
                                            className="mt-1 block w-full"
                                            value={data.no_bpjs_kesehatan}
                                            onChange={(e) => setData('no_bpjs_kesehatan', e.target.value)}
                                        />
                                        <InputError className="mt-2" message={errors.no_bpjs_kesehatan} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="no_bpjs_ketenagakerjaan" value="No BPJS Ketenagakerjaan" />
                                        <TextInput
                                            id="no_bpjs_ketenagakerjaan"
                                            className="mt-1 block w-full"
                                            value={data.no_bpjs_ketenagakerjaan}
                                            onChange={(e) => setData('no_bpjs_ketenagakerjaan', e.target.value)}
                                        />
                                        <InputError className="mt-2" message={errors.no_bpjs_ketenagakerjaan} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-5 border-t border-gray-200 flex items-center justify-end gap-4">
                                <Link
                                    href={route('hr.karyawan.index')}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Batal
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Simpan Perubahan
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
