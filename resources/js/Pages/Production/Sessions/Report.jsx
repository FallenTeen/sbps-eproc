import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const rupiah = (v) => "Rp " + Number(v || 0).toLocaleString("id-ID");

export default function Report({ sessions, aggregate, tanggal }) {
    const [tgl, setTgl] = useState(tanggal);

    const handleCari = () => {
        router.get(route("production.sessions.report-harian"), { tanggal: tgl });
    };

    const getStatusBadge = (status) => {
        const colors = {
            berjalan: "bg-green-200 text-green-800",
            selesai: "bg-blue-200 text-blue-800",
            dibatalkan: "bg-red-200 text-red-800",
        };
        return colors[status] || "bg-gray-200 text-gray-800";
    };

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Produksi Harian" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Laporan Produksi Harian</h1>
                <p className="mt-1 text-sm text-gray-500">Rekap sesi produksi per hari</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex gap-3 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                    <input
                        type="date"
                        value={tgl}
                        onChange={(e) => setTgl(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2"
                    />
                </div>
                <button
                    onClick={handleCari}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md text-sm"
                >
                    Tampilkan
                </button>
            </div>

            {/* Ringkasan */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Total Sesi</p>
                    <p className="text-xl font-bold text-gray-900">{sessions.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Output</p>
                    <p className="text-xl font-bold text-gray-900">{Number(aggregate.total_output).toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Biaya</p>
                    <p className="text-xl font-bold text-gray-900">{rupiah(aggregate.biaya)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Pendapatan</p>
                    <p className="text-xl font-bold text-gray-900">{rupiah(aggregate.pendapatan)}</p>
                </div>
            </div>

            {/* Per produk */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Output per Produk</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Produk</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Sesi</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Output</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(aggregate.per_produk || {}).length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            Object.entries(aggregate.per_produk).map(([nama, p]) => (
                                <tr key={nama}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{nama}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{p.sesi}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{Number(p.output).toLocaleString("id-ID")}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail sesi */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Detail Sesi</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Sesi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Mesin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Produk</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Output</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            sessions.map((s) => (
                                <tr key={s.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.kode_sesi}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{s.mesin?.nama}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{s.produk?.nama}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{Number(s.hasil_output).toLocaleString("id-ID")}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(s.status)}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}