import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, FileCog, Save } from "lucide-react";

export default function Create({ sessions }) {
    const [data, setData] = useState({
        production_session_id: "",
        jenis_uji: "slump_test",
        nilai_slump: "",
        tanggal_uji_tekan_rencana: "",
        catatan: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route("production.qc.store"), data, {
            preserveScroll: true,
            onSuccess: () => setProcessing(false),
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Catat Sample QC" />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Catat Sample QC
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Buat sampel uji mutu dari sesi produksi
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card Form */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                    <FileCog className="h-5 w-5 text-blue-600" />
                                </span>
                                Armada & Driver
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Informasi kendaraan, pengemudi, dan penugasan
                                proyek.
                            </p>
                        </div>
                        {/* Informasi Utama */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Sesi Produksi{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.production_session_id}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            production_session_id:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900"
                                >
                                    <option value="">Pilih Sesi</option>
                                    {sessions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.kode_sesi} - {s.produk?.nama} (
                                            {s.status})
                                        </option>
                                    ))}
                                </select>
                                {errors.production_session_id && (
                                    <p className="text-red-600 text-xs mt-1">
                                        {errors.production_session_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Jenis Uji{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.jenis_uji}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            jenis_uji: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900"
                                >
                                    <option value="slump_test">
                                        Slump Test
                                    </option>
                                    <option value="uji_tekan">Uji Tekan</option>
                                </select>
                                {errors.jenis_uji && (
                                    <p className="text-red-600 text-xs mt-1">
                                        {errors.jenis_uji}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Parameter Uji */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nilai Slump (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.nilai_slump}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            nilai_slump: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: 12.5"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900"
                                />
                                {errors.nilai_slump && (
                                    <p className="text-red-600 text-xs mt-1">
                                        {errors.nilai_slump}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tanggal Uji Tekan Rencana
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_uji_tekan_rencana}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            tanggal_uji_tekan_rencana:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900"
                                />
                                {errors.tanggal_uji_tekan_rencana && (
                                    <p className="text-red-600 text-xs mt-1">
                                        {errors.tanggal_uji_tekan_rencana}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Catatan Tambahan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Catatan
                            </label>
                            <textarea
                                value={data.catatan}
                                onChange={(e) =>
                                    setData({
                                        ...data,
                                        catatan: e.target.value,
                                    })
                                }
                                rows="3"
                                placeholder="Tambahkan keterangan atau catatan khusus jika ada..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900"
                            />
                            {errors.catatan && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.catatan}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href={route("production.qc.index")}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
