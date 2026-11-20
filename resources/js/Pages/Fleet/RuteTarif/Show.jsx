import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft } from "lucide-react";

export default function Show({ ruteTarif }) {
    const isAktif = () => {
        const dari = new Date(ruteTarif.berlaku_dari);
        const sampai = ruteTarif.berlaku_sampai
            ? new Date(ruteTarif.berlaku_sampai)
            : null;
        const today = new Date();
        if (today < dari) return false;
        if (sampai && today > sampai) return false;
        return true;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Detail Rute Tarif" />

            <div className="mb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {ruteTarif.lokasi_asal} → {ruteTarif.lokasi_tujuan}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {ruteTarif.unit_bisnis?.nama}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Link
                            href={route("fleet.rute-tarif.index")}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali
                        </Link>
                        <Link
                            href={route("fleet.rute-tarif.edit", ruteTarif.id)}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            Edit
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Jarak</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {Number(ruteTarif.jarak_km).toLocaleString("id-ID")} km
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Tarif / Rit</p>
                    <p className="text-lg font-semibold text-gray-900">
                        Rp{" "}
                        {Number(ruteTarif.tarif_per_rit).toLocaleString(
                            "id-ID",
                        )}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Indeks Solar / km</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {ruteTarif.indeks_liter_solar_per_km ?? "-"}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${isAktif() ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"}`}
                    >
                        {isAktif() ? "Berlaku" : "Kadaluarsa"}
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Periode Berlaku
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Berlaku Dari</p>
                        <p className="text-sm font-medium text-gray-900">
                            {new Date(
                                ruteTarif.berlaku_dari,
                            ).toLocaleDateString("id-ID")}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Berlaku Sampai</p>
                        <p className="text-sm font-medium text-gray-900">
                            {ruteTarif.berlaku_sampai
                                ? new Date(
                                      ruteTarif.berlaku_sampai,
                                  ).toLocaleDateString("id-ID")
                                : "Selamanya"}
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
