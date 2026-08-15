import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Plus, Eye } from "lucide-react";

export default function Index({ serviceable, serviceableType, histories, can }) {
    const serviceableName = serviceable?.kode_unit || serviceable?.plat_nomor || serviceable?.nama || "Unit";

    return (
        <AuthenticatedLayout>
            <Head title="Riwayat Servis" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Riwayat Servis</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {serviceableName} · {serviceableType}
                    </p>
                </div>
                <div className="flex gap-2">
                    {can?.create && (
                        <Link
                            href={route("fleet.service-history.create", { type: serviceableType, id: serviceable?.id })}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Catat Servis
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Jenis Servis</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Biaya</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">PO</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Catatan</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {histories.data.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td>
                            </tr>
                        ) : (
                            histories.data.map((h) => (
                                <tr key={h.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(h.tanggal).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{h.jenis_servis || "-"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        Rp {Number(h.biaya).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{h.purchase_order?.kode_po || "-"}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{h.notes || "-"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link
                                            href={route("fleet.service-history.show", h.id)}
                                            className="text-blue-600 hover:text-blue-900 inline-block"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
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
                    Menampilkan {histories.from || 0} - {histories.to || 0} dari {histories.total || 0} data
                </div>
                <div className="flex gap-2">
                    {histories.links &&
                        histories.links.map((link, index) => (
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