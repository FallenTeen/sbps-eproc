import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Show({ checklist }) {
    const checkable = checklist.checkable;
    const checkableName = checkable?.kode_unit || checkable?.plat_nomor || checkable?.nama || "Unit";

    return (
        <AuthenticatedLayout>
            <Head title="Detail Checklist" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Detail Checklist Harian</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {checkableName} · {new Date(checklist.tanggal).toLocaleDateString("id-ID")}
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${checklist.kondisi_baik ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                        {checklist.kondisi_baik ? "Kondisi Baik" : "Ada Masalah"}
                    </span>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500">Item Bermasalah</p>
                        <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                            {checklist.item_bermasalah || "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Dicatat Oleh</p>
                        <p className="text-sm font-medium text-gray-900">
                            {checklist.dicatat_oleh?.nama || checklist.dicatat_oleh?.name || "-"}
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}