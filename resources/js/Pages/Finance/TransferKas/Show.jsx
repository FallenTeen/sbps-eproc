import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft } from "lucide-react";

export default function Show({ transfer }) {
    return (
        <AuthenticatedLayout>
            <Head title="Detail Transfer Kas" />

            <div className="mb-6">
                <Link
                    href={route("finance.transfer-kas.index")}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Detail Transfer Antar Kas</h1>
                <p className="mt-1 text-sm text-gray-500">{new Date(transfer.tanggal).toLocaleDateString("id-ID")}</p>
            </div>

            <div className="max-w-2xl bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {transfer.dariAkun?.nama} → {transfer.keAkun?.nama}
                    </h2>
                    <span className="text-2xl font-bold text-gray-900">
                        Rp {Number(transfer.jumlah).toLocaleString("id-ID")}
                    </span>
                </div>

                <dl className="divide-y divide-gray-100">
                    <div className="py-3 px-6 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Dari Akun</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{transfer.dariAkun?.nama || "-"}</dd>
                    </div>
                    <div className="py-3 px-6 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Ke Akun</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{transfer.keAkun?.nama || "-"}</dd>
                    </div>
                    <div className="py-3 px-6 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Jumlah</dt>
                        <dd className="text-sm text-gray-900 col-span-2">Rp {Number(transfer.jumlah).toLocaleString("id-ID")}</dd>
                    </div>
                    <div className="py-3 px-6 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Tanggal</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{new Date(transfer.tanggal).toLocaleDateString("id-ID")}</dd>
                    </div>
                    <div className="py-3 px-6 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Catatan</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{transfer.catatan || "-"}</dd>
                    </div>
                </dl>
            </div>
        </AuthenticatedLayout>
    );
}