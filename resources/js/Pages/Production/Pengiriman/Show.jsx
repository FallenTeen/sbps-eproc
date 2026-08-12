import React, { useState } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeft, Truck, Play, CheckCircle2, Clock, MapPin, XCircle, AlertTriangle } from 'lucide-react';

export default function Show({ pengiriman }) {
    const isScheduled = pengiriman.status === 'dijadwalkan';
    const isTraveling = pengiriman.status === 'dalam_perjalanan';
    const isCompleted = pengiriman.status === 'selesai';
    const isCancelled = pengiriman.status === 'dibatalkan';

    const getStatusStyle = () => {
        if (isScheduled) return 'bg-yellow-100 text-yellow-800';
        if (isTraveling) return 'bg-blue-100 text-blue-800 animate-pulse';
        if (isCompleted) return 'bg-emerald-100 text-emerald-800';
        return 'bg-gray-100 text-gray-800';
    };

    const handleStart = () => {
        if (confirm('Mulai perjalanan pengiriman ini?')) {
            router.post(route('production.pengiriman.start', pengiriman.id));
        }
    };

    const handleCancel = () => {
        if (confirm('Batalkan pengiriman ini?')) {
            router.post(route('production.pengiriman.cancel', pengiriman.id));
        }
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href={route('production.pengiriman.index')} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Detail Pengiriman <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${getStatusStyle()}`}>{pengiriman.status.replace('_', ' ').toUpperCase()}</span></h1>
                        <p className="text-sm text-gray-500 mt-1">Tujuan: {pengiriman.tujuan_alamat}</p>
                    </div>
                </div>
                {isScheduled && (
                    <div className="flex gap-2">
                        <button onClick={handleCancel} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                            <XCircle className="w-4 h-4" /> Batalkan
                        </button>
                        <button onClick={handleStart} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-colors flex items-center gap-2">
                            <Play className="w-4 h-4" /> Mulai Perjalanan
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Informasi Produk & Sesi</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">ID Sesi</span>
                            <Link href={route('production.sessions.show', pengiriman.production_session_id)} className="text-sm font-semibold text-blue-600 hover:underline">#{pengiriman.production_session_id}</Link>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Produk</span>
                            <span className="text-sm font-medium text-gray-900">{pengiriman.session?.produk?.nama}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Volume Output Sesi</span>
                            <span className="text-sm font-bold text-gray-900">{pengiriman.session?.hasil_output} {pengiriman.session?.produk?.satuan_output}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Mesin Produksi</span>
                            <span className="text-sm font-medium text-gray-900">{pengiriman.session?.mesin?.nama}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Logistik & Tujuan</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-4 h-4"/> Tujuan</span>
                            <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{pengiriman.tujuan_alamat}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500 flex items-center gap-1.5"><Truck className="w-4 h-4"/> Armada</span>
                            <span className="text-sm font-medium text-gray-900">{pengiriman.armada?.nopol ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500 flex items-center gap-1.5"><Truck className="w-4 h-4"/> Supir</span>
                            <span className="text-sm font-medium text-gray-900">{pengiriman.driver?.nama ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500 flex items-center gap-1.5"><Clock className="w-4 h-4"/> Waktu Muat</span>
                            <span className="text-sm font-bold text-gray-900">{new Date(pengiriman.waktu_muat).toLocaleString('id-ID', {dateStyle:'medium', timeStyle:'short'})}</span>
                        </div>
                    </div>
                </div>
            </div>

            {isTraveling && (
                <CompleteDeliveryPanel pengiriman={pengiriman} />
            )}

            {isCompleted && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4 text-emerald-700">
                        <CheckCircle2 className="w-6 h-6" />
                        <h3 className="text-lg font-bold">Pengiriman Selesai</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Waktu Tiba di Tujuan</p>
                            <p className="font-semibold text-gray-900">{pengiriman.waktu_tiba_tujuan ? new Date(pengiriman.waktu_tiba_tujuan).toLocaleString('id-ID', {dateStyle:'medium', timeStyle:'short'}) : '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Waktu Selesai Tuang</p>
                            <p className="font-semibold text-gray-900">{pengiriman.waktu_selesai_tuang ? new Date(pengiriman.waktu_selesai_tuang).toLocaleString('id-ID', {dateStyle:'medium', timeStyle:'short'}) : '-'}</p>
                        </div>
                    </div>
                    {pengiriman.catatan && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 mb-1">Catatan Penyelesaian</p>
                            <p className="text-sm text-gray-800">{pengiriman.catatan}</p>
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
}

function CompleteDeliveryPanel({ pengiriman }) {
    const { data, setData, post, processing, errors } = useForm({
        waktu_tiba_tujuan: '',
        waktu_selesai_tuang: '',
        catatan: '',
    });

    // Warning validation: Tuang > 120 mins from Muat
    let warning = null;
    if (data.waktu_selesai_tuang && pengiriman.waktu_muat) {
        const diffMins = Math.round((new Date(data.waktu_selesai_tuang) - new Date(pengiriman.waktu_muat)) / 60000);
        if (diffMins > 120) {
            warning = `Durasi dari muat hingga selesai tuang mencapai ${diffMins} menit (Batas aman: 120 menit). Mutu beton mungkin terpengaruh.`;
        } else if (diffMins < 0) {
            warning = "Waktu selesai tuang tidak boleh mendahului waktu muat.";
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('production.pengiriman.complete', pengiriman.id));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-blue-900">Selesaikan Pengiriman</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Waktu Tiba di Tujuan (Opsional)</label>
                        <input type="datetime-local" value={data.waktu_tiba_tujuan} onChange={e => setData('waktu_tiba_tujuan', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300" />
                        {errors.waktu_tiba_tujuan && <p className="text-xs text-red-500 mt-1">{errors.waktu_tiba_tujuan}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Waktu Selesai Tuang *</label>
                        <input type="datetime-local" value={data.waktu_selesai_tuang} onChange={e => setData('waktu_selesai_tuang', e.target.value)} required className={`w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300 ${warning && warning.includes('Batas aman') ? 'border-orange-400 bg-orange-50' : ''}`} />
                        {errors.waktu_selesai_tuang && <p className="text-xs text-red-500 mt-1">{errors.waktu_selesai_tuang}</p>}
                        
                        {warning && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{warning}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Penyelesaian</label>
                    <textarea value={data.catatan} onChange={e => setData('catatan', e.target.value)} rows={2} className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300" />
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2 transition-colors">
                        <CheckCircle2 className="w-5 h-5" /> Konfirmasi Selesai
                    </button>
                </div>
            </form>
        </div>
    );
}
