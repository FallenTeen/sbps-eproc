import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Camera, ClipboardList } from "lucide-react";

export default function Show({ formulir }) {
    return (
        <AuthenticatedLayout>
            <Head title="Detail Formulir" />

            <div className="mb-6">
                <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Detail Formulir Lapangan</h1>
                <p className="mt-1 text-sm text-gray-500">{formulir.presensi?.karyawan?.nama}</p>
            </div>

            <div className="max-w-3xl bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                    <ClipboardList className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Presensi Terkait</p>
                        <p className="text-sm text-gray-600">
                            {formulir.presensi?.karyawan?.nama} — {new Date(formulir.presensi?.check_in).toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-gray-500">Titik: {formulir.presensi?.titik?.nama || "-"}</p>
                    </div>
                </div>

                <dl className="divide-y divide-gray-100 mt-4">
                    <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Kondisi Area</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{formulir.kondisi_area || "-"}</dd>
                    </div>
                    <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Aktivitas Dilakukan</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{formulir.aktivitas_dilakukan}</dd>
                    </div>
                    <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Kendala</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{formulir.kendala || "-"}</dd>
                    </div>
                    <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Catatan Tambahan</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{formulir.catatan_tambahan || "-"}</dd>
                    </div>
                </dl>

                {formulir.foto && (
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <Camera className="w-4 h-4 text-gray-400" />
                            Foto
                        </p>
                        <img src={formulir.foto} alt="Formulir" className="rounded-lg border border-gray-200 max-h-80" />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}