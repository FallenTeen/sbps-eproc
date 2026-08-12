import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeft, 
    Plus, 
    Trash2, 
    FileText, 
    TrendingDown, 
    TrendingUp,
    Wallet
} from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function Review({ auth, periode, netto }) {
    const [showingAddModal, setShowingAddModal] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        jenis: 'tunjangan',
        jumlah: '',
        keterangan: '',
    });

    const getBulanName = (bulanNumber) => {
        const date = new Date();
        date.setMonth(bulanNumber - 1);
        return date.toLocaleString('id-ID', { month: 'long' });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const submitAddKomponen = (e) => {
        e.preventDefault();
        post(route('hr.payroll.add-komponen', periode.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowingAddModal(false);
                reset();
            },
        });
    };

    const deleteKomponen = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus komponen ini?')) {
            router.delete(route('hr.payroll.delete-komponen', id), {
                preserveScroll: true
            });
        }
    };

    const penerimaan = periode.komponen.filter(k => k.jenis !== 'potongan');
    const potongan = periode.komponen.filter(k => k.jenis === 'potongan');

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Review Gaji: {periode.karyawan.nama}</h2>}
        >
            <Head title={`Review Gaji - ${periode.karyawan.nama}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Info */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg p-6 relative">
                        <div className="flex gap-2 absolute top-6 right-6">
                            <Link href={route('hr.payroll.show', { bulan: periode.periode_bulan, tahun: periode.periode_tahun })}>
                                <SecondaryButton>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar
                                </SecondaryButton>
                            </Link>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                <FileText className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{periode.karyawan.nama}</h3>
                                <p className="text-sm text-gray-500 capitalize">
                                    {periode.karyawan.tipe?.replace('_', ' ')} &bull; {getBulanName(periode.periode_bulan)} {periode.periode_tahun}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-green-500" /> Total Penerimaan
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(penerimaan.reduce((sum, k) => sum + parseFloat(k.jumlah), 0))}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                                    <TrendingDown className="w-4 h-4 text-red-500" /> Total Potongan
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(potongan.reduce((sum, k) => sum + parseFloat(k.jumlah), 0))}
                                </div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                <div className="text-sm text-indigo-800 flex items-center gap-2 mb-1 font-semibold">
                                    <Wallet className="w-4 h-4" /> THP (Take Home Pay)
                                </div>
                                <div className="text-3xl font-black text-indigo-900">
                                    {formatCurrency(netto)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Components Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Penerimaan */}
                        <div className="bg-white shadow-sm rounded-lg border-t-4 border-green-500 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-green-600" /> Rincian Penerimaan
                                </h4>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {penerimaan.map(k => (
                                    <li key={k.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                        <div>
                                            <div className="font-medium text-gray-900 capitalize">{k.jenis.replace('_', ' ')}</div>
                                            <div className="text-xs text-gray-500">{k.keterangan}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-gray-900">{formatCurrency(k.jumlah)}</span>
                                            {periode.status === 'draft' && (
                                                <button onClick={() => deleteKomponen(k.id)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {penerimaan.length === 0 && (
                                    <li className="p-8 text-center text-gray-400 text-sm">Tidak ada komponen penerimaan</li>
                                )}
                            </ul>
                        </div>

                        {/* Potongan */}
                        <div className="bg-white shadow-sm rounded-lg border-t-4 border-red-500 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-red-600" /> Rincian Potongan
                                </h4>
                            </div>
                            <ul className="divide-y divide-gray-100 flex-grow">
                                {potongan.map(k => (
                                    <li key={k.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                        <div>
                                            <div className="font-medium text-gray-900 capitalize">{k.jenis.replace('_', ' ')}</div>
                                            <div className="text-xs text-gray-500">{k.keterangan}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-red-600">({formatCurrency(k.jumlah)})</span>
                                            {periode.status === 'draft' && (
                                                <button onClick={() => deleteKomponen(k.id)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {potongan.length === 0 && (
                                    <li className="p-8 text-center text-gray-400 text-sm">Tidak ada komponen potongan</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {periode.status === 'draft' && (
                        <div className="flex justify-center mt-4">
                            <PrimaryButton onClick={() => setShowingAddModal(true)} className="bg-gray-800">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Komponen Manual
                            </PrimaryButton>
                        </div>
                    )}

                </div>
            </div>

            {/* Modal Tambah Komponen */}
            <Modal show={showingAddModal} onClose={() => setShowingAddModal(false)}>
                <form onSubmit={submitAddKomponen} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center mb-6">
                        <Plus className="w-5 h-5 mr-2 text-indigo-600" />
                        Tambah Komponen Gaji
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="jenis" value="Jenis Komponen" />
                            <select
                                id="jenis"
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.jenis}
                                onChange={(e) => setData('jenis', e.target.value)}
                                required
                            >
                                <option value="tunjangan">Penerimaan Lainnya (Tunjangan / Bonus)</option>
                                <option value="potongan">Potongan (Kasbon / Denda / BPJS)</option>
                            </select>
                            <InputError message={errors.jenis} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="keterangan" value="Keterangan / Nama Komponen" />
                            <input
                                id="keterangan"
                                type="text"
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.keterangan}
                                onChange={(e) => setData('keterangan', e.target.value)}
                                placeholder="Contoh: Bonus Tahunan / Potongan Kasbon"
                                required
                            />
                            <InputError message={errors.keterangan} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="jumlah" value="Jumlah (Rp)" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">Rp</span>
                                </div>
                                <input
                                    id="jumlah"
                                    type="number"
                                    min="0"
                                    className="pl-10 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.jumlah}
                                    onChange={(e) => setData('jumlah', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.jumlah} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => setShowingAddModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton className="ml-3" disabled={processing}>Simpan Komponen</PrimaryButton>
                    </div>
                </form>
            </Modal>

        </AuthenticatedLayout>
    );
}
