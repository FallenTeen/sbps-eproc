import React, { useMemo } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import PetaTitikProyek from "@/Components/PetaTitikProyek";
import { ArrowLeft, Edit, Trash2, MapPin } from "lucide-react";

export default function Show({ titik }) {
    const { auth } = usePage().props;
    const roles = auth?.roles || [];

    const can = useMemo(
        () => ({
            update: () => {
                if (roles.includes("Owner")) return true;
                return [
                    "Koordinator Procurement",
                    "Koordinator GCS",
                    "Koordinator CBP",
                    "Koordinator AMP",
                    "Koordinator SDM",
                ].some((r) => roles.includes(r));
            },
            delete: () => roles.includes("Owner"),
        }),
        [roles],
    );

    const proyek = titik.proyek;
    const hasCoords = titik.latitude != null && titik.longitude != null;

    const handleDelete = () => {
        if (window.confirm("Yakin hapus titik ini?")) {
            router.delete(route("core.titik.destroy", titik.id));
        }
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold capitalize">{titik.nama}</h1>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        titik.status === "nonaktif"
                            ? "bg-red-200 text-red-800"
                            : "bg-green-200 text-green-800"
                    }`}
                >
                    {titik.status === "nonaktif" ? "Nonaktif" : "Aktif"}
                </span>
                <div className="ml-auto flex gap-2">
                    <Link
                        href={route("core.titik.index", titik.proyek_id)}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm flex items-center gap-1"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali
                    </Link>
                    {can.update() && (
                        <Link
                            href={route("core.titik.edit", titik.id)}
                            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm flex items-center gap-1"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Link>
                    )}
                    {can.delete() && (
                        <button
                            onClick={handleDelete}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start capitalize">
                {/* Informasi Titik */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">
                            Informasi Titik
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Detail lokasi dan keterkaitan titik proyek.
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Detail Informasi */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                                Detail Lokasi
                            </h3>

                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                                    <span className="text-gray-500">
                                        Nama Titik
                                    </span>
                                    <span className="sm:col-span-2 font-medium text-gray-900">
                                        {titik.nama || "-"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                                    <span className="text-gray-500">
                                        Proyek
                                    </span>
                                    <span className="sm:col-span-2 font-medium text-gray-900">
                                        {proyek
                                            ? `${proyek.kode_proyek} - ${proyek.nama}`
                                            : "-"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                                    <span className="text-gray-500">
                                        Status
                                    </span>
                                    <div className="sm:col-span-2">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                titik.status === "aktif"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {titik.status || "-"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                                    <span className="text-gray-500">
                                        Koordinat
                                    </span>
                                    <div className="sm:col-span-2">
                                        {hasCoords ? (
                                            <span className="font-mono text-gray-900 break-all">
                                                {Number(titik.latitude).toFixed(
                                                    6,
                                                )}
                                                ,{" "}
                                                {Number(
                                                    titik.longitude,
                                                ).toFixed(6)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">
                                                Belum ada koordinat
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                                    <span className="text-gray-500">
                                        Radius Presensi
                                    </span>
                                    <span className="sm:col-span-2 font-medium text-gray-900">
                                        {titik.radius_presensi_meter ?? 0} meter
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Relasi */}
                        <section className="border-t border-gray-200 pt-5">
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Relasi Titik
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Jumlah data yang terhubung dengan titik ini.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
                                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                                        <span className="text-xs font-medium">
                                            RAB
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {titik.rab?.length ?? 0}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Data RAB
                                    </p>
                                </div>

                                <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-4">
                                    <div className="flex items-center gap-2 text-indigo-700 mb-2">
                                        <span className="text-xs font-medium">
                                            Armada
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {titik.armadas?.length ?? 0}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Unit terhubung
                                    </p>
                                </div>

                                <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-4">
                                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                                        <span className="text-xs font-medium">
                                            Mesin Produksi
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {titik.mesin_produksis?.length ?? 0}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Mesin terhubung
                                    </p>
                                </div>

                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                                        <span className="text-xs font-medium">
                                            Karyawan
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {titik.karyawan_assignments?.length ??
                                            0}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Penugasan terkait
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Peta Lokasi */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <MapPin className="w-5 h-5" />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    Peta Lokasi
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Posisi geografis titik proyek.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {hasCoords ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                    <PetaTitikProyek
                                        titiks={[titik]}
                                        selectedTitikId={titik.id}
                                        height="360px"
                                        showDetailButton={false}
                                    />
                                </div>

                                <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 p-4">
                                    <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">
                                            Koordinat Lokasi
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                                            {Number(titik.latitude).toFixed(6)},{" "}
                                            {Number(titik.longitude).toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-12">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                                    <MapPin className="w-7 h-7 text-gray-400" />
                                </div>

                                <h3 className="text-sm font-semibold text-gray-800">
                                    Koordinat Belum Tersedia
                                </h3>

                                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                                    Titik ini belum memiliki koordinat lokasi.
                                    Gunakan fitur Edit untuk menetapkan lokasi
                                    melalui tautan Google Maps.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
