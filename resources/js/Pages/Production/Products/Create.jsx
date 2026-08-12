import React, { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Save, Sparkles } from "lucide-react";

const KATEGORI_OPTIONS = [
    { value: "beton_cor",   label: "Beton Cor (Batching Plant)" },
    { value: "aspal",       label: "Campuran Aspal (AMP)" },
    { value: "agregat",     label: "Agregat / Batu Split" },
    { value: "lainnya",     label: "Lainnya" },
];

export default function Create({ unitBisnis, mixDesigns }) {
    const { data, setData, post, processing, errors } = useForm({
        unit_bisnis_id:        "",
        nama:                  "",
        kategori:              "",
        satuan_output:         "m3",
        aktif:                 true,
        harga_awal:            "",
        berlaku_dari:          new Date().toISOString().slice(0, 10),
        mix_design_template_id:"",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("production.produk.store"));
    };

    const hasMixDesign = data.kategori === "beton_cor";

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route("production.produk.index")} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
            </div>

            <div className="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Data Utama */}
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
                                    placeholder="Contoh: Beton FC25, HRS-WC, Batu Split 2/3"
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

                            <FormField label="Status" error={errors.aktif} className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={data.aktif} onChange={(e) => setData("aktif", e.target.checked)}
                                        className="w-4 h-4 rounded accent-blue-600" />
                                    <span className="text-sm text-gray-700">Produk aktif dan tersedia untuk produksi</span>
                                </label>
                            </FormField>
                        </div>
                    </div>

                    {/* Harga Awal */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <h2 className="text-base font-semibold text-gray-800 pb-3 border-b border-gray-100">Harga Jual Awal <span className="text-gray-400 font-normal text-sm">(opsional)</span></h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Harga Jual (Rp/satuan)" error={errors.harga_awal}>
                                <input type="number" min="0" value={data.harga_awal} onChange={(e) => setData("harga_awal", e.target.value)}
                                    placeholder="Contoh: 850000"
                                    className={inputCls(errors.harga_awal)} />
                            </FormField>
                            <FormField label="Berlaku Dari" error={errors.berlaku_dari}>
                                <input type="date" value={data.berlaku_dari} onChange={(e) => setData("berlaku_dari", e.target.value)}
                                    className={inputCls(errors.berlaku_dari)} />
                            </FormField>
                        </div>
                    </div>

                    {/* Mix Design (khusus beton) */}
                    {hasMixDesign && (
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                                <h2 className="text-base font-semibold text-blue-800">Generate Resep dari Mix Design Template</h2>
                            </div>
                            <p className="text-sm text-blue-700">Pilih template mix design mutu beton untuk otomatis mengisi komposisi resep/BOM produk ini.</p>
                            <FormField label="Template Mix Design" error={errors.mix_design_template_id}>
                                <select value={data.mix_design_template_id} onChange={(e) => setData("mix_design_template_id", e.target.value)}
                                    className={inputCls(errors.mix_design_template_id)}>
                                    <option value="">-- Pilih Mutu Beton (opsional) --</option>
                                    {mixDesigns.map((md) => (
                                        <option key={md.id} value={md.id}>{md.mutu_beton} {md.nama ? `— ${md.nama}` : ""}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Link href={route("production.produk.index")}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                            <Save className="w-4 h-4" />
                            {processing ? "Menyimpan..." : "Simpan Produk"}
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
