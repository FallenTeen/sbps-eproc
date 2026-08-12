import React, { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

export default function Create({ bahanBakus }) {
    const { data, setData, post, processing, errors } = useForm({
        mutu_beton:  "",
        nama:        "",
        deskripsi:   "",
        items:       [],
    });

    const addItem = () => {
        setData("items", [...data.items, { bahan_baku_id: "", jumlah_per_m3: "" }]);
    };

    const updateItem = (index, field, value) => {
        const items = [...data.items];
        items[index] = { ...items[index], [field]: value };
        setData("items", items);
    };

    const removeItem = (index) => {
        setData("items", data.items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("production.mix-design.store"));
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route("production.mix-design.index")} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Buat Template Mix Design</h1>
            </div>

            <div className="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Info Template */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <h2 className="text-base font-semibold text-gray-800 pb-3 border-b border-gray-100">Informasi Template</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Mutu Beton" required error={errors.mutu_beton} hint="Contoh: FC10, FC20, FC25, FC30">
                                <input type="text" value={data.mutu_beton} onChange={(e) => setData("mutu_beton", e.target.value.toUpperCase())}
                                    placeholder="FC25" className={inputCls(errors.mutu_beton)} />
                            </FormField>
                            <FormField label="Nama Template" error={errors.nama} hint="Opsional — label deskriptif">
                                <input type="text" value={data.nama} onChange={(e) => setData("nama", e.target.value)}
                                    placeholder="Contoh: Normal - Slump 12" className={inputCls(errors.nama)} />
                            </FormField>
                            <FormField label="Deskripsi" error={errors.deskripsi} className="md:col-span-2">
                                <textarea rows={2} value={data.deskripsi} onChange={(e) => setData("deskripsi", e.target.value)}
                                    placeholder="Keterangan tambahan..." className={inputCls(errors.deskripsi) + " resize-none"} />
                            </FormField>
                        </div>
                    </div>

                    {/* Items Komposisi */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-5">
                            <div>
                                <h2 className="text-base font-semibold text-gray-800">Komposisi Bahan Baku</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Jumlah per m³ campuran beton</p>
                            </div>
                            <button type="button" onClick={addItem}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                                <Plus className="w-4 h-4" /> Tambah Bahan
                            </button>
                        </div>

                        {data.items.length === 0 ? (
                            <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                Belum ada bahan. Klik "Tambah Bahan" untuk mulai.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.items.map((item, i) => (
                                    <div key={i} className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Bahan Baku *</label>
                                            <select value={item.bahan_baku_id} onChange={(e) => updateItem(i, "bahan_baku_id", e.target.value)}
                                                className={inputCls(errors[`items.${i}.bahan_baku_id`])}>
                                                <option value="">-- Pilih Bahan --</option>
                                                {bahanBakus.map((b) => <option key={b.id} value={b.id}>{b.nama} ({b.satuan})</option>)}
                                            </select>
                                            {errors[`items.${i}.bahan_baku_id`] && <p className="text-xs text-red-500 mt-1">{errors[`items.${i}.bahan_baku_id`]}</p>}
                                        </div>
                                        <div className="w-44">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah / m³ *</label>
                                            <input type="number" step="0.001" min="0" value={item.jumlah_per_m3}
                                                onChange={(e) => updateItem(i, "jumlah_per_m3", e.target.value)}
                                                placeholder="0.000" className={inputCls(errors[`items.${i}.jumlah_per_m3`])} />
                                            {errors[`items.${i}.jumlah_per_m3`] && <p className="text-xs text-red-500 mt-1">{errors[`items.${i}.jumlah_per_m3`]}</p>}
                                        </div>
                                        <button type="button" onClick={() => removeItem(i)}
                                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Link href={route("production.mix-design.index")}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                            <Save className="w-4 h-4" />
                            {processing ? "Menyimpan..." : "Simpan Template"}
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

function FormField({ label, required, error, hint, children, className = "" }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
                {hint && <span className="ml-1 text-xs text-gray-400 font-normal">({hint})</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
