import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function ByDate({ tanggal, checklists }) {
    return (
        <AuthenticatedLayout>
            <Head title="Checklist Harian" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Checklist Harian</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {new Date(tanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tipe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Kondisi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Item Bermasalah</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {checklists.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    Tidak ada checklist pada tanggal ini
                                </td>
                            </tr>
                        ) : (
                            checklists.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {c.checkable?.kode_unit || c.checkable?.nama || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {c.checkable_type?.split("\\").pop()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.kondisi_baik ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                                            {c.kondisi_baik ? "Baik" : "Masalah"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                        {c.item_bermasalah || "-"}
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