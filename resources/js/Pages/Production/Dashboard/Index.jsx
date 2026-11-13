import React from 'react';
import { Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { TrendingUp, Package, Activity } from 'lucide-react';
import { formatStatusLabel } from '@/utils/statusLabels';

export default function Index({ metrics }) {
    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Ringkasan Produksi</h1>
                <p className="text-sm text-gray-700 mt-1">
                    Pantau proses yang sedang berjalan, hasil produksi, pemeriksaan mutu (QC), dan pengiriman.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard
                    title="Proses produksi berlangsung"
                    value={metrics.active_sessions_count}
                    suffix="proses"
                    description="Jumlah proses yang belum selesai."
                />
                <KpiCard
                    title="Perkiraan selisih pendapatan dan biaya"
                    value={`Rp ${Number(metrics.margin_today).toLocaleString('id-ID')}`}
                    description="Dihitung dari produksi yang selesai hari ini. Nilai negatif berarti biaya lebih besar."
                />
                <KpiCard
                    title="Sampel menunggu hasil uji tekan"
                    value={metrics.pending_qc_count}
                    suffix="sampel"
                    description="Uji tekan memeriksa kekuatan sampel beton."
                    link={route('production.qc.pending')}
                />
                <KpiCard 
                    title="Pengiriman Hari Ini" 
                    value={metrics.pengiriman_today_count} 
                    suffix="pengiriman"
                    description="Jumlah pengiriman yang mulai dimuat hari ini."
                    link={route('production.pengiriman.today')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Package aria-hidden="true" className="w-5 h-5 text-gray-500" /> Hasil produksi selesai hari ini
                    </h2>
                    <p className="mb-4 text-sm text-gray-600">Jumlah ditampilkan dengan satuan masing-masing produk.</p>
                    <div className="space-y-4">
                        {Object.keys(metrics.output_today_per_product).length === 0 ? (
                            <p className="text-sm text-gray-600 py-4" role="status">Belum ada produksi yang selesai hari ini.</p>
                        ) : (
                            Object.entries(metrics.output_today_per_product).map(([produk, data], idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-semibold text-gray-900">{produk}</span>
                                    <span className="font-semibold tabular-nums text-gray-900">
                                        {Number(data.volume).toLocaleString('id-ID')} <span className="text-sm font-normal text-gray-700">{data.satuan}</span>
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Activity aria-hidden="true" className="w-5 h-5 text-gray-500" /> Proses produksi yang sedang berjalan
                        </h2>
                        <Link href={route('production.sessions.active')} className="text-sm text-gray-900 hover:underline font-medium">Lihat semua</Link>
                    </div>
                    
                    <div className="space-y-3">
                        {metrics.active_sessions_list.length === 0 ? (
                            <p className="text-sm text-gray-600 py-4" role="status">Tidak ada proses produksi yang sedang berlangsung.</p>
                        ) : (
                            metrics.active_sessions_list.map((session) => (
                                <Link key={session.id} href={route('production.sessions.show', session.id)} className="block bg-white border border-gray-200 hover:border-black focus:outline-none focus:ring-2 focus:ring-black p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{session.produk || 'Produk tidak tercatat'}</p>
                                                <p className="text-sm text-gray-700">Mesin: {session.mesin || 'Belum ditentukan'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{formatStatusLabel('berjalan')}</p>
                                            <p className="text-sm text-gray-600 mt-0.5">Mulai {new Date(session.mulai).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <TrendingUp aria-hidden="true" className="w-5 h-5 text-gray-500" /> Jumlah produksi selama 7 hari
                </h2>
                <p className="mb-6 text-sm text-gray-600">Setiap jenis produk ditampilkan terpisah karena satuannya dapat berbeda.</p>
                
                {metrics.chart_data.datasets.length === 0 ? (
                    <p className="text-sm text-gray-600 py-4" role="status">Belum ada produksi selesai yang tercatat dalam 7 hari terakhir.</p>
                ) : (
                    <div className="space-y-8">
                        {metrics.chart_data.datasets.map((dataset, i) => {
                            const maxVal = Math.max(...dataset.data, 1); // Avoid division by zero
                            return (
                                <div key={i}>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">{dataset.label}</h4>
                                    <div className="flex items-end gap-2 h-32">
                                        {metrics.chart_data.labels.map((dateStr, idx) => {
                                            const val = dataset.data[idx];
                                            const heightPct = (val / maxVal) * 100;
                                            return (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                                                    <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                                                        {Number(val).toLocaleString('id-ID')} {dataset.label}
                                                    </div>
                                                    
                                                    <div className="w-full bg-indigo-100 rounded-t-sm flex items-end justify-center" style={{ height: '100%' }}>
                                                        <div 
                                                            className="w-full bg-indigo-500 rounded-t-sm transition-all duration-500"
                                                            style={{ height: `${heightPct}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                                                        {new Date(dateStr).getDate()} {new Date(dateStr).toLocaleString('id-ID', {month:'short'})}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
}

function KpiCard({ title, value, suffix, description, link }) {
    const card = (
        <div className="flex h-full flex-col border border-gray-300 bg-white p-4">
            <p className="text-sm font-medium leading-5 text-gray-700">{title}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-950">
                {value}{suffix && <span className="ml-1 text-sm font-medium text-gray-600">{suffix}</span>}
            </p>
            {description && <p className="mt-2 text-sm leading-5 text-gray-700">{description}</p>}
        </div>
    );

    return link ? <Link href={link} className="block h-full">{card}</Link> : card;
}
