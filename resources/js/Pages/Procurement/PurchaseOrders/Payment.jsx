import React, { useState } from "react";
import { useForm, Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft } from "lucide-react";

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
            <div className="mb-6 flex items-center gap-4">
                <Link
                    href={route("procurement.purchase-orders.show", po.id)}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">
                    Pembayaran PO: {po.kode_po}
                </h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <div className="mb-4">
                    <p>
                        <strong>Total PO:</strong> Rp{" "}
                        {Number(po.total).toLocaleString("id-ID")}
                    </p>
                    <p>
                        <strong>Sisa Tagihan:</strong> Rp{" "}
                        {Number(sisaTagihan).toLocaleString("id-ID")}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah Bayar *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.jumlah}
                            onChange={(e) => setData("jumlah", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.jumlah && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.jumlah}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal *
                        </label>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) => setData("tanggal", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.tanggal && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.tanggal}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Metode *
                        </label>
                        <select
                            value={data.metode}
                            onChange={(e) => setData("metode", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="tunai">Tunai</option>
                            <option value="transfer">Transfer</option>
                            <option value="cek">Cek</option>
                            <option value="lainnya">Lainnya</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Akun Kas/Bank *
                        </label>
                        <select
                            value={data.akun_kas_bank_id}
                            onChange={(e) =>
                                setData("akun_kas_bank_id", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Akun</option>
                            {akunKas.map((akun) => (
                                <option key={akun.id} value={akun.id}>
                                    {akun.nama} (
                                    {akun.jenis_kas.replace(/_/g, " ")})
                                </option>
                            ))}
                        </select>
                        {errors.akun_kas_bank_id && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.akun_kas_bank_id}
                            </p>
                        )}
                    </div>

                    <div>
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

                    <div className="flex justify-end gap-3 pt-4">
                        <Link
                            href={route(
                                "procurement.purchase-orders.show",
                                po.id,
                            )}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                        >
                            {processing ? "Memproses..." : "Bayar"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
