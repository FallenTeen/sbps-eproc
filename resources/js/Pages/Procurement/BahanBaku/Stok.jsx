import React from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft } from "lucide-react";

export default function Stok({ bahanBaku, perTitik, mutasis }) {
    return (
        <AuthenticatedLayout>
            <Head title={`Stok ${bahanBaku.nama}`} />

            <div className="mb-6">
                <a
                    href={route("procurement.bahan-baku.show", bahanBaku.id)}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </a>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Stok {bahanBaku.nama}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {bahanBaku.kode} · {bahanBaku.satuan}
                    </p>
                </div>
            </div>

            {/* Ringkasan stok per titik */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {perTitik.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:col-span-2">
                        <p className="text-sm text-gray-500">Belum ada mutasi stok.</p>
                    </div>
                ) : (
                    perTitik.map((s) => (
                        <div key={s.titik_id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-sm text-gray-500">{s.titik}</p>
                            <p className={`text-xl font-bold ${s.stok < 0 ? "text-red-600" : "text-gray-900"}`}>
                                {Number(s.stok).toLocaleString("id-ID")} {bahanBaku.satuan}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Riwayat mutasi */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Riwayat Mutasi</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tipe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Titik</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Jumlah</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Referensi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Catatan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {mutasis.data.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    Tidak ada data
                                </td>
                            </tr>
                        ) : (
                            mutasis.data.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(m.tanggal).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${m.tipe === "masuk" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                                            {m.tipe === "masuk" ? "Masuk" : "Keluar"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {m.titik?.nama || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        {m.tipe === "masuk" ? "+" : "-"}
                                        {Number(m.jumlah).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {m.referensi_type ? m.referensi_type.split("\\").pop() + " #" + m.referensi_id : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                        {m.catatan || "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {mutasis.from || 0} - {mutasis.to || 0} dari{" "}
                    {mutasis.total || 0} data
                </div>
                <div className="flex gap-2">
                    {mutasis.links &&
                        mutasis.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 border rounded ${link.active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100"}`}
                                disabled={!link.url}
                            />
                        ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}