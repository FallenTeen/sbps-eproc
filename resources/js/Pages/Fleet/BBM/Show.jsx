import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft } from "lucide-react";

export default function Show({ bbmLog }) {
    const serviceable = bbmLog.serviceable;
    const serviceableName = serviceable?.kode_unit || serviceable?.nama || "-";

    return (
        <AuthenticatedLayout>
            <Head title="Detail BBM" />

            <div className="mb-6">
                <Link
                    href={route("fleet.bbm.index")}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Detail Pencatatan BBM</h1>
                <p className="mt-1 text-sm text-gray-500">{serviceableName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Tanggal</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {new Date(bbmLog.tanggal).toLocaleDateString("id-ID")}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Liter</p>
                    <p className="text-lg font-semibold text-gray-900">{Number(bbmLog.liter).toLocaleString("id-ID")} L</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Biaya</p>
                    <p className="text-lg font-semibold text-gray-900">Rp {Number(bbmLog.biaya).toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Jam Operasional</p>
                    <p className="text-lg font-semibold text-gray-900">{bbmLog.jam_operasional_saat_isi ?? "-"}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Tambahan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Purchase Order</p>
                        <p className="text-sm font-medium text-gray-900">{bbmLog.purchase_order?.kode_po || "-"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Dicatat Oleh</p>
                        <p className="text-sm font-medium text-gray-900">{bbmLog.dicatat_oleh?.name || "-"}</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}