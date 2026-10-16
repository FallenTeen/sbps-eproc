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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Detail Pencatatan BBM</h1>
                <Link
                    href={route("fleet.bbm.index")}
                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                </Link>
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
                    <p className="text-lg font-semibold text-gray-900">
                        {Number(bbmLog.liter).toLocaleString("id-ID")} L
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Biaya</p>
                    <p className="text-lg font-semibold text-gray-900">
                        Rp {Number(bbmLog.biaya).toLocaleString("id-ID")}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Jam Operasional</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {bbmLog.jam_operasional_saat_isi ?? "-"}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Informasi Tambahan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Purchase Order</p>
                        <p className="text-sm font-medium text-gray-900">
                            {bbmLog.purchase_order?.kode_po || "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Dicatat Oleh</p>
                        <p className="text-sm font-medium text-gray-900">
                            {bbmLog.dicatat_oleh?.name || "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Sumber</p>
                        <p className="text-sm font-medium text-gray-900">
                            {bbmLog.pengisian_solar
                                ? "Pengisian Solar Driver"
                                : "Input Manual"}
                        </p>
                    </div>
                    {bbmLog.pengisian_solar?.foto_nota_url && (
                        <div>
                            <p className="text-sm text-gray-500">Foto Nota</p>
                            <a
                                href={bbmLog.pengisian_solar.foto_nota_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-blue-600 hover:underline"
                            >
                                Lihat Nota
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
