import React from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Edit({ bahanBaku, suppliers }) {
    const { data, setData, put, errors, processing } = useForm({
        nama: bahanBaku.nama,
        kategori: bahanBaku.kategori,
        sparepart_untuk: bahanBaku.sparepart_untuk || "",
        satuan: bahanBaku.satuan,
        aktif: bahanBaku.aktif,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("procurement.bahan-baku.update", bahanBaku.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Bahan Baku" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Bahan Baku</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {bahanBaku.kode} - {bahanBaku.nama}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                            />
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

            {/* Histori harga */}
            {suppliers.length > 0 && (
                <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Histori Harga Beli</h2>
                    {bahanBaku.harga_beli?.length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada data harga.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase">Supplier</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-900 uppercase">Harga</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase">Berlaku Dari</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase">Berlaku Sampai</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {bahanBaku.harga_beli.map((h) => (
                                        <tr key={h.id}>
                                            <td className="px-4 py-2 text-sm text-gray-600">{h.supplier?.nama}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                                Rp {Number(h.harga).toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {new Date(h.berlaku_dari).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {h.berlaku_sampai
                                                    ? new Date(h.berlaku_sampai).toLocaleDateString("id-ID")
                                                    : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}