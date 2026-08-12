import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle2, Clock, Calendar, FileText } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';

export default function Show({ auth, invoice, akunKasList = [] }) {
    const [showingPaymentModal, setShowingPaymentModal] = useState(false);

    const paymentForm = useForm({
        invoice_id: invoice.id,
        tanggal: new Date().toISOString().split('T')[0],
        jumlah: invoice.summary.sisa > 0 ? invoice.summary.sisa : '',
        metode: 'transfer',
        akun_kas_bank_id: akunKasList.length > 0 ? akunKasList[0].id : '',
        catatan: '',
    });

    const submitPayment = (e) => {
        e.preventDefault();
        paymentForm.post(route('pembayaran-klien.store-invoice', invoice.id), {
            onSuccess: () => {
                setShowingPaymentModal(false);
                paymentForm.reset('catatan');
            },
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'lunas':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">LUNAS</span>;
            case 'lunas_sebagian':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">LUNAS SEBAGIAN</span>;
            case 'terkirim':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">TERKIRIM</span>;
            case 'jatuh_tempo':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">JATUH TEMPO</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">DRAFT</span>;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('finance.invoice.index')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detail Invoice: {invoice.kode_invoice}
                    </h2>
                </div>
            }
        >
            <Head title={`Invoice - ${invoice.kode_invoice}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                            <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                                <FileText className="w-4 h-4 mr-1 text-indigo-500" /> Total Nilai Invoice
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(invoice.summary.total).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                            <div className="text-sm font-medium text-green-600 mb-1 flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Total Telah Dibayar
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(invoice.summary.total_bayar).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
                            <div className="text-sm font-medium text-amber-600 mb-1 flex items-center">
                                <Clock className="w-4 h-4 mr-1" /> Sisa Piutang Tagihan
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Rp {Number(invoice.summary.sisa).toLocaleString('id-ID')}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Info */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{invoice.kode_invoice}</h3>
                                <p className="text-sm text-gray-500">Unit Bisnis: <span className="font-semibold text-gray-700">{invoice.unit_bisnis}</span></p>
                                <p className="text-sm text-gray-500">Proyek / Klien: <span className="font-semibold text-gray-700">{invoice.proyek}</span></p>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2">
                                <div>{getStatusBadge(invoice.status)}</div>
                                <p className="text-xs text-gray-500">
                                    Jatuh Tempo: <span className="font-semibold text-gray-700">{invoice.tanggal_jatuh_tempo ? new Date(invoice.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Item Table */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Rincian Item Tagihan</h4>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi Item</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Satuan (Rp)</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invoice.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.deskripsi}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 text-right">{item.jumlah}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 text-right">Rp {Number(item.harga_satuan).toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">Rp {Number(item.subtotal).toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 font-bold">
                                        <tr>
                                            <td colSpan="3" className="px-6 py-3 text-right text-sm text-gray-700 uppercase">Total Invoice:</td>
                                            <td className="px-6 py-3 text-right text-sm text-indigo-600">Rp {Number(invoice.summary.total).toLocaleString('id-ID')}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Payment History & Action */}
                        <div className="pt-4 border-t space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-md font-semibold text-gray-800">Riwayat Pembayaran Klien</h4>
                                {invoice.summary.sisa > 0 && (
                                    <PrimaryButton onClick={() => setShowingPaymentModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                                        <CreditCard className="w-4 h-4" /> Catat Pembayaran
                                    </PrimaryButton>
                                )}
                            </div>

                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah (Rp)</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akun Kas Tujuan</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invoice.pembayarans.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                                                    Belum ada pembayaran yang dicatat untuk invoice ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            invoice.pembayarans.map((p) => (
                                                <tr key={p.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {p.tanggal ? new Date(p.tanggal).toLocaleDateString('id-ID') : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                                                        Rp {Number(p.jumlah).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                                                        {p.metode}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {p.akun_kas}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {p.catatan || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Modal Form Catat Pembayaran */}
            <Modal show={showingPaymentModal} onClose={() => setShowingPaymentModal(false)}>
                <form onSubmit={submitPayment} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Catat Pembayaran Klien</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="jumlah_bayar" value="Jumlah Pembayaran (Rp)" />
                            <TextInput
                                id="jumlah_bayar"
                                type="number"
                                className="mt-1 block w-full"
                                value={paymentForm.data.jumlah}
                                onChange={e => paymentForm.setData('jumlah', e.target.value)}
                                required
                                max={invoice.summary.sisa}
                                min="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Sisa Piutang: Rp {Number(invoice.summary.sisa).toLocaleString('id-ID')}</p>
                            <InputError message={paymentForm.errors.jumlah} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="akun_kas_bank_id" value="Masuk ke Akun Kas/Bank" />
                            <select
                                id="akun_kas_bank_id"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                value={paymentForm.data.akun_kas_bank_id}
                                onChange={e => paymentForm.setData('akun_kas_bank_id', e.target.value)}
                                required
                            >
                                <option value="">-- Pilih Akun Kas/Bank --</option>
                                {akunKasList.map(a => (
                                    <option key={a.id} value={a.id}>{a.nama}</option>
                                ))}
                            </select>
                            <InputError message={paymentForm.errors.akun_kas_bank_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="tanggal_bayar" value="Tanggal Pembayaran" />
                            <TextInput
                                id="tanggal_bayar"
                                type="date"
                                className="mt-1 block w-full"
                                value={paymentForm.data.tanggal}
                                onChange={e => paymentForm.setData('tanggal', e.target.value)}
                                required
                            />
                            <InputError message={paymentForm.errors.tanggal} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="metode" value="Metode Pembayaran" />
                            <select
                                id="metode"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                value={paymentForm.data.metode}
                                onChange={e => paymentForm.setData('metode', e.target.value)}
                                required
                            >
                                <option value="transfer">Transfer Bank</option>
                                <option value="tunai">Tunai</option>
                                <option value="cek_bg">Cek / Bilyet Giro</option>
                            </select>
                            <InputError message={paymentForm.errors.metode} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="catatan_bayar" value="Catatan (Opsional)" />
                            <TextInput
                                id="catatan_bayar"
                                type="text"
                                className="mt-1 block w-full"
                                value={paymentForm.data.catatan}
                                onChange={e => paymentForm.setData('catatan', e.target.value)}
                                placeholder="Nomor referensi transfer / catatan"
                            />
                            <InputError message={paymentForm.errors.catatan} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                        <SecondaryButton type="button" onClick={() => setShowingPaymentModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton className="bg-green-600 hover:bg-green-700" disabled={paymentForm.processing}>
                            Simpan Pembayaran
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
