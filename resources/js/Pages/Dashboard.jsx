import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Factory, DollarSign, Clock, Wrench, MapPin, TrendingUp, 
    BarChart3, ArrowRight, ShieldCheck, Users, Truck, Building2 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard({ auth, ownerData = {} }) {
    const summaryToday = ownerData.summary_today || {};
    const rabSummary = ownerData.rab_summary || {};
    const petaTitik = ownerData.peta_titik || [];
    const trenBulanan = ownerData.tren_bulanan || [];

    const [selectedTitik, setSelectedTitik] = useState(null);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dashboard Utama (Owner)</h2>}
        >
            <Head title="Owner Dashboard" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Ringkasan Hari Ini Cards with Drill-down Links */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        {/* Produksi Hari Ini */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Factory className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Hari Ini</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Output Produksi</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {Number(summaryToday.produksi_output || 0).toLocaleString('id-ID')} <span className="text-sm font-normal text-gray-500">unit</span>
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t">
                                <Link href="/production" className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800">
                                    Detail Produksi <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </div>
                        </div>

                        {/* Pengeluaran Hari Ini */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-800 rounded-full">Kas Keluar</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pengeluaran Hari Ini</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    Rp {Number(summaryToday.pengeluaran || 0).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t">
                                <Link href="/finance/mutasi-kas" className="inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-800">
                                    Detail Mutasi Kas <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </div>
                        </div>

                        {/* PO Menunggu Approval */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Pending</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">PO Menunggu Approval</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {summaryToday.po_pending_approval || 0} <span className="text-sm font-normal text-gray-500">PO</span>
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t">
                                <Link href="/procurement/po" className="inline-flex items-center text-xs font-semibold text-amber-600 hover:text-amber-800">
                                    Review & Approval PO <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </div>
                        </div>

                        {/* Unit Servis Jatuh Tempo */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <Wrench className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-800 rounded-full">Armada</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Servis Jatuh Tempo</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {summaryToday.unit_servis_jatuh_tempo || 0} <span className="text-sm font-normal text-gray-500">Unit</span>
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t">
                                <Link href="/fleet/armada" className="inline-flex items-center text-xs font-semibold text-purple-600 hover:text-purple-800">
                                    Detail Armada & Servis <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </div>
                        </div>

                    </div>

                    {/* Section 2: Peta Aktif (Titik Lokasi) & Summary RAB */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Peta Aktif Interaktif */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <div className="flex justify-between items-center border-b pb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-indigo-600" /> Peta Titik Operasional Aktif
                                    </h3>
                                    <p className="text-xs text-gray-500">Status distribusi SDM & Armada di tiap titik lokasi</p>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                                    {petaTitik.length} Titik Aktif
                                </span>
                            </div>

                            {/* Map Simulation & Points List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                    <div className="relative z-10">
                                        <p className="text-xs text-indigo-300 uppercase font-semibold">Monitoring Koordinat</p>
                                        <p className="text-sm font-bold mt-1">{selectedTitik ? selectedTitik.nama : 'Pilih Titik Lokasi'}</p>
                                        {selectedTitik && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Proyek: {selectedTitik.proyek_nama} | Coords: {selectedTitik.latitude.toFixed(4)}, {selectedTitik.longitude.toFixed(4)}
                                            </p>
                                        )}
                                    </div>

                                    {selectedTitik ? (
                                        <div className="relative z-10 space-y-3 mt-4 pt-3 border-t border-slate-700">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-slate-800 p-2 rounded flex items-center space-x-2">
                                                    <Users className="w-4 h-4 text-green-400" />
                                                    <div>
                                                        <p className="text-gray-400">SDM Aktif</p>
                                                        <p className="font-bold text-white text-sm">{selectedTitik.sdm_count} Personel</p>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-800 p-2 rounded flex items-center space-x-2">
                                                    <Truck className="w-4 h-4 text-amber-400" />
                                                    <div>
                                                        <p className="text-gray-400">Armada Aktif</p>
                                                        <p className="font-bold text-white text-sm">{selectedTitik.armada_count} Unit</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/core/titik/${selectedTitik.id}`}
                                                className="block text-center py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition"
                                            >
                                                Lihat Detail Titik & Operational Log →
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="relative z-10 text-center py-6 text-gray-400 text-xs">
                                            Klik salah satu titik di sebelah kanan untuk melihat detail lokasi.
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {petaTitik.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-gray-500">Belum ada titik aktif.</div>
                                    ) : (
                                        petaTitik.map((t) => (
                                            <div
                                                key={t.id}
                                                onClick={() => setSelectedTitik(t)}
                                                className={`p-3 rounded-lg border text-xs cursor-pointer transition flex justify-between items-center ${selectedTitik?.id === t.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <div>
                                                    <p className="font-semibold text-gray-900">{t.nama}</p>
                                                    <p className="text-gray-500">{t.proyek_nama}</p>
                                                </div>
                                                <div className="flex items-center space-x-3 text-right">
                                                    <span className="text-gray-600 font-medium">{t.sdm_count} SDM</span>
                                                    <span className="text-gray-600 font-medium">{t.armada_count} Armada</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RAB vs Realisasi Summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between space-y-4">
                            <div>
                                <div className="flex justify-between items-center border-b pb-3 mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-indigo-600" /> Ringkasan RAB Aktif
                                    </h3>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                                        {rabSummary.total_proyek_aktif || 0} Proyek
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Rencana Anggaran Total</span>
                                            <span className="font-bold text-gray-900">Rp {Number(rabSummary.total_rencana || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                                            <span>Realisasi Pengeluaran</span>
                                            <span className="font-bold text-blue-600">Rp {Number(rabSummary.total_realisasi || 0).toLocaleString('id-ID')}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${rabSummary.persentase > 90 ? 'bg-red-500' : rabSummary.persentase > 75 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                                style={{ width: `${Math.min(100, rabSummary.persentase || 0)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold mt-1">
                                            <span className="text-gray-500">Penyerapan:</span>
                                            <span className="text-indigo-600">{rabSummary.persentase || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <Link href={route('finance.laporan-keuangan.rab-realisasi')}>
                                    <button className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2">
                                        Lihat Laporan RAB vs Realisasi Lengkap <ArrowRight className="w-4 h-4" />
                                    </button>
                                </Link>
                            </div>
                        </div>

                    </div>

                    {/* Section 3: Grafik Tren Recharts */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-600" /> Grafik Tren Produksi & Pengeluaran (6 Bulan)
                                </h3>
                                <p className="text-xs text-gray-500">Visualisasi historis dinamika operasional</p>
                            </div>
                            <Link href={route('finance.laporan-keuangan.laba-rugi')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                                Laporan Laba Rugi <ArrowRight className="w-3.5 h-3.5 inline" />
                            </Link>
                        </div>

                        {trenBulanan.length === 0 ? (
                            <div className="py-8 text-center text-xs text-gray-500">Belum ada data grafik.</div>
                        ) : (
                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trenBulanan} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="bulan" />
                                        <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(value) => Number(value).toLocaleString('id-ID')} />
                                        <Legend />
                                        <Bar dataKey="produksi" name="Volume Produksi" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="pengeluaran" name="Pengeluaran (Rp)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
