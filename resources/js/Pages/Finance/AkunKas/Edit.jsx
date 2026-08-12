import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function Edit({ auth, akunKas }) {
    const { data, setData, put, processing, errors } = useForm({
        nama: akunKas.nama || '',
        jenis_kas: akunKas.jenis_kas || 'kas_operasional',
        aktif: akunKas.aktif ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('finance.akun-kas.update', akunKas.id));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('finance.akun-kas.index')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit Akun Kas: {akunKas.nama}</h2>
                </div>
            }
        >
            <Head title={`Edit Akun - ${akunKas.nama}`} />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="nama" value="Nama Akun" />
                                <TextInput
                                    id="nama"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    required
                                />
                                <InputError message={errors.nama} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="jenis_kas" value="Jenis Kas" />
                                <select
                                    id="jenis_kas"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.jenis_kas}
                                    onChange={(e) => setData('jenis_kas', e.target.value)}
                                    required
                                >
                                    <option value="kas_kecil">Kas Kecil</option>
                                    <option value="kas_besar">Kas Besar</option>
                                    <option value="kas_operasional">Kas Operasional</option>
                                    <option value="bank">Bank</option>
                                </select>
                                <InputError message={errors.jenis_kas} className="mt-2" />
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="aktif"
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={data.aktif}
                                    onChange={(e) => setData('aktif', e.target.checked)}
                                />
                                <label htmlFor="aktif" className="ml-2 block text-sm text-gray-900">
                                    Aktif
                                </label>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                <Link href={route('finance.akun-kas.index')}>
                                    <SecondaryButton type="button">Batal</SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>Simpan Perubahan</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
