import React from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, DatabaseCheck, Save } from "lucide-react";

const KATEGORI_OPTIONS = [
    { value: "beton_cor", label: "Beton Cor (Batching Plant)" },
    { value: "aspal", label: "Campuran Aspal (AMP)" },
    { value: "agregat", label: "Agregat / Batu Split" },
    { value: "lainnya", label: "Lainnya" },
];

export default function Edit({ produk, unitBisnis }) {
    const { data, setData, put, processing, errors } = useForm({
        unit_bisnis_id: produk.unit_bisnis_id || "",
        nama: produk.nama || "",
        kategori: produk.kategori || "",
        satuan_output: produk.satuan_output || "m3",
        aktif: produk.aktif ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("production.produk.update", produk.id));
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Edit Produk
                            </h1>
                            <p className="mt-1 truncate text-sm text-gray-500">
                                Perbarui informasi produk{" "}
                                <span className="font-medium text-blue-600">
                                    {produk.nama}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Data Produk */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
                                        Lengkapi informasi produk yang akan
                                        diperbarui.
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

                            {/* Status */}
                            <div className="sm:col-span-2">
                                <FormField label="Status">
                                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={data.aktif}
                                            onChange={(e) =>
                                                setData(
                                                    "aktif",
                                                    e.target.checked,
                                                )
                                            }
                                            className="mt-0.5 h-4 w-4 rounded accent-blue-600"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Produk aktif dan tersedia untuk
                                            produksi
                                        </span>
                                    </label>
                                </FormField>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href={route("production.produk.show", produk.id)}
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
