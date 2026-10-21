import React, { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft,
    BadgeDollarSign,
    DatabaseCheck,
    Save,
    Sparkles,
} from "lucide-react";

const KATEGORI_OPTIONS = [
    { value: "beton_cor", label: "Beton Cor (Batching Plant)" },
    { value: "aspal", label: "Campuran Aspal (AMP)" },
    { value: "split", label: "Agregat / Batu Split" },
    { value: "lainnya", label: "Lainnya" },
];

export default function Create({ unitBisnis, mixDesigns }) {
    const { data, setData, post, processing, errors } = useForm({
        unit_bisnis_id: "",
        nama: "",
        kategori: "",
        satuan_output: "m3",
        aktif: true,
        harga_awal: "",
        berlaku_dari: new Date().toISOString().slice(0, 10),
        mix_design_template_id: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("production.produk.store"));
    };

    const hasMixDesign = data.kategori === "beton_cor";

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Tambah Produk Baru
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Tambahkan informasi produk, harga jual, dan
                                konfigurasi produksi.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informasi Template */}
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <DatabaseCheck className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Data Produk
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Lengkapi identitas dan informasi dasar
                                        produk.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
                            <FormField
                                label="Unit Bisnis"
                                required
                                error={errors.unit_bisnis_id}
                            >
                                <select
                                    value={data.unit_bisnis_id}
                                    onChange={(e) =>
                                        setData(
                                            "unit_bisnis_id",
                                            e.target.value,
                                        )
                                    }
                                    className={inputCls(errors.unit_bisnis_id)}
                                >
                                    <option value="">
                                        -- Pilih Unit Bisnis --
                                    </option>
                                    {unitBisnis.map((ub) => (
                                        <option key={ub.id} value={ub.id}>
                                            {ub.nama}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField
                                label="Nama Produk"
                                required
                                error={errors.nama}
                            >
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) =>
                                        setData("nama", e.target.value)
                                    }
                                    placeholder="Contoh: Beton FC25, HRS-WC, Batu Split 2/3"
                                    className={inputCls(errors.nama)}
                                />
                            </FormField>

                            <FormField
                                label="Kategori"
                                required
                                error={errors.kategori}
                            >
                                <select
                                    value={data.kategori}
                                    onChange={(e) =>
                                        setData("kategori", e.target.value)
                                    }
                                    className={inputCls(errors.kategori)}
                                >
                                    <option value="">
                                        -- Pilih Kategori --
                                    </option>
                                    {KATEGORI_OPTIONS.map((k) => (
                                        <option key={k.value} value={k.value}>
                                            {k.label}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField
                                label="Satuan Output"
                                required
                                error={errors.satuan_output}
                            >
                                <select
                                    value={data.satuan_output}
                                    onChange={(e) =>
                                        setData("satuan_output", e.target.value)
                                    }
                                    className={inputCls(errors.satuan_output)}
                                >
                                    <option value="m3">m³ (Meter Kubik)</option>
                                    <option value="ton">Ton</option>
                                </select>
                            </FormField>

                            <FormField
                                label="Status"
                                error={errors.aktif}
                                className="sm:col-span-2"
                            >
                                <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={data.aktif}
                                        onChange={(e) =>
                                            setData("aktif", e.target.checked)
                                        }
                                        className="h-4 w-4 rounded accent-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Produk aktif dan tersedia untuk produksi
                                    </span>
                                </label>
                            </FormField>
                        </div>
                    </section>

                    {/* Harga Awal */}
                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <BadgeDollarSign className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Harga Jual Awal{" "}
                                        <span className="text-sm font-normal text-gray-400">
                                            (opsional)
                                        </span>
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Atur harga jual awal dan tanggal mulai
                                        berlakunya.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
                            <FormField
                                label="Harga Jual (Rp/satuan)"
                                error={errors.harga_awal}
                            >
                                <input
                                    type="number"
                                    min="0"
                                    value={data.harga_awal}
                                    onChange={(e) =>
                                        setData("harga_awal", e.target.value)
                                    }
                                    placeholder="Contoh: 850000"
                                    className={inputCls(errors.harga_awal)}
                                />
                            </FormField>

                            <FormField
                                label="Berlaku Dari"
                                error={errors.berlaku_dari}
                            >
                                <input
                                    type="date"
                                    value={data.berlaku_dari}
                                    onChange={(e) =>
                                        setData("berlaku_dari", e.target.value)
                                    }
                                    className={inputCls(errors.berlaku_dari)}
                                />
                            </FormField>
                        </div>
                    </section>

                    {/* Mix Design - Khusus Beton */}
                    {hasMixDesign && (
                        <section className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
                            <div className="border-b border-blue-100 px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                                        <Sparkles className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-semibold text-blue-900">
                                            Generate Resep dari Mix Design
                                            Template
                                        </h2>
                                        <p className="mt-1 text-xs text-blue-700">
                                            Pilih template mutu beton untuk
                                            mengisi komposisi resep/BOM secara
                                            otomatis.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6">
                                <FormField
                                    label="Template Mix Design"
                                    error={errors.mix_design_template_id}
                                >
                                    <select
                                        value={data.mix_design_template_id}
                                        onChange={(e) =>
                                            setData(
                                                "mix_design_template_id",
                                                e.target.value,
                                            )
                                        }
                                        className={inputCls(
                                            errors.mix_design_template_id,
                                        )}
                                    >
                                        <option value="">
                                            -- Pilih Mutu Beton (opsional) --
                                        </option>

                                        {mixDesigns.map((md) => (
                                            <option key={md.id} value={md.id}>
                                                {md.mutu_beton}
                                                {md.nama ? ` — ${md.nama}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </FormField>
                            </div>
                        </section>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                        <Link
                            href={route("production.produk.index")}
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
        </Layout>
    );
}

function inputCls(err) {
    return `w-full rounded-lg border px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 ${err ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300 focus:border-blue-400"}`;
}

function FormField({ label, required, error, children, className = "" }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
