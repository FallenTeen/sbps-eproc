import React, { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Save, Plus, Trash2, Sparkles, Layers } from "lucide-react";

export default function Edit({ mixDesign, bahanBakus }) {
    const { data, setData, put, processing, errors } = useForm({
        mutu_beton: mixDesign.mutu_beton || "",
        nama: mixDesign.nama || "",
        deskripsi: mixDesign.deskripsi || "",
        items: (mixDesign.items || []).map((item) => ({
            id: item.id,
            bahan_baku_id: item.bahan_baku_id,
            jumlah_per_m3: item.jumlah_per_m3,
        })),
    });

    const addItem = () => {
        setData("items", [
            ...data.items,
            { id: null, bahan_baku_id: "", jumlah_per_m3: "" },
        ]);
    };

    const updateItem = (index, field, value) => {
        const items = [...data.items];
        items[index] = { ...items[index], [field]: value };
        setData("items", items);
    };

    const removeItem = (index) => {
        setData(
            "items",
            data.items.filter((_, i) => i !== index),
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("production.mix-design.update", mixDesign.id));
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Edit Template Mix Design
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Perbarui informasi template dan komposisi bahan baku
                            untuk mutu beton{" "}
                            <span className="font-semibold text-blue-600">
                                {mixDesign.mutu_beton}
                            </span>
                            .
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informasi Template */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Sparkles className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Informasi Template
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Lengkapi informasi dasar template mix
                                    design.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                            <FormField
                                label="Mutu Beton"
                                required
                                error={errors.mutu_beton}
                            >
                                <input
                                    type="text"
                                    value={data.mutu_beton}
                                    onChange={(e) =>
                                        setData(
                                            "mutu_beton",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="Contoh: K-250"
                                    className={inputCls(errors.mutu_beton)}
                                />
                            </FormField>

                            <FormField
                                label="Nama Template"
                                error={errors.nama}
                            >
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) =>
                                        setData("nama", e.target.value)
                                    }
                                    placeholder="Masukkan nama template"
                                    className={inputCls(errors.nama)}
                                />
                            </FormField>

                            <FormField
                                label="Deskripsi"
                                error={errors.deskripsi}
                                className="md:col-span-2"
                            >
                                <textarea
                                    rows={3}
                                    value={data.deskripsi ?? ""}
                                    onChange={(e) =>
                                        setData("deskripsi", e.target.value)
                                    }
                                    placeholder="Tambahkan deskripsi template (opsional)"
                                    className={
                                        inputCls(errors.deskripsi) + " resize-y"
                                    }
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Komposisi Bahan Baku */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <Layers className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Komposisi Bahan Baku
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Atur bahan dan kebutuhan untuk setiap m³
                                        beton.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Bahan
                            </button>
                        </div>

                        <div className="p-6">
                            {data.items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                                        <Layers className="h-6 w-6" />
                                    </div>

                                    <p className="mt-4 text-sm font-semibold text-gray-700">
                                        Belum ada bahan baku
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Klik tombol Tambah Bahan untuk
                                        menambahkan komposisi.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambah Bahan
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data.items.map((item, i) => (
                                        <div
                                            key={i}
                                            className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 transition hover:border-gray-300 sm:p-5"
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                                                        {i + 1}
                                                    </span>

                                                    <span className="text-sm font-semibold text-gray-800">
                                                        Bahan ke-{i + 1}
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeItem(i)
                                                    }
                                                    title="Hapus bahan"
                                                    aria-label={`Hapus bahan ke-${i + 1}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="hidden text-xs font-medium sm:inline">
                                                        Hapus
                                                    </span>
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                                                <div>
                                                    <label
                                                        htmlFor={`bahan-${i}`}
                                                        className="mb-2 block text-sm font-medium text-gray-700"
                                                    >
                                                        Bahan Baku{" "}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </label>

                                                    <select
                                                        id={`bahan-${i}`}
                                                        value={
                                                            item.bahan_baku_id
                                                        }
                                                        onChange={(e) =>
                                                            updateItem(
                                                                i,
                                                                "bahan_baku_id",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={inputCls(
                                                            errors[
                                                                `items.${i}.bahan_baku_id`
                                                            ],
                                                        )}
                                                    >
                                                        <option value="">
                                                            -- Pilih Bahan Baku
                                                            --
                                                        </option>

                                                        {bahanBakus.map((b) => (
                                                            <option
                                                                key={b.id}
                                                                value={b.id}
                                                            >
                                                                {b.nama} (
                                                                {b.satuan})
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {errors[
                                                        `items.${i}.bahan_baku_id`
                                                    ] && (
                                                        <p className="mt-1.5 text-xs text-red-600">
                                                            {
                                                                errors[
                                                                    `items.${i}.bahan_baku_id`
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor={`jumlah-${i}`}
                                                        className="mb-2 block text-sm font-medium text-gray-700"
                                                    >
                                                        Jumlah per m³{" "}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </label>

                                                    <input
                                                        id={`jumlah-${i}`}
                                                        type="number"
                                                        step="0.001"
                                                        min="0"
                                                        value={
                                                            item.jumlah_per_m3
                                                        }
                                                        onChange={(e) =>
                                                            updateItem(
                                                                i,
                                                                "jumlah_per_m3",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.000"
                                                        className={inputCls(
                                                            errors[
                                                                `items.${i}.jumlah_per_m3`
                                                            ],
                                                        )}
                                                    />

                                                    {errors[
                                                        `items.${i}.jumlah_per_m3`
                                                    ] && (
                                                        <p className="mt-1.5 text-xs text-red-600">
                                                            {
                                                                errors[
                                                                    `items.${i}.jumlah_per_m3`
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                                <p className="text-sm text-gray-500">
                                    Total bahan:{" "}
                                    <span className="font-semibold text-gray-800">
                                        {data.items.length}
                                    </span>
                                </p>

                                <p className="text-xs text-gray-400">
                                    Jumlah disesuaikan untuk setiap m³ beton.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                        <Link
                            href={route(
                                "production.mix-design.show",
                                mixDesign.id,
                            )}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
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
    return `w-full rounded-lg border px-3.5 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 ${err ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300 focus:border-blue-400"}`;
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
