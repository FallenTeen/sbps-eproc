import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function ReportHarian({ tanggal, rekap, detail }) {
    const [tgl, setTgl] = useState(tanggal);

    const handleCari = () => {
        router.get(route("fleet.ritase.report-harian"), { tanggal: tgl });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Ritase Harian" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Laporan Ritase Harian</h1>
                <p className="mt-1 text-sm text-gray-500">Rekap ritase per armada</p>
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

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Rekap per Armada</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Armada</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Plat Nomor</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Total Rit</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Total Upah</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rekap.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            rekap.map((r, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.kode_unit}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{r.plat_nomor}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{r.total_rit}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                        Rp {Number(r.total_upah).toLocaleString("id-ID")}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Detail Ritase</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Armada</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Rute</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Rit</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Tarif/Rit</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {detail.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            detail.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.armada?.kode_unit}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{r.driver?.nama}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {r.ruteTarif?.lokasi_asal} → {r.ruteTarif?.lokasi_tujuan}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{r.jumlah_rit}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                        Rp {Number(r.tarif_per_rit_snapshot).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                        Rp {Number(r.total_upah_rit).toLocaleString("id-ID")}
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