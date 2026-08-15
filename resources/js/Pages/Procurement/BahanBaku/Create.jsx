import React, { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Create({ suppliers }) {
    const { data, setData, post, errors, processing } = useForm({
        kode: "",
        nama: "",
        kategori: "bahan_baku",
        sparepart_untuk: "",
        satuan: "",
        aktif: true,
        supplier_id: "",
        harga_awal: "",
        berlaku_dari: new Date().toISOString().split("T")[0],
    });

    const [tambahHarga, setTambahHarga] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("procurement.bahan-baku.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Bahan Baku" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Tambah Bahan Baku</h1>
                <p className="mt-1 text-sm text-gray-500">Master bahan baku & sparepart</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kode *</label>
                        <input
                            type="text"
                            value={data.kode}
                            onChange={(e) => setData("kode", e.target.value)}
                            placeholder="contoh: BB-001"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.kode && <p className="text-red-600 text-sm mt-1">{errors.kode}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                        <input
                            type="text"
                            value={data.nama}
                            onChange={(e) => setData("nama", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.nama && <p className="text-red-600 text-sm mt-1">{errors.nama}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                        <select
                            value={data.kategori}
                            onChange={(e) => setData("kategori", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="bahan_baku">Bahan Baku</option>
                            <option value="sparepart">Sparepart</option>
                        </select>
                        {errors.kategori && <p className="text-red-600 text-sm mt-1">{errors.kategori}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Satuan *</label>
                        <input
                            type="text"
                            value={data.satuan}
                            onChange={(e) => setData("satuan", e.target.value)}
                            placeholder="contoh: kg, liter, unit, pcs"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.satuan && <p className="text-red-600 text-sm mt-1">{errors.satuan}</p>}
                    </div>

                    {data.kategori === "sparepart" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Untuk Armada / Mesin
                            </label>
                            <input
                                type="text"
                                value={data.sparepart_untuk}
                                onChange={(e) => setData("sparepart_untuk", e.target.value)}
                                placeholder="contoh: Armada Truk, Mesin Batching Plant"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                            />
                            {errors.sparepart_untuk && (
                                <p className="text-red-600 text-sm mt-1">{errors.sparepart_untuk}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={data.aktif ? "1" : "0"}
                            onChange={(e) => setData("aktif", e.target.value === "1")}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="1">Aktif</option>
                            <option value="0">Nonaktif</option>
                        </select>
                    </div>
                </div>

                {/* Harga awal opsional */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={tambahHarga}
                            onChange={(e) => setTambahHarga(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Tambahkan harga beli awal</span>
                    </label>

                    {tambahHarga && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                                <select
                                    value={data.supplier_id}
                                    onChange={(e) => setData("supplier_id", e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                                >
                                    <option value="">Pilih Supplier</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.nama}</option>
                                    ))}
                                </select>
                                {errors.supplier_id && <p className="text-red-600 text-sm mt-1">{errors.supplier_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Awal *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.harga_awal}
                                    onChange={(e) => setData("harga_awal", e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                                />
                                {errors.harga_awal && <p className="text-red-600 text-sm mt-1">{errors.harga_awal}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Dari</label>
                                <input
                                    type="date"
                                    value={data.berlaku_dari}
                                    onChange={(e) => setData("berlaku_dari", e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                                />
                            </div>
                        </div>
                    )}
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
                        {processing ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}