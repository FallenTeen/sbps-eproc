import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Factory, BarChart3, FileText, MessageSquare, Send, CheckCircle2, Clock } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Detail({ auth, proyek, produksiSummary = [], rabAgregat = {}, invoices = [], komunikasiLogs = [] }) {
    const [activeTab, setActiveTab] = useState('produksi');

    const messageForm = useForm({
        pesan: '',
    });

    const submitMessage = (e) => {
        e.preventDefault();
        messageForm.post(route('kontraktor.komunikasi.send', proyek.id), {
            onSuccess: () => {
                messageForm.reset('pesan');
            },
        });
    };

    const getInvoiceBadge = (status) => {
        switch (status) {
            case 'lunas':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Lunas</span>;
            case 'lunas_sebagian':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Lunas Sebagian</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Pending</span>;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('kontraktor.dashboard')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Portal Proyek: {proyek.nama} ({proyek.kode_proyek})
                        </h2>
                        <p className="text-xs text-gray-500">Klien: {proyek.client || '-'} | Lokasi: {proyek.lokasi || '-'}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Proyek - ${proyek.nama}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Navigation Tabs */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveTab('produksi')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'produksi' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Factory className="w-4 h-4" /> Progres Produksi
                        </button>
                        <button
                            onClick={() => setActiveTab('rab')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'rab' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <BarChart3 className="w-4 h-4" /> RAB Level Agregat
                        </button>
                        <button
                            onClick={() => setActiveTab('invoice')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'invoice' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <FileText className="w-4 h-4" /> Daftar Invoice ({invoices.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('komunikasi')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'komunikasi' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <MessageSquare className="w-4 h-4" /> Log Komunikasi ({komunikasiLogs.length})
                        </button>
                    </div>

                    {/* TAB 1: PROGRES PRODUKSI */}
                    {activeTab === 'produksi' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Ringkasan Output Produksi</h3>
                            <p className="text-xs text-gray-500">Ringkasan akumulasi fisik hasil produksi tanpa rincian biaya.</p>

                            {produksiSummary.length === 0 ? (
                                <div className="py-8 text-center text-gray-500">Belum ada sesi produksi tercatat.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {produksiSummary.map((item, idx) => (
                                        <div key={idx} className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-lg">
                                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{item.nama}</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                                {item.total_output.toLocaleString('id-ID')} <span className="text-sm font-normal text-gray-600">{item.satuan}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">Total {item.sesi_count} Sesi Selesai</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: RAB LEVEL AGREGAT */}
                    {activeTab === 'rab' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">RAB Level Agregat</h3>
                            <p className="text-xs text-gray-500">Total Rencana Anggaran Biaya vs Realisasi (Ringkas tanpa item sensitif).</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-500 font-medium">Total Rencana Anggaran (RAB)</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        Rp {Number(rabAgregat.total_rencana || 0).toLocaleString('id-ID')}
                                    </p>
                                </div>

                                <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-sm text-blue-600 font-medium">Total Realisasi</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        Rp {Number(rabAgregat.total_realisasi || 0).toLocaleString('id-ID')}
                                    </p>
                                </div>

                                <div className="p-6 bg-purple-50 rounded-lg border border-purple-100">
                                    <p className="text-sm text-purple-600 font-medium">Penyerapan Anggaran</p>
                                    <p className="text-2xl font-bold text-purple-700 mt-1">
                                        {rabAgregat.persentase || 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: DAFTAR INVOICE (READ-ONLY) */}
                    {activeTab === 'invoice' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Daftar Invoice Proyek (Read-Only)</h3>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Invoice</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Terbit</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jatuh Tempo</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tagihan (Rp)</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Telah Dibayar (Rp)</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invoices.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                    Belum ada invoice diterbitkan untuk proyek ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            invoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                                                        {inv.kode_invoice}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                                        {inv.tanggal_terbit ? new Date(inv.tanggal_terbit).toLocaleDateString('id-ID') : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                                        {inv.tanggal_jatuh_tempo ? new Date(inv.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900">
                                                        Rp {Number(inv.total).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-green-600">
                                                        Rp {Number(inv.paid).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {getInvoiceBadge(inv.status)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: LOG KOMUNIKASI */}
                    {activeTab === 'komunikasi' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Log Komunikasi Proyek</h3>

                            {/* Thread Messages */}
                            <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                                {komunikasiLogs.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-gray-500">Belum ada percakapan. Tulis pesan di bawah untuk memulai.</div>
                                ) : (
                                    komunikasiLogs.map((log) => {
                                        const isKontraktor = log.pengirim_role === 'kontraktor';
                                        return (
                                            <div
                                                key={log.id}
                                                className={`flex flex-col ${isKontraktor ? 'items-end' : 'items-start'}`}
                                            >
                                                <div className={`max-w-xl p-3.5 rounded-lg text-sm ${isKontraktor ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'}`}>
                                                    <div className="flex justify-between items-center text-xs opacity-75 mb-1 gap-4">
                                                        <span className="font-semibold">{log.pengirim} ({log.pengirim_role})</span>
                                                        <span>{log.waktu}</span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap">{log.pesan}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Post Message Form */}
                            <form onSubmit={submitMessage} className="flex gap-3">
                                <TextInput
                                    type="text"
                                    className="flex-1"
                                    value={messageForm.data.pesan}
                                    onChange={(e) => messageForm.setData('pesan', e.target.value)}
                                    placeholder="Tulis pesan atau update komunikasi proyek..."
                                    required
                                />
                                <PrimaryButton disabled={messageForm.processing} className="flex items-center gap-2">
                                    <Send className="w-4 h-4" /> Kirim
                                </PrimaryButton>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
