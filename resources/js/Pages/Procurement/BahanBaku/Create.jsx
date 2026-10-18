import React, { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, FolderKanban, Save } from "lucide-react";

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

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header Halaman */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Tambah Bahan Baku
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Master bahan baku & sparepart
                        </p>
                    </div>
                </div>

                {/* Form Tambah Bahan Baku */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {/* Card Header */}
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FolderKanban className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Informasi Bahan Baku
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Identitas dan klasifikasi bahan baku atau
                                    sparepart
                                </p>
                            </div>
                        </div>

                        {/* Card Content Body */}
                        <div className="p-6 space-y-6">
                            {/* Grid Informasi Utama */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Kode */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kode{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.kode}
                                        onChange={(e) =>
                                            setData("kode", e.target.value)
                                        }
                                        placeholder="Contoh: BB-001"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 shadow-sm"
                                    />
                                    {errors.kode && (
                                        <p className="text-red-600 text-xs mt-1.5">
                                            {errors.kode}
                                        </p>
                                    )}
                                </div>

                                {/* Nama */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nama}
                                        onChange={(e) =>
                                            setData("nama", e.target.value)
                                        }
                                        placeholder="Contoh: Semen / Oli Mesin"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 shadow-sm"
                                    />
                                    {errors.nama && (
                                        <p className="text-red-600 text-xs mt-1.5">
                                            {errors.nama}
                                        </p>
                                    )}
                                </div>

                                {/* Kategori */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kategori{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        value={data.kategori}
                                        onChange={(e) =>
                                            setData("kategori", e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 shadow-sm"
                                    >
                                        <option value="bahan_baku">
                                            Bahan Baku
                                        </option>
                                        <option value="sparepart">
                                            Sparepart
                                        </option>
                                    </select>
                                    {errors.kategori && (
                                        <p className="text-red-600 text-xs mt-1.5">
                                            {errors.kategori}
                                        </p>
                                    )}
                                </div>

                                {/* Satuan */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Satuan{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.satuan}
                                        onChange={(e) =>
                                            setData("satuan", e.target.value)
                                        }
                                        placeholder="Contoh: kg, liter, unit, pcs"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 shadow-sm"
                                    />
                                    {errors.satuan && (
                                        <p className="text-red-600 text-xs mt-1.5">
                                            {errors.satuan}
                                        </p>
                                    )}
                                </div>

                                {/* Sparepart Untuk (Muncul saat Kategori Sparepart) */}
                                {data.kategori === "sparepart" && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Untuk Armada / Mesin
                                        </label>
                                        <input
                                            type="text"
                                            value={data.sparepart_untuk}
                                            onChange={(e) =>
                                                setData(
                                                    "sparepart_untuk",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: Armada Truk, Mesin Batching Plant"
                                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 shadow-sm"
                                        />
                                        {errors.sparepart_untuk && (
                                            <p className="text-red-600 text-xs mt-1.5">
                                                {errors.sparepart_untuk}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        value={data.aktif ? "1" : "0"}
                                        onChange={(e) =>
                                            setData(
                                                "aktif",
                                                e.target.value === "1",
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 shadow-sm"
                                    >
                                        <option value="1">Aktif</option>
                                        <option value="0">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            {/* Section Harga Beli Awal Opsional */}
                            <div className="border-t border-gray-200 pt-5">
                                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={tambahHarga}
                                        onChange={(e) =>
                                            setTambahHarga(e.target.checked)
                                        }
                                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="text-sm font-medium text-gray-800">
                                        Tambahkan harga beli awal
                                    </span>
                                </label>

                                {tambahHarga && (
                                    <div className="mt-4 rounded-xl bg-gray-50/80 p-4 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Supplier */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Supplier{" "}
                                                <span className="text-red-600">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={data.supplier_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "supplier_id",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 shadow-sm bg-white"
                                            >
                                                <option value="">
                                                    Pilih Supplier
                                                </option>
                                                {suppliers.map((s) => (
                                                    <option
                                                        key={s.id}
                                                        value={s.id}
                                                    >
                                                        {s.nama}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.supplier_id && (
                                                <p className="text-red-600 text-xs mt-1">
                                                    {errors.supplier_id}
                                                </p>
                                            )}
                                        </div>

                                        {/* Harga Awal */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Harga Awal{" "}
                                                <span className="text-red-600">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.harga_awal}
                                                onChange={(e) =>
                                                    setData(
                                                        "harga_awal",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 shadow-sm bg-white"
                                            />
                                            {errors.harga_awal && (
                                                <p className="text-red-600 text-xs mt-1">
                                                    {errors.harga_awal}
                                                </p>
                                            )}
                                        </div>

                                        {/* Tanggal Berlaku */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Berlaku Dari{" "}
                                                <span className="text-red-600">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                value={data.berlaku_dari}
                                                onChange={(e) =>
                                                    setData(
                                                        "berlaku_dari",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900 shadow-sm bg-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tombol Aksi */}
                            <div className="pt-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
