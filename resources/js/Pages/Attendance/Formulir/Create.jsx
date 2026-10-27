import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, ClipboardList, Save } from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Create({ presensis }) {
    const [data, setData] = useState({
        presensi_id: "",
        kondisi_area: "",
        aktivitas_dilakukan: "",
        kendala: "",
        foto: "",
        catatan_tambahan: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route("attendance.formulir.store"), data, {
            onSuccess: () => setProcessing(false),
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Formulir Lapangan" />

            <div className="mx-auto max-w-5xl">
                {/* Header Halaman */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Buat Formulir Lapangan
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Laporan aktivitas harian dan kondisi di titik kerja.
                        </p>
                    </div>
                </div>

                {/* Form Container Card */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 border-b border-slate-100 pb-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                    <ClipboardList className="h-5 w-5 text-blue-600" />
                                </span>
                                Laporan Aktivitas &amp; Kondisi Lapangan
                            </h2>
                            <p className="mt-1.5 text-sm text-slate-500">
                                Isi presensi terkait, aktivitas pekerjaan, serta
                                dokumentasi kendala lokasi.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {/* Pilih Presensi */}
                            <div>
                                <label
                                    htmlFor="presensi_id"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Presensi{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="presensi_id"
                                    value={data.presensi_id}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            presensi_id: e.target.value,
                                        })
                                    }
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.presensi_id
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                >
                                    <option value="">
                                        -- Pilih Presensi --
                                    </option>
                                    {presensis.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.karyawan?.nama} —{" "}
                                            {formatTanggal(p.check_in)}
                                        </option>
                                    ))}
                                </select>
                                {errors.presensi_id && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.presensi_id}
                                    </p>
                                )}
                            </div>

                            {/* Aktivitas Dilakukan */}
                            <div>
                                <label
                                    htmlFor="aktivitas_dilakukan"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Aktivitas Dilakukan{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="aktivitas_dilakukan"
                                    rows="3"
                                    value={data.aktivitas_dilakukan}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            aktivitas_dilakukan: e.target.value,
                                        })
                                    }
                                    placeholder="Deskripsikan secara detail pekerjaan yang telah dilakukan..."
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.aktivitas_dilakukan
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                {errors.aktivitas_dilakukan && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.aktivitas_dilakukan}
                                    </p>
                                )}
                            </div>

                            {/* Grid Kondisi Area & Kendala */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                {/* Kondisi Area */}
                                <div>
                                    <label
                                        htmlFor="kondisi_area"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Kondisi Area
                                    </label>
                                    <textarea
                                        id="kondisi_area"
                                        rows="3"
                                        value={data.kondisi_area}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                kondisi_area: e.target.value,
                                            })
                                        }
                                        placeholder="Cuaca, kebersihan, keselamatan lokasi..."
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                    {errors.kondisi_area && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.kondisi_area}
                                        </p>
                                    )}
                                </div>

                                {/* Kendala */}
                                <div>
                                    <label
                                        htmlFor="kendala"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Kendala / Hambatan
                                    </label>
                                    <textarea
                                        id="kendala"
                                        rows="3"
                                        value={data.kendala}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                kendala: e.target.value,
                                            })
                                        }
                                        placeholder="Tuliskan jika terdapat kendala operasional..."
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                    {errors.kendala && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.kendala}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* URL Foto Dokumentasi */}
                            <div>
                                <label
                                    htmlFor="foto"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    URL Foto Dokumentasi{" "}
                                    <span className="text-xs font-normal text-gray-400">
                                        (opsional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="foto"
                                    value={data.foto}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            foto: e.target.value,
                                        })
                                    }
                                    placeholder="https://..."
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.foto && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.foto}
                                    </p>
                                )}
                            </div>

                            {/* Catatan Tambahan */}
                            <div>
                                <label
                                    htmlFor="catatan_tambahan"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Catatan Tambahan
                                </label>
                                <textarea
                                    id="catatan_tambahan"
                                    rows="2"
                                    value={data.catatan_tambahan}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            catatan_tambahan: e.target.value,
                                        })
                                    }
                                    placeholder="Catatan pendukung lainnya..."
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.catatan_tambahan && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.catatan_tambahan}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
