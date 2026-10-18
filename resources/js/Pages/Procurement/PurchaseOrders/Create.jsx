import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, ClipboardList, FolderKanban, Plus, Save, Trash2 } from "lucide-react";

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
    <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Tambah Purchase Order
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Lengkapi informasi purchase order untuk menambahkan purchase order baru.
                </p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informasi Purchase Order */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <FolderKanban className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Informasi Purchase Order
                        </h2>
                        <p className="text-sm text-gray-500">
                            Identitas dan klasifikasi purchase order
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    {/* Proyek */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Proyek{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.proyek_id}
                            onChange={(e) => {
                                setData((prev) => ({
                                    ...prev,
                                    proyek_id: e.target.value,
                                    titik_id: "",
                                }));
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Pilih Proyek</option>
                            {proyeks.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama}
                                </option>
                            ))}
                        </select>
                        {errors.proyek_id && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.proyek_id}
                            </p>
                        )}
                    </div>

                    {/* Titik */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Titik
                        </label>
                        <select
                            value={data.titik_id}
                            onChange={(e) =>
                                setData("titik_id", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Pilih Titik</option>
                            {proyeks
                                .find(
                                    (p) =>
                                        String(p.id) ===
                                    String(data.proyek_id),
                                )
                                ?.titik?.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nama}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Supplier */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Supplier{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.supplier_id}
                            onChange={(e) =>
                                setData("supplier_id", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Pilih Supplier</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nama}
                                </option>
                            ))}
                        </select>
                        {errors.supplier_id && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.supplier_id}
                            </p>
                        )}
                    </div>

                    {/* Tanggal Pesan */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Tanggal Pesan{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={data.tanggal_pesan}
                            onChange={(e) =>
                                setData("tanggal_pesan", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.tanggal_pesan && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.tanggal_pesan}
                            </p>
                        )}
                    </div>

                    {/* Tanggal Diperlukan */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Tanggal Diperlukan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={data.tanggal_diperlukan}
                            onChange={(e) =>
                                setData(
                                    "tanggal_diperlukan",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.tanggal_diperlukan && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.tanggal_diperlukan}
                            </p>
                        )}
                    </div>

                    {/* Catatan */}
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Catatan
                        </label>
                        <textarea
                            value={data.catatan}
                            onChange={(e) =>
                                setData("catatan", e.target.value)
                            }
                            rows={3}
                            placeholder="Tambahkan catatan pemesanan jika diperlukan..."
                            className="w-full resize-y rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            </div>

            {/* Item Purchase Order */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                Item Purchase Order
                            </h2>
                            <p className="text-sm text-gray-500">
                                Tentukan bahan baku, jumlah, dan harga satuan
                            </p>
                        </div>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                        {data.items.length} item
                    </span>
                </div>

                <div className="space-y-4 p-6">
                    {data.items.map((item, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Item {index + 1}
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    disabled={data.items.length <= 1}
                                    title="Hapus item"
                                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Hapus
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {/* Bahan Baku */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Bahan Baku <span className="text-red-500">*</span>
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
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            Pilih Bahan Baku
                                        </option>
                                        {bahanBakus.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Jumlah */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Jumlah <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={item.jumlah}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "jumlah",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Masukkan jumlah"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* Harga Satuan */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Harga Satuan (Rp) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={
                                            item.harga_satuan_snapshot
                                        }
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "harga_satuan_snapshot",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Masukkan harga satuan"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Tambah Item */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100/70"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Item
                        </button>
                    </div>
                </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-col-reverse gap-3 shadow-sm sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Batal
                </button>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save className="h-4 w-4" />
                    {processing ? "Menyimpan..." : "Simpan"}
                </button>
            </div>
        </form>
    </div>
</Layout>
    );
}
