import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Camera, ClipboardList, FileText } from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Show({ formulir }) {
    return (
        <AuthenticatedLayout>
            <Head
                title={`Detail Formulir - ${formulir?.presensi?.karyawan?.nama ?? ""}`}
            />

            <div className="mx-auto  space-y-6">
                {/* Header Halaman & Navigasi */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Detail Formulir Lapangan
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Laporan aktivitas dan dokumentasi kerja karyawan.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </button>
                </div>

                {/* Card Informasional Presensi Terkait */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <ClipboardList className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                            <h2 className="text-xl font-bold text-slate-800">
                                {formulir?.presensi?.karyawan?.nama || "-"}
                            </h2>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    Titik:{" "}
                                    {formulir?.presensi?.titik?.nama || "-"}
                                </span>
                            </div>
                        </div>
                        <p className="shrink-0 text-right text-sm font-medium text-slate-600">
                            {formulir?.presensi?.check_in
                                ? formatTanggal(formulir.presensi.check_in)
                                : "-"}
                        </p>
                    </div>
                </section>

                {/* Card Detail Rincian Laporan */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4 text-base font-semibold text-slate-800">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                            <FileText className="h-4 w-4 text-blue-600" />
                        </span>
                        Rincian Laporan Lapangan
                    </h3>

                    <dl className="divide-y divide-slate-100">
                        {/* Aktivitas Dilakukan */}
                        <div className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400 sm:text-sm sm:normal-case sm:tracking-normal sm:font-semibold sm:text-slate-600">
                                Aktivitas Dilakukan
                            </dt>
                            <dd className="text-sm font-medium leading-relaxed text-slate-800 sm:col-span-2">
                                {formulir?.aktivitas_dilakukan || "-"}
                            </dd>
                        </div>

                        {/* Kondisi Area */}
                        <div className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400 sm:text-sm sm:normal-case sm:tracking-normal sm:font-semibold sm:text-slate-600">
                                Kondisi Area
                            </dt>
                            <dd className="text-sm text-slate-700 sm:col-span-2">
                                {formulir?.kondisi_area || "-"}
                            </dd>
                        </div>

                        {/* Kendala */}
                        <div className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400 sm:text-sm sm:normal-case sm:tracking-normal sm:font-semibold sm:text-slate-600">
                                Kendala / Hambatan
                            </dt>
                            <dd className="text-sm text-slate-700 sm:col-span-2">
                                {formulir?.kendala ? (
                                    <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800 border border-amber-200">
                                        {formulir.kendala}
                                    </span>
                                ) : (
                                    "-"
                                )}
                            </dd>
                        </div>

                        {/* Catatan Tambahan */}
                        <div className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:gap-4">
                            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400 sm:text-sm sm:normal-case sm:tracking-normal sm:font-semibold sm:text-slate-600">
                                Catatan Tambahan
                            </dt>
                            <dd className="text-sm text-slate-700 sm:col-span-2">
                                {formulir?.catatan_tambahan || "-"}
                            </dd>
                        </div>
                    </dl>
                </section>

                {/* Card Foto Dokumentasi */}
                {formulir?.foto && (
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 text-base font-semibold text-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                <Camera className="h-4 w-4 text-blue-600" />
                            </span>
                            Foto Dokumentasi
                        </h3>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {formulir.foto
                                .split(",")
                                .map((f) => f.trim())
                                .filter(Boolean)
                                .map((f, idx) => {
                                    const photoUrl = f.startsWith("http")
                                        ? f
                                        : `/storage/${f}`;
                                    return (
                                        <a
                                            key={idx}
                                            href={photoUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:shadow-md"
                                        >
                                            <img
                                                src={photoUrl}
                                                alt={`Dokumentasi ${idx + 1}`}
                                                className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition group-hover:opacity-100">
                                                <span className="rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
                                                    Lihat Foto
                                                </span>
                                            </div>
                                        </a>
                                    );
                                })}
                        </div>
                    </section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
