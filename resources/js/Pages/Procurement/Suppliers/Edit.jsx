import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Edit({ supplier }) {
    const { data, setData, put, errors, processing } = useForm({
        nama: supplier.nama,
        kontak: supplier.kontak || "",
        telepon: supplier.telepon || "",
        alamat: supplier.alamat || "",
        aktif: supplier.aktif,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("procurement.supplier.update", supplier.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Supplier" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Supplier</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {supplier.kode} - {supplier.nama}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kontak</label>
                        <input
                            type="text"
                            value={data.kontak}
                            onChange={(e) => setData("kontak", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                        <input
                            type="text"
                            value={data.telepon}
                            onChange={(e) => setData("telepon", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                        <textarea
                            value={data.alamat}
                            onChange={(e) => setData("alamat", e.target.value)}
                            rows="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>

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
        </AuthenticatedLayout>
    );
}