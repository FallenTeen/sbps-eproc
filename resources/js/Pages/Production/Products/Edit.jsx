import React from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Save } from "lucide-react";

const KATEGORI_OPTIONS = [
    { value: "beton_cor",   label: "Beton Cor (Batching Plant)" },
    { value: "aspal",       label: "Campuran Aspal (AMP)" },
    { value: "agregat",     label: "Agregat / Batu Split" },
    { value: "lainnya",     label: "Lainnya" },
];

export default function Edit({ produk, unitBisnis }) {
    const { data, setData, put, processing, errors } = useForm({
        unit_bisnis_id: produk.unit_bisnis_id || "",
        nama:           produk.nama || "",
        kategori:       produk.kategori || "",
        satuan_output:  produk.satuan_output || "m3",
        aktif:          produk.aktif ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("production.produk.update", produk.id));
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route("production.produk.show", produk.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Produk: <span className="text-blue-600">{produk.nama}</span></h1>
            </div>

            <div className="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <h2 className="text-base font-semibold text-gray-800 pb-3 border-b border-gray-100">Data Produk</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Unit Bisnis" required error={errors.unit_bisnis_id}>
                                <select value={data.unit_bisnis_id} onChange={(e) => setData("unit_bisnis_id", e.target.value)}
                                    className={inputCls(errors.unit_bisnis_id)}>
                                    <option value="">-- Pilih Unit Bisnis --</option>
                                    {unitBisnis.map((ub) => <option key={ub.id} value={ub.id}>{ub.nama}</option>)}
                                </select>
                            </FormField>

                            <FormField label="Nama Produk" required error={errors.nama}>
                                <input type="text" value={data.nama} onChange={(e) => setData("nama", e.target.value)}
                                    className={inputCls(errors.nama)} />
                            </FormField>

                            <FormField label="Kategori" required error={errors.kategori}>
                                <select value={data.kategori} onChange={(e) => setData("kategori", e.target.value)}
                                    className={inputCls(errors.kategori)}>
                                    <option value="">-- Pilih Kategori --</option>
                                    {KATEGORI_OPTIONS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                                </select>
                            </FormField>

                            <FormField label="Satuan Output" required error={errors.satuan_output}>
                                <select value={data.satuan_output} onChange={(e) => setData("satuan_output", e.target.value)}
                                    className={inputCls(errors.satuan_output)}>
                                    <option value="m3">m³ (Meter Kubik)</option>
                                    <option value="ton">Ton</option>
                                </select>
                            </FormField>

                            <FormField label="Status" className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={data.aktif} onChange={(e) => setData("aktif", e.target.checked)}
                                        className="w-4 h-4 rounded accent-blue-600" />
                                    <span className="text-sm text-gray-700">Produk aktif dan tersedia untuk produksi</span>
                                </label>
                            </FormField>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Link href={route("production.produk.show", produk.id)}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                            <Save className="w-4 h-4" />
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
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
