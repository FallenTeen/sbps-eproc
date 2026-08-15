import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Edit({ session, mesins, produks, operator, titiks }) {
    const { data, setData, put, errors, processing } = useForm({
        mesin_id: session.mesin_id,
        titik_id: session.titik_id,
        produk_id: session.produk_id,
        operator_karyawan_id: session.operator_karyawan_id,
        catatan: session.catatan || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("production.sessions.update", session.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Sesi Produksi" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Sesi Produksi</h1>
                <p className="mt-1 text-sm text-gray-500">{session.kode_sesi}</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mesin *</label>
                        <select
                            value={data.mesin_id}
                            onChange={(e) => setData("mesin_id", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Pilih Mesin</option>
                            {mesins.map((m) => (
                                <option key={m.id} value={m.id}>{m.nama}</option>
                            ))}
                        </select>
                        {errors.mesin_id && <p className="text-red-600 text-sm mt-1">{errors.mesin_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Produk *</label>
                        <select
                            value={data.produk_id}
                            onChange={(e) => setData("produk_id", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Pilih Produk</option>
                            {produks.map((p) => (
                                <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                        </select>
                        {errors.produk_id && <p className="text-red-600 text-sm mt-1">{errors.produk_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Operator *</label>
                        <select
                            value={data.operator_karyawan_id}
                            onChange={(e) => setData("operator_karyawan_id", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Pilih Operator</option>
                            {operator.map((o) => (
                                <option key={o.id} value={o.id}>{o.nama}</option>
                            ))}
                        </select>
                        {errors.operator_karyawan_id && <p className="text-red-600 text-sm mt-1">{errors.operator_karyawan_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titik *</label>
                        <select
                            value={data.titik_id}
                            onChange={(e) => setData("titik_id", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Pilih Titik</option>
                            {titiks.map((t) => (
                                <option key={t.id} value={t.id}>{t.nama}</option>
                            ))}
                        </select>
                        {errors.titik_id && <p className="text-red-600 text-sm mt-1">{errors.titik_id}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            rows="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
                    >
                        {processing ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}