import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Plus, Trash2 } from "lucide-react";

export default function Create({ proyeks, suppliers, bahanBakus }) {
    const { data, setData, post, errors, processing } = useForm({
        proyek_id: "",
        titik_id: "",
        supplier_id: "",
        tanggal_pesan: new Date().toISOString().split("T")[0],
        tanggal_diperlukan: "",
        catatan: "",
        items: [{ bahan_baku_id: "", jumlah: "", harga_satuan_snapshot: "" }],
    });

    const addItem = () => {
        setData("items", [
            ...data.items,
            { bahan_baku_id: "", jumlah: "", harga_satuan_snapshot: "" },
        ]);
    };

    const removeItem = (index) => {
        if (data.items.length <= 1) return;
        const newItems = data.items.filter((_, i) => i !== index);
        setData("items", newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData("items", newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("procurement.purchase-orders.store"));
    };

    return (
        <Layout>
            <h1 className="text-2xl font-bold mb-6">Buat Purchase Order</h1>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow p-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proyek *
                        </label>
                        <select
                            value={data.proyek_id}
                            onChange={(e) =>
                                setData("proyek_id", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Proyek</option>
                            {proyeks.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama}
                                </option>
                            ))}
                        </select>
                        {errors.proyek_id && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.proyek_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Titik
                        </label>
                        <select
                            value={data.titik_id}
                            onChange={(e) =>
                                setData("titik_id", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Titik</option>
                            {proyeks
                                .find((p) => p.id === data.proyek_id)
                                ?.titik?.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nama}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier *
                        </label>
                        <select
                            value={data.supplier_id}
                            onChange={(e) =>
                                setData("supplier_id", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Supplier</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nama}
                                </option>
                            ))}
                        </select>
                        {errors.supplier_id && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.supplier_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Pesan *
                        </label>
                        <input
                            type="date"
                            value={data.tanggal_pesan}
                            onChange={(e) =>
                                setData("tanggal_pesan", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.tanggal_pesan && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.tanggal_pesan}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Diperlukan
                        </label>
                        <input
                            type="date"
                            value={data.tanggal_diperlukan}
                            onChange={(e) =>
                                setData("tanggal_diperlukan", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan
                        </label>
                        <textarea
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            rows="2"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Items */}
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Item PO</h3>
                    <div className="space-y-3">
                        {data.items.map((item, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border-b pb-3"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bahan Baku
                                    </label>
                                    <select
                                        value={item.bahan_baku_id}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "bahan_baku_id",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="">Pilih</option>
                                        {bahanBakus.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jumlah
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.jumlah}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "jumlah",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Harga Satuan
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.harga_satuan_snapshot}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "harga_satuan_snapshot",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pb-1">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-800"
                                        disabled={data.items.length <= 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {index === data.items.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
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
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                    >
                        {processing ? "Menyimpan..." : "Simpan PO"}
                    </button>
                </div>
            </form>
        </Layout>
    );
}
