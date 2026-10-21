import React, { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Save, Plus, Trash2, Sparkles, Layers } from "lucide-react";

export default function Create({ bahanBakus }) {
    const { data, setData, post, processing, errors } = useForm({
        mutu_beton: "",
        nama: "",
        deskripsi: "",
        items: [],
    });

    const addItem = () => {
        setData("items", [
            ...data.items,
            { bahan_baku_id: "", jumlah_per_m3: "" },
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
        post(route("production.mix-design.store"));
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Buat Template Mix Design
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Tentukan mutu beton dan komposisi bahan baku
                                standar untuk setiap 1 m³ campuran beton CBP.
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
                                    <Sparkles className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Informasi Template
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Identitas dan keterangan mix design.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                                <FormField
                                    label="Mutu Beton"
                                    required
                                    error={errors.mutu_beton}
                                    hint="Contoh: FC10, FC20, FC25, FC30"
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
                                        placeholder="FC25"
                                        className={inputCls(errors.mutu_beton)}
                                    />
                                </FormField>

                                <FormField
                                    label="Nama Template"
                                    error={errors.nama}
                                    hint="Opsional, untuk membedakan variasi campuran."
                                >
                                    <input
                                        type="text"
                                        value={data.nama}
                                        onChange={(e) =>
                                            setData("nama", e.target.value)
                                        }
                                        placeholder="Contoh: Normal - Slump 12"
                                        className={inputCls(errors.nama)}
                                    />
                                </FormField>

                                <FormField
                                    label="Deskripsi"
                                    error={errors.deskripsi}
                                    className="md:col-span-2"
                                    hint="Tambahkan keterangan jika diperlukan."
                                >
                                    <textarea
                                        rows={3}
                                        value={data.deskripsi}
                                        onChange={(e) =>
                                            setData("deskripsi", e.target.value)
                                        }
                                        placeholder="Keterangan tambahan mengenai komposisi atau penggunaan template..."
                                        className={
                                            inputCls(errors.deskripsi) +
                                            " min-h-24 resize-y"
                                        }
                                    />
                                </FormField>
                            </div>
                        </div>
                    </section>

                    {/* Komposisi Bahan Baku */}
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Layers className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Komposisi Bahan Baku
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Tentukan material dan jumlah kebutuhan
                                        per m³.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Bahan
                            </button>
                        </div>

                        <div className="p-5 sm:p-6">
                            {data.items.length === 0 ? (
                                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/70 px-5 py-12 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm ring-1 ring-gray-200">
                                        <Layers className="h-6 w-6" />
                                    </div>

                                    <h3 className="mt-4 text-sm font-semibold text-gray-800">
                                        Belum Ada Bahan Baku
                                    </h3>

                                    <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-gray-500">
                                        Tambahkan bahan baku yang digunakan
                                        dalam komposisi campuran beton.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambah Bahan Pertama
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Ringkasan Komponen */}
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                                        <span className="text-sm font-medium text-gray-600">
                                            Daftar komponen
                                        </span>

                                        <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-green-600 ring-1 ring-green-300">
                                            {data.items.length} bahan
                                        </span>
                                    </div>

                                    {/* Daftar Bahan */}
                                    {data.items.map((item, i) => (
                                        <div
                                            key={i}
                                            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 sm:p-5"
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                                                        {i + 1}
                                                    </span>

                                                    <h3 className="text-sm font-semibold text-gray-800">
                                                        Bahan Baku {i + 1}
                                                    </h3>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeItem(i)
                                                    }
                                                    title="Hapus bahan"
                                                    aria-label={`Hapus bahan ${i + 1}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg p-2 text-white transition bg-red-600 text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="hidden text-xs font-medium sm:inline">
                                                        Hapus
                                                    </span>
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_200px] md:items-start">
                                                {/* Pilihan Bahan */}
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        Bahan Baku
                                                        <span className="ml-1 text-red-500">
                                                            *
                                                        </span>
                                                    </label>

                                                    <select
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

                                                {/* Jumlah per m³ */}
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        Jumlah / m³
                                                        <span className="ml-1 text-red-500">
                                                            *
                                                        </span>
                                                    </label>

                                                    <input
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
                        </div>
                    </section>

                    {/* Tombol Aksi */}
                    <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Link
                                href={route("production.mix-design.index")}
                                className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
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
                    </div>
                </form>
            </div>
        </Layout>
    );
}

function inputCls(err) {
    return `w-full rounded-lg border px-3.5 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 ${err ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300 focus:border-blue-400"}`;
}

function FormField({ label, required, error, hint, children, className = "" }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
                {hint && (
                    <span className="ml-1 text-xs text-gray-400 font-normal">
                        ({hint})
                    </span>
                )}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
