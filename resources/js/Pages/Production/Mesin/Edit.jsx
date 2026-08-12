import React from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Save } from "lucide-react";

export default function Edit({ mesin, unitBisnis, titiks, produks }) {
    const { data, setData, put, processing, errors } = useForm({
        unit_bisnis_id: mesin.unit_bisnis_id || "",
        titik_id: mesin.titik_id || "",
        produk_id: mesin.produk_id || "",
        nama: mesin.nama || "",
        jenis: mesin.jenis || "",
        kapasitas: mesin.kapasitas || "",
        status: mesin.status || "aktif",
        biaya_per_jam: mesin.biaya_per_jam || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("production.mesin.update", mesin.id));
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route("production.mesin.index")}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Mesin Produksi: {mesin.nama}</h1>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mesin <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={data.nama}
                                onChange={(e) => setData("nama", e.target.value)}
                                className={`w-full rounded-md border ${errors.nama ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} px-4 py-2 transition-shadow`}
                            />
                            {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Mesin <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={data.jenis}
                                onChange={(e) => setData("jenis", e.target.value)}
                                className={`w-full rounded-md border ${errors.jenis ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} px-4 py-2 transition-shadow`}
                            />
                            {errors.jenis && <p className="text-red-500 text-xs mt-1">{errors.jenis}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Bisnis <span className="text-red-500">*</span></label>
                            <select
                                value={data.unit_bisnis_id}
                                onChange={(e) => setData("unit_bisnis_id", e.target.value)}
                                className={`w-full rounded-md border ${errors.unit_bisnis_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} px-4 py-2 transition-shadow`}
                            >
                                <option value="">-- Pilih Unit Bisnis --</option>
                                {unitBisnis.map((ub) => (
                                    <option key={ub.id} value={ub.id}>{ub.nama}</option>
                                ))}
                            </select>
                            {errors.unit_bisnis_id && <p className="text-red-500 text-xs mt-1">{errors.unit_bisnis_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titik (Lokasi)</label>
                            <select
                                value={data.titik_id}
                                onChange={(e) => setData("titik_id", e.target.value)}
                                className={`w-full rounded-md border ${errors.titik_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} px-4 py-2 transition-shadow`}
                            >
                                <option value="">-- Pilih Titik Lokasi --</option>
                                {titiks.map((titik) => (
                                    <option key={titik.id} value={titik.id}>{titik.nama}</option>
                                ))}
                            </select>
                            {errors.titik_id && <p className="text-red-500 text-xs mt-1">{errors.titik_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Produk Default (Output)</label>
                            <select
                                value={data.produk_id}
                                onChange={(e) => setData("produk_id", e.target.value)}
                                className={`w-full rounded-md border ${errors.produk_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} px-4 py-2 transition-shadow`}
                            >
                                <option value="">-- Pilih Produk Output --</option>
                                {produks.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nama_produk}</option>
                                ))}
                            </select>
                            {errors.produk_id && <p className="text-red-500 text-xs mt-1">{errors.produk_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas Produksi</label>
                            <input
                                type="text"
                                value={data.kapasitas}
                                onChange={(e) => setData("kapasitas", e.target.value)}
                                className="w-full rounded-md border border-gray-300 focus:ring-blue-500 px-4 py-2 transition-shadow"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Per Jam (Rp)</label>
                            <input
                                type="number"
                                min="0"
                                value={data.biaya_per_jam}
                                onChange={(e) => setData("biaya_per_jam", e.target.value)}
                                className="w-full rounded-md border border-gray-300 focus:ring-blue-500 px-4 py-2 transition-shadow"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                            <select
                                value={data.status}
                                onChange={(e) => setData("status", e.target.value)}
                                className={`w-full rounded-md border ${errors.status ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} px-4 py-2 transition-shadow`}
                            >
                                <option value="aktif">Aktif</option>
                                <option value="rusak">Rusak</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md mr-3 hover:bg-gray-50 font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
