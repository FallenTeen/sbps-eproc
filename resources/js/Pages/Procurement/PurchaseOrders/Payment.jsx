import React, { useState } from "react";
import { useForm, Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, ClipboardList, FolderKanban, Save } from "lucide-react";

export default function Payment({ po, akunKas, sisaTagihan }) {
    const { data, setData, post, errors, processing } = useForm({
        jumlah: sisaTagihan,
        tanggal: new Date().toISOString().split("T")[0],
        metode: "transfer",
        akun_kas_bank_id: "",
        catatan: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("procurement.purchase-orders.store-payment", po.id));
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Bayar Purchase Order
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Lengkapi informasi pembayaran untuk menyelesaikan
                            pembayaran purchase order.
                        </p>
                    </div>
                </div>

                {/* Ringkasan Tagihan */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <FolderKanban className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                Ringkasan Tagihan
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-green-50 p-4">
                            <p className="text-sm font-medium text-green-500">
                                Total Purchase Order
                            </p>
                            <p className="mt-2 text-xl font-bold text-green-800">
                                Rp {Number(po.total).toLocaleString("id-ID")}
                            </p>
                        </div>

                        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                            <p className="text-sm font-medium text-red-700">
                                Sisa Tagihan
                            </p>
                            <p className="mt-2 text-xl font-bold text-red-700">
                                Rp {Number(sisaTagihan).toLocaleString("id-ID")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Pembayaran */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div>
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Informasi Pembayaran
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Jumlah Bayar */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Jumlah Bayar{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    max={sisaTagihan}
                                    step="0.01"
                                    value={data.jumlah}
                                    onChange={(e) =>
                                        setData("jumlah", e.target.value)
                                    }
                                    placeholder="Masukkan jumlah pembayaran"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.jumlah && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.jumlah}
                                    </p>
                                )}
                            </div>

                            {/* Tanggal */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Tanggal Pembayaran{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) =>
                                        setData("tanggal", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.tanggal && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.tanggal}
                                    </p>
                                )}
                            </div>

                            {/* Metode */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Metode Pembayaran{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.metode}
                                    onChange={(e) =>
                                        setData("metode", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="tunai">Tunai</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="cek">Cek</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                            </div>

                            {/* Akun Kas/Bank */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Akun Kas/Bank{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.akun_kas_bank_id}
                                    onChange={(e) =>
                                        setData(
                                            "akun_kas_bank_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">
                                        Pilih Akun Kas/Bank
                                    </option>
                                    {akunKas.map((akun) => (
                                        <option key={akun.id} value={akun.id}>
                                            {akun.nama} (
                                            {akun.jenis_kas.replace(/_/g, " ")})
                                        </option>
                                    ))}
                                </select>
                                {errors.akun_kas_bank_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.akun_kas_bank_id}
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
                                    placeholder="Tambahkan catatan pembayaran jika diperlukan..."
                                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                        <Link
                            href={route(
                                "procurement.purchase-orders.show",
                                po.id,
                            )}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Batal
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? "Memproses..." : "Bayar"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
