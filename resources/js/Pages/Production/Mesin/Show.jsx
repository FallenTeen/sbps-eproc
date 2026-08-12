import React, { useState } from "react";
import { Link, useForm, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Trash2, Wrench, FileCheck, Fuel, AlertTriangle } from "lucide-react";

export default function Show({ mesin }) {
    const { delete: destroy } = useForm();
    const [activeTab, setActiveTab] = useState("info");

    const handleDelete = () => {
        if (confirm("Apakah Anda yakin ingin menghapus mesin produksi ini?")) {
            destroy(route("production.mesin.destroy", mesin.id));
        }
    };

    const handleStartDowntime = (e) => {
        e.preventDefault();
        const penyebab = prompt("Penyebab Downtime:");
        if (penyebab) {
            router.post(route("production.mesin.start-downtime", mesin.id), {
                mulai: new Date().toISOString().slice(0, 19).replace('T', ' '),
                penyebab,
                kategori: "kerusakan_mesin",
                catatan: ""
            });
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            aktif: "bg-emerald-200 text-emerald-800",
            rusak: "bg-red-200 text-red-800",
            maintenance: "bg-yellow-200 text-yellow-800",
            nonaktif: "bg-gray-200 text-gray-800",
        };
        return colors[status] || "bg-gray-200 text-gray-800";
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(number || 0);
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route("production.mesin.index")}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">{mesin.nama}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(mesin.status)}`}>
                        {mesin.status.toUpperCase()}
                    </span>
                </div>
                <div className="flex gap-2">
                    {mesin.status === 'aktif' && (
                        <button
                            onClick={handleStartDowntime}
                            className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-md flex items-center gap-2 border border-red-200 font-medium transition-colors"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Start Downtime
                        </button>
                    )}
                    <Link
                        href={route("production.mesin.edit", mesin.id)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-md flex items-center gap-2 border border-amber-200 font-medium transition-colors"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 space-x-8">
                {['info', 'service', 'checklist', 'bbm', 'downtime'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                            activeTab === tab 
                            ? "border-blue-600 text-blue-600" 
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        {tab === 'info' ? 'Informasi' : 
                         tab === 'service' ? 'Riwayat Servis' : 
                         tab === 'checklist' ? 'Checklist Harian' : 
                         tab === 'bbm' ? 'Log BBM' : 'Downtime'}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                
                {/* Informasi Tab */}
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Detail Mesin</h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Jenis Mesin</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{mesin.jenis}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Unit Bisnis</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{mesin.unit_bisnis?.nama}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Lokasi / Titik</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{mesin.titik?.nama || "-"}</dd>
                                </div>
                            </dl>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Operasional</h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Produk Default (Output)</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{mesin.produk_default?.nama_produk || "-"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Kapasitas Produksi</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{mesin.kapasitas || "-"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Biaya Per Jam</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-medium">{formatRupiah(mesin.biaya_per_jam)}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {/* Riwayat Servis Tab */}
                {activeTab === 'service' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">10 Servis Terakhir</h3>
                            <button onClick={() => {
                                const tanggal = prompt("Tanggal (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
                                const jenis_servis = prompt("Jenis Servis:");
                                const biaya = prompt("Biaya (Rp):");
                                if(tanggal && jenis_servis && biaya) {
                                    router.post(route('production.mesin.record-service', mesin.id), { tanggal, jenis_servis, biaya });
                                }
                            }} className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100 flex items-center gap-1"><Wrench className="w-4 h-4"/> Catat Servis</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Jenis Servis</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Biaya</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mesin.service_histories?.map(s => (
                                        <tr key={s.id} className="border-b">
                                            <td className="px-4 py-2 text-sm">{new Date(s.tanggal).toLocaleDateString('id-ID')}</td>
                                            <td className="px-4 py-2 text-sm">{s.jenis_servis}</td>
                                            <td className="px-4 py-2 text-sm">{formatRupiah(s.biaya)}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{s.notes || '-'}</td>
                                        </tr>
                                    ))}
                                    {(!mesin.service_histories || mesin.service_histories.length === 0) && (
                                        <tr><td colSpan="4" className="px-4 py-4 text-center text-sm text-gray-500">Belum ada riwayat servis.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Checklist Harian Tab */}
                {activeTab === 'checklist' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">10 Checklist Terakhir</h3>
                            <button onClick={() => {
                                const tanggal = prompt("Tanggal (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
                                const kondisi = confirm("Kondisi Baik? (OK = Ya, Cancel = Tidak)");
                                const masalah = kondisi ? "" : prompt("Detail Masalah:");
                                if(tanggal) {
                                    router.post(route('production.mesin.record-checklist', mesin.id), { tanggal, kondisi_baik: kondisi, item_bermasalah: masalah });
                                }
                            }} className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100 flex items-center gap-1"><FileCheck className="w-4 h-4"/> Catat Checklist</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Kondisi</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Masalah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mesin.checklists?.map(c => (
                                        <tr key={c.id} className="border-b">
                                            <td className="px-4 py-2 text-sm">{new Date(c.tanggal).toLocaleDateString('id-ID')}</td>
                                            <td className="px-4 py-2 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs ${c.kondisi_baik ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {c.kondisi_baik ? 'BAIK' : 'BERMASALAH'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{c.item_bermasalah || '-'}</td>
                                        </tr>
                                    ))}
                                    {(!mesin.checklists || mesin.checklists.length === 0) && (
                                        <tr><td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">Belum ada riwayat checklist.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* BBM Tab */}
                {activeTab === 'bbm' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">10 Log BBM Terakhir</h3>
                            <button onClick={() => {
                                const tanggal = prompt("Tanggal (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
                                const liter = prompt("Jumlah (Liter):");
                                const biaya = prompt("Biaya Total (Rp):");
                                if(tanggal && liter && biaya) {
                                    router.post(route('production.mesin.record-bbm', mesin.id), { tanggal, liter, biaya });
                                }
                            }} className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100 flex items-center gap-1"><Fuel className="w-4 h-4"/> Catat BBM</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Liter</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Biaya</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mesin.bbm_logs?.map(b => (
                                        <tr key={b.id} className="border-b">
                                            <td className="px-4 py-2 text-sm">{new Date(b.tanggal).toLocaleDateString('id-ID')}</td>
                                            <td className="px-4 py-2 text-sm font-medium">{b.liter} L</td>
                                            <td className="px-4 py-2 text-sm">{formatRupiah(b.biaya)}</td>
                                        </tr>
                                    ))}
                                    {(!mesin.bbm_logs || mesin.bbm_logs.length === 0) && (
                                        <tr><td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">Belum ada log BBM.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Downtime Tab */}
                {activeTab === 'downtime' && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">10 Downtime Terakhir</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Mulai</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Selesai</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Penyebab</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mesin.downtimes?.map(d => (
                                        <tr key={d.id} className="border-b">
                                            <td className="px-4 py-2 text-sm">{new Date(d.mulai).toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-2 text-sm">{d.selesai ? new Date(d.selesai).toLocaleString('id-ID') : <span className="text-amber-600 font-medium">Sedang Berlangsung</span>}</td>
                                            <td className="px-4 py-2 text-sm uppercase">{d.kategori.replace('_', ' ')}</td>
                                            <td className="px-4 py-2 text-sm">{d.penyebab}</td>
                                            <td className="px-4 py-2 text-sm text-right">
                                                {!d.selesai && (
                                                    <button onClick={() => {
                                                        const selesai = prompt("Waktu Selesai (YYYY-MM-DD HH:mm:ss):", new Date().toISOString().slice(0, 19).replace('T', ' '));
                                                        if(selesai) {
                                                            router.post(route('production.mesin.end-downtime', { mesin: mesin.id, downtime: d.id }), { selesai });
                                                        }
                                                    }} className="text-blue-600 hover:underline">Selesaikan</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!mesin.downtimes || mesin.downtimes.length === 0) && (
                                        <tr><td colSpan="5" className="px-4 py-4 text-center text-sm text-gray-500">Belum ada riwayat downtime.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
