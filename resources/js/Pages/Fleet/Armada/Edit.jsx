import React from "react";
import { useForm, Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft,
    Clipboard,
    ClipboardCheck,
    Save,
    Settings,
    Truck,
} from "lucide-react";

export default function Edit({ armada, titiks }) {
    const { data, setData, put, errors, processing } = useForm({
        plat_nomor: armada.plat_nomor || "",
        kode_unit: armada.kode_unit || "",
        jenis: armada.jenis || "dump_truck",
        tipe_unit: armada.tipe_unit || "armada_jalan",
        model_tarif: armada.model_tarif || "ritase",
        tahun: armada.tahun || "",
        kapasitas: armada.kapasitas || "",
        titik_id: armada.titik_id || "",
        status: armada.status || "aktif",
        tanggal_mulai_pakai: armada.tanggal_mulai_pakai || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("fleet.armada.update", armada.id));
    };

    return (
        <Layout>
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Edit Armada: {armada.kode_unit}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Perbarui informasi dan data operasional armada.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informasi Unit */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                </span>
                                Informasi Unit
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Informasi dasar dan identitas kode unit armada.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                            {/* Kode Unit */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Kode Unit{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.kode_unit}
                                    onChange={(e) =>
                                        setData("kode_unit", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.kode_unit && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.kode_unit}
                                    </p>
                                )}
                            </div>

                            {/* Jenis */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Jenis{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.jenis}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            jenis: e.target.value,
                                            tipe_unit:
                                                e.target.value === "alat_berat"
                                                    ? "alat_berat"
                                                    : "armada_jalan",
                                        })
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="dump_truck">
                                        Dump Truck
                                    </option>
                                    <option value="dump_truck_tronton">
                                        Dump Truck Tronton
                                    </option>
                                    <option value="self_loader">
                                        Self Loader
                                    </option>
                                    <option value="alat_berat">
                                        Alat Berat
                                    </option>
                                    <option value="truck_molen">
                                        Truck Molen
                                    </option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                                {errors.jenis && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.jenis}
                                    </p>
                                )}
                            </div>
                        </div>
                        {/* Tipe Unit */}
                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Tipe Unit{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.tipe_unit}
                                onChange={(e) =>
                                    setData("tipe_unit", e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="armada_jalan">
                                    Armada Jalan
                                </option>
                                <option value="alat_berat">Alat Berat</option>
                            </select>
                            {errors.tipe_unit && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.tipe_unit}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Identitas & Spesifikasi */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                                    <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                                </span>
                                Identitas & Spesifikasi
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Informasi nomor kendaraan dan spesifikasi
                                armada.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                            {/* Plat Nomor */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Plat Nomor{" "}
                                    <span className="font-normal text-gray-400">
                                        (opsional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={data.plat_nomor}
                                    onChange={(e) =>
                                        setData("plat_nomor", e.target.value)
                                    }
                                    placeholder="Contoh: R 1234 AB"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.plat_nomor && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.plat_nomor}
                                    </p>
                                )}
                            </div>

                            {/* Tahun */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Tahun
                                </label>
                                <input
                                    type="number"
                                    value={data.tahun}
                                    onChange={(e) =>
                                        setData("tahun", e.target.value)
                                    }
                                    placeholder="Contoh: 2024"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.tahun && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.tahun}
                                    </p>
                                )}
                            </div>
                        </div>
                        {/* Kapasitas */}
                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Kapasitas
                            </label>
                            <input
                                type="text"
                                value={data.kapasitas}
                                onChange={(e) =>
                                    setData("kapasitas", e.target.value)
                                }
                                placeholder="Contoh: 20 ton"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            {errors.kapasitas && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.kapasitas}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Informasi Operasional */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                                    <Clipboard className="h-5 w-5 text-emerald-600" />
                                </span>
                                Informasi Operasional
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Pengaturan tarif, lokasi penempatan, dan
                                penggunaan armada.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                            {/* Model Tarif */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Model Tarif{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.model_tarif}
                                    onChange={(e) =>
                                        setData("model_tarif", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="ritase">Ritase</option>
                                    <option value="sewa_jam">Sewa / Jam</option>
                                    <option value="internal">Internal</option>
                                </select>
                                {errors.model_tarif && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.model_tarif}
                                    </p>
                                )}
                            </div>

                            {/* Titik Basecamp */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Titik (Basecamp)
                                </label>
                                <select
                                    value={data.titik_id}
                                    onChange={(e) =>
                                        setData("titik_id", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Pilih Titik</option>
                                    {titiks.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.nama}
                                        </option>
                                    ))}
                                </select>
                                {errors.titik_id && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.titik_id}
                                    </p>
                                )}
                            </div>

                            {/* Tanggal Mulai Pakai */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Tanggal Mulai Pakai
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_mulai_pakai}
                                    onChange={(e) =>
                                        setData(
                                            "tanggal_mulai_pakai",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.tanggal_mulai_pakai && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.tanggal_mulai_pakai}
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) =>
                                        setData("status", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="aktif">Aktif</option>
                                    <option value="servis">Servis</option>
                                    <option value="nonaktif">Nonaktif</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.status}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Footer Actions */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href={route("fleet.armada.index")}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Batal
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
