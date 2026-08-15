import React from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Active({ downtimes }) {
    return (
        <AuthenticatedLayout>
            <Head title="Downtime Aktif" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Downtime Aktif</h1>
                <p className="mt-1 text-sm text-gray-500">Armada / mesin yang sedang dalam perbaikan</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tipe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Mulai</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Kategori</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Penyebab</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {downtimes.data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    Tidak ada downtime aktif
                                </td>
                            </tr>
                        ) : (
                            downtimes.data.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {d.serviceable?.kode_unit || d.serviceable?.nama || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {d.serviceable_type?.split("\\").pop()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(d.mulai).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{d.kategori || "-"}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{d.penyebab || "-"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {downtimes.from || 0} - {downtimes.to || 0} dari {downtimes.total || 0} data
                </div>
                <div className="flex gap-2">
                    {downtimes.links &&
                        downtimes.links.map((link, index) => (
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