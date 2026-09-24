import React, { useEffect, useRef } from 'react';
import Layout from '@/Components/Layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';

function formatWaktu(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Show({ auth, proyek, komunikasiLogs = [] }) {
    const form = useForm({ pesan: '' });
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [komunikasiLogs.length]);

    const submit = (e) => {
        e.preventDefault();
        form.post(route('komunikasi.send', proyek.id), {
            onSuccess: () => form.reset('pesan'),
        });
    };

    // Dari perspektif kantor: pesan "kantor" = diri sendiri (kanan), kontraktor = kiri.
    const isKantorView = (role) => role === 'kantor';

    return (
        <Layout>
            <Head title={`Komunikasi - ${proyek.nama}`} />

            <div className="flex items-center gap-4 mb-6">
                <Link href={route('komunikasi.index')} className="text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">
                        Komunikasi: {proyek.nama} ({proyek.kode_proyek})
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        {proyek.unit_bisnis || '-'}
                        {proyek.client ? ` · Klien: ${proyek.client}` : ''} · Status: {proyek.status}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-gray-800">Thread Komunikasi Proyek</span>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-6 bg-gray-50">
                    {komunikasiLogs.length === 0 ? (
                        <div className="py-10 text-center text-xs text-gray-500">
                            Belum ada percakapan. Tulis pesan di bawah untuk memulai.
                        </div>
                    ) : (
                        komunikasiLogs.map((log) => {
                            const self = isKantorView(log.pengirim_role);
                            return (
                                <div key={log.id} className={`flex flex-col ${self ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`max-w-xl p-3.5 rounded-lg text-sm ${
                                            self
                                                ? 'bg-indigo-600 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center text-xs opacity-75 mb-1 gap-4">
                                            <span className="font-semibold">
                                                {log.pengirim} ({log.pengirim_role})
                                            </span>
                                            <span>{formatWaktu(log.waktu)}</span>
                                        </div>
                                        <p className="whitespace-pre-wrap">{log.pesan}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                <form onSubmit={submit} className="flex gap-3 p-4 border-t bg-white">
                    <input
                        type="text"
                        value={form.data.pesan}
                        onChange={(e) => form.setData('pesan', e.target.value)}
                        placeholder="Tulis pesan untuk kontraktor / produksi..."
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                        maxLength="1000"
                    />
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-60"
                    >
                        <Send className="w-4 h-4" /> Kirim
                    </button>
                </form>
            </div>
        </Layout>
    );
}