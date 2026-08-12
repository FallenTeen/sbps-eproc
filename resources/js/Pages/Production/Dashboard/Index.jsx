import React from 'react';
import { Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { Play, TrendingUp, FlaskConical, Truck, Package, Clock, DollarSign, Activity } from 'lucide-react';

export default function Index({ metrics }) {
    // Basic Chart Data mapping (simple horizontal bar or just simple display if no charting lib)
    // To make it beautiful without external chart lib, we can use simple HTML/CSS bars for the "Chart"
    
    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Produksi</h1>
                <p className="text-sm text-gray-500 mt-1">Ringkasan performa produksi hari ini dan 7 hari terakhir.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard 
                    title="Sesi Aktif (Berjalan)" 
                    value={metrics.active_sessions_count} 
                    icon={<Play className="w-6 h-6 text-blue-500" />} 
                    colorClass="bg-blue-50 border-blue-100 text-blue-900"
                />
                <KpiCard 
                    title="Estimasi Margin Hari Ini" 
                    value={`Rp ${Number(metrics.margin_today).toLocaleString('id-ID')}`}
                    icon={<DollarSign className="w-6 h-6 text-emerald-500" />} 
                    colorClass="bg-emerald-50 border-emerald-100 text-emerald-900"
                />
                <KpiCard 
                    title="Pending QC (Uji Tekan)" 
                    value={metrics.pending_qc_count} 
                    icon={<FlaskConical className="w-6 h-6 text-orange-500" />} 
                    colorClass="bg-orange-50 border-orange-100 text-orange-900"
                    link={route('production.qc.pending')}
                />
                <KpiCard 
                    title="Pengiriman Hari Ini" 
                    value={metrics.pengiriman_today_count} 
                    icon={<Truck className="w-6 h-6 text-indigo-500" />} 
                    colorClass="bg-indigo-50 border-indigo-100 text-indigo-900"
                    link={route('production.pengiriman.today')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Output Hari Ini */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-gray-400" /> Output Selesai Hari Ini
                    </h3>
                    <div className="space-y-4">
                        {Object.keys(metrics.output_today_per_product).length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Belum ada output selesai hari ini.</p>
                        ) : (
                            Object.entries(metrics.output_today_per_product).map(([produk, data], idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-semibold text-gray-700">{produk}</span>
                                    <span className="font-bold text-emerald-600 text-lg">{data.volume} <span className="text-xs text-gray-500 font-normal">{data.satuan}</span></span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sesi Aktif List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" /> Sesi Produksi Berjalan
                        </h3>
                        <Link href={route('production.sessions.active')} className="text-sm text-blue-600 hover:underline font-medium">Lihat Semua</Link>
                    </div>
                    
                    <div className="space-y-3">
                        {metrics.active_sessions_list.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">Tidak ada sesi yang sedang berjalan.</p>
                        ) : (
                            metrics.active_sessions_list.map((session) => (
                                <Link key={session.id} href={route('production.sessions.show', session.id)} className="block bg-white border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Play className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{session.produk}</p>
                                                <p className="text-xs text-gray-500">Mesin: {session.mesin} | ID: #{session.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-blue-600 animate-pulse">BERJALAN</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{new Date(session.mulai).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Simple CSS Chart for Weekly Output */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" /> Tren Output (7 Hari Terakhir)
                </h3>
                
                {metrics.chart_data.datasets.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Tidak ada data untuk 7 hari terakhir.</p>
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
                                                    {/* Tooltip */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                                                        {val} {dataset.label}
                                                    </div>
                                                    
                                                    <div className="w-full bg-indigo-100 rounded-t-sm flex items-end justify-center" style={{ height: '100%' }}>
                                                        <div 
                                                            className="w-full bg-indigo-500 rounded-t-sm transition-all duration-500"
                                                            style={{ height: `${heightPct}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
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

function KpiCard({ title, value, icon, colorClass, link }) {
    const card = (
        <div className={`p-5 rounded-xl border ${colorClass} h-full flex flex-col justify-between hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold opacity-90">{title}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold mt-2">
                {value}
            </div>
        </div>
    );

    return link ? <Link href={link} className="block h-full">{card}</Link> : card;
}
