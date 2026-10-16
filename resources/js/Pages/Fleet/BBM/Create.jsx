import React, { useState, useEffect } from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Fuel, Truck, ClipboardList, Save } from "lucide-react";

export default function Create({
    serviceableTypes,
    serviceables,
    serviceableType,
    serviceableId,
}) {
    const { data, setData, post, errors, processing } = useForm({
        serviceable_type: serviceableType || "",
        serviceable_id: serviceableId || "",
        tanggal: new Date().toISOString().split("T")[0],
        liter: "",
        biaya: "",
        jam_operasional_saat_isi: "",
        purchase_order_id: "",
    });

    const availableServiceables = data.serviceable_type
        ? serviceables?.[data.serviceable_type] || []
        : [];
    const isArmada = (serviceableTypes || [])
        .find((type) => type.value === data.serviceable_type)
        ?.label?.toLowerCase()
        .includes("armada");

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("fleet.bbm.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Catat BBM" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Catat BBM
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Catat pengisian bahan bakar dan biaya operasional
                            unit.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informasi Unit */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <Truck className="h-5 w-5 text-blue-600" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Informasi Unit
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Pilih jenis dan unit yang melakukan
                                    pengisian BBM.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Tipe Unit */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tipe Unit{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <select
                                    value={data.serviceable_type}
                                    onChange={(e) =>
                                        setData(
                                            "serviceable_type",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Pilih Tipe</option>
                                    {(serviceableTypes || []).map((type) => (
                                        <option
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </option>
                                    ))}
                                </select>

                                {errors.serviceable_type && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.serviceable_type}
                                    </p>
                                )}
                            </div>

                            {/* Unit */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Unit <span className="text-red-500">*</span>
                                </label>

                                <select
                                    value={data.serviceable_id}
                                    onChange={(e) =>
                                        setData(
                                            "serviceable_id",
                                            e.target.value,
                                        )
                                    }
                                    disabled={!data.serviceable_type}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                    <option value="">Pilih Unit</option>
                                    {availableServiceables.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {isArmada
                                                ? `${item.kode_unit} / ${item.plat_nomor ?? "-"}`
                                                : item.nama}
                                        </option>
                                    ))}
                                </select>

                                {errors.serviceable_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.serviceable_id}
                                    </p>
                                )}
                            </div>

                            {/* Tanggal */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tanggal
                                </label>

                                <input
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) =>
                                        setData("tanggal", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />

                                {errors.tanggal && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.tanggal}
                                    </p>
                                )}
                            </div>

                            {/* Referensi PO */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Referensi PO
                                    <span className="ml-1 font-normal text-slate-400">
                                        (Opsional)
                                    </span>
                                </label>

                                <select
                                    value={data.purchase_order_id}
                                    onChange={(e) =>
                                        setData(
                                            "purchase_order_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Tidak ada PO</option>
                                    {/* Daftar PO diisi dari backend */}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Detail Pengisian BBM */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                                <Fuel className="h-5 w-5 text-emerald-600" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Detail Pengisian BBM
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Masukkan jumlah bahan bakar, biaya, dan jam
                                    operasional.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Liter */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Liter{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.liter}
                                    onChange={(e) =>
                                        setData("liter", e.target.value)
                                    }
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />

                                {errors.liter && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.liter}
                                    </p>
                                )}
                            </div>

                            {/* Biaya */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Biaya
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.biaya}
                                    onChange={(e) =>
                                        setData("biaya", e.target.value)
                                    }
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />

                                {errors.biaya && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.biaya}
                                    </p>
                                )}
                            </div>

                            {/* Jam Operasional */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Jam Operasional Saat Isi
                                </label>

                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={data.jam_operasional_saat_isi}
                                    onChange={(e) =>
                                        setData(
                                            "jam_operasional_saat_isi",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="0.0"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />

                                {errors.jam_operasional_saat_isi && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.jam_operasional_saat_isi}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="rounded-lg border-2 border-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? "Menyimpan..." : "Simpan BBM"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
