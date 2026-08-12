import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Users, 
    ArrowLeft, 
    CheckCircle2, 
    Clock, 
    Banknote, 
    TrendingDown, 
    TrendingUp,
    Check
} from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';

export default function Show({ auth, bulan, tahun, status, gajis, total_gaji }) {
    const [confirmingPay, setConfirmingPay] = useState(false);

    const getBulanName = (bulanNumber) => {
        const date = new Date();
        date.setMonth(bulanNumber - 1);
        return date.toLocaleString('id-ID', { month: 'long' });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const handlePay = (e) => {
        e.preventDefault();
        router.post(route('hr.payroll.pay', { bulan, tahun }), {}, {
            preserveState: true,
            onSuccess: () => setConfirmingPay(false),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Detail Payroll: {getBulanName(bulan)} {tahun}</h2>}
        >
            <Head title={`Detail Payroll ${getBulanName(bulan)} ${tahun}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg p-6 flex flex-col">
                            <div className="flex items-center gap-3 text-gray-500 mb-2">
                                <Users className="w-5 h-5" />
                                <h3 className="font-medium text-sm">Total Karyawan</h3>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mt-auto">
                                {gajis.length} Orang
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm rounded-lg p-6 flex flex-col border-b-4 border-indigo-500">
                            <div className="flex items-center gap-3 text-gray-500 mb-2">
                                <Banknote className="w-5 h-5" />
                                <h3 className="font-medium text-sm">Total Gaji Dibayarkan (Netto)</h3>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mt-auto">
                                {formatCurrency(total_gaji)}
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm rounded-lg p-6 flex flex-col">
                            <div className="flex items-center gap-3 text-gray-500 mb-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <h3 className="font-medium text-sm">Status Pencairan</h3>
                            </div>
                            <div className="mt-auto">
                                <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full flex items-center w-fit gap-2 ${
                                    status === 'dibayar' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {status === 'dibayar' ? <CheckCircle2 className="w-4 h-4"/> : <Clock className="w-4 h-4"/>}
                                    {status === 'dibayar' ? 'Telah Dibayar / Selesai' : 'Masih Draft / Pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Header Action */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                        <div className="flex gap-2">
                            <Link href={route('hr.payroll.index')}>
                                <SecondaryButton>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                                </SecondaryButton>
                            </Link>
                        </div>
                        {status === 'draft' && (
                            <PrimaryButton onClick={() => setConfirmingPay(true)} className="bg-green-600 hover:bg-green-700 focus:bg-green-700 active:bg-green-800">
                                <Check className="w-4 h-4 mr-2" />
                                Tandai Telah Dibayar
                            </PrimaryButton>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karyawan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center justify-end gap-1">
                                                <TrendingUp className="w-3 h-3 text-green-500" /> Penerimaan
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center justify-end gap-1">
                                                <TrendingDown className="w-3 h-3 text-red-500" /> Potongan
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Netto Diterima</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {gajis.map((g) => {
                                        const penerimaan = g.komponen.filter(k => k.jenis !== 'potongan').reduce((sum, item) => sum + parseFloat(item.jumlah), 0);
                                        const potongan = g.komponen.filter(k => k.jenis === 'potongan').reduce((sum, item) => sum + parseFloat(item.jumlah), 0);

                                        return (
                                            <tr key={g.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">{g.karyawan?.nama}</div>
                                                    <div className="text-xs text-gray-500 capitalize">{g.karyawan?.tipe?.replace('_', ' ')}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-green-600 font-medium">
                                                        {formatCurrency(penerimaan)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-red-600 font-medium">
                                                        {potongan > 0 ? formatCurrency(potongan) : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-md inline-block">
                                                        {formatCurrency(g.netto)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {status === 'draft' ? (
                                                        <Link 
                                                            href={route('hr.payroll.review', g.id)} 
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Review & Edit &rarr;
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Terkunci</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {gajis.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                Tidak ada data karyawan di periode ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal Approve / Pay */}
            <Modal show={confirmingPay} onClose={() => setConfirmingPay(false)}>
                <form onSubmit={handlePay} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                        <CheckCircle2 className="w-6 h-6 mr-2 text-green-600" />
                        Setujui dan Tandai Telah Dibayar
                    </h2>

                    <p className="mt-1 text-sm text-gray-600 mb-6">
                        Anda akan menyetujui total pembayaran sebesar <strong>{formatCurrency(total_gaji)}</strong> untuk periode <strong>{getBulanName(bulan)} {tahun}</strong>. 
                        Tindakan ini akan merubah status batch menjadi 'Dibayar' dan mengunci semua komponen di dalamnya dari pengeditan. Apakah Anda yakin?
                    </p>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => setConfirmingPay(false)}>Batal</SecondaryButton>

                        <PrimaryButton className="ml-3 bg-green-600 hover:bg-green-700">
                            Ya, Tandai Dibayar
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

        </AuthenticatedLayout>
    );
}
