import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function ReportMingguan({ mulai, selesai, perHari, total_jam, pendapatan }) {
    const [start, setStart] = useState(mulai);
    const [end, setEnd] = useState(selesai);

    const handleCari = () => {
        router.get(route("fleet.sewa-alat.report-mingguan"), { mulai: start, selesai: end });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Sewa Alat Mingguan" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Laporan Sewa Alat Mingguan</h1>
                <p className="mt-1 text-sm text-gray-500">Rekap sewa alat per hari</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dari</label>
                    <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sampai</label>
                    <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <button onClick={handleCari} className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md text-sm">
                    Tampilkan
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Total Jam</p>
                    <p className="text-xl font-bold text-gray-900">{Number(total_jam).toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Total Pendapatan</p>
                    <p className="text-xl font-bold text-gray-900">Rp {Number(pendapatan).toLocaleString("id-ID")}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Total Jam</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Pendapatan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {perHari.length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
                        ) : (
                            perHari.map((h, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {new Date(h.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{h.total_jam}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                        Rp {Number(h.pendapatan).toLocaleString("id-ID")}
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