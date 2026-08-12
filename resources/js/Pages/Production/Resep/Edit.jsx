import React from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Save } from "lucide-react";

export default function Edit({ resep, bahanBakus }) {
    const { data, setData, put, processing, errors } = useForm({
        bahan_baku_id:          resep.bahan_baku_id || "",
        jumlah_per_unit_output: resep.jumlah_per_unit_output || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("production.resep.update", resep.id));
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route("production.produk.show", resep.produk_id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Item Resep</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Bahan saat ini: <span className="font-medium">{resep.bahan_baku?.nama}</span></p>
                </div>
            </div>

            <div className="max-w-xl">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <h2 className="text-base font-semibold text-gray-800 pb-3 border-b border-gray-100">Edit Komposisi</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bahan Baku <span className="text-red-500">*</span></label>
                        <select value={data.bahan_baku_id} onChange={(e) => setData("bahan_baku_id", e.target.value)}
                            className={inputCls(errors.bahan_baku_id)}>
                            <option value="">-- Pilih Bahan Baku --</option>
                            {bahanBakus.map((b) => (
                                <option key={b.id} value={b.id}>{b.nama} ({b.satuan})</option>
                            ))}
                        </select>
                        {errors.bahan_baku_id && <p className="text-xs text-red-500 mt-1">{errors.bahan_baku_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah per Unit Output <span className="text-red-500">*</span></label>
                        <input type="number" step="0.0001" min="0.0001" value={data.jumlah_per_unit_output}
                            onChange={(e) => setData("jumlah_per_unit_output", e.target.value)}
                            className={inputCls(errors.jumlah_per_unit_output)} />
                        {errors.jumlah_per_unit_output && <p className="text-xs text-red-500 mt-1">{errors.jumlah_per_unit_output}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <Link href={route("production.produk.show", resep.produk_id)}
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
