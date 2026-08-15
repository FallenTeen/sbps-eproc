import React, { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft } from "lucide-react";

export default function Show({ bahanBaku }) {
    const [showHargaForm, setShowHargaForm] = useState(false);

    const { data, setData, post, errors, processing } = useForm({
        supplier_id: "",
        harga: "",
        berlaku_dari: new Date().toISOString().split("T")[0],
    });

    const handleHargaSubmit = (e) => {
        e.preventDefault();
        post(route("procurement.bahan-baku.set-harga", bahanBaku.id), {
            onSuccess: () => {
                setShowHargaForm(false);
                setData({ supplier_id: "", harga: "", berlaku_dari: new Date().toISOString().split("T")[0] });
            },
        });
    };

    const historis = [...(bahanBaku.harga_beli || [])].sort(
        (a, b) => new Date(b.berlaku_dari) - new Date(a.berlaku_dari),
    );
    const hargaAktif = historis[0];

    return (
        <AuthenticatedLayout>
            <Head title={`Bahan Baku ${bahanBaku.nama}`} />

            <div className="mb-6">
                <a
                    href={route("procurement.bahan-baku.index")}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </a>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{bahanBaku.nama}</h1>
                        <p className="mt-1 text-sm text-gray-500">{bahanBaku.kode}</p>
                    </div>
                    <a
                        href={route("procurement.bahan-baku.edit", bahanBaku.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        Edit
                    </a>
                </div>
            </div>

            {/* Info dasar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Kategori</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {bahanBaku.kategori === "bahan_baku" ? "Bahan Baku" : "Sparepart"}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Satuan</p>
                    <p className="text-lg font-semibold text-gray-900">{bahanBaku.satuan}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Harga Terakhir</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {hargaAktif ? "Rp " + Number(hargaAktif.harga).toLocaleString("id-ID") : "-"}
                    </p>
                    {hargaAktif && (
                        <p className="text-xs text-gray-500 mt-1">
                            {hargaAktif.supplier?.nama} ·{" "}
                            {new Date(hargaAktif.berlaku_dari).toLocaleDateString("id-ID")}
                        </p>
                    )}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bahanBaku.aktif ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                        {bahanBaku.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Histori harga */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Histori Harga Beli</h2>
                        <button
                            onClick={() => setShowHargaForm(!showHargaForm)}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                        >
                            Tambah Harga
                        </button>
                    </div>

                    {showHargaForm && (
                        <form onSubmit={handleHargaSubmit} className="mb-6 bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                                    <select
                                        value={data.supplier_id}
                                        onChange={(e) => setData("supplier_id", e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="">Pilih Supplier</option>
                                        {(bahanBaku.suppliers || []).map((s) => (
                                            <option key={s.id} value={s.id}>{s.nama}</option>
                                        ))}
                                    </select>
                                    {errors.supplier_id && <p className="text-red-600 text-sm mt-1">{errors.supplier_id}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.harga}
                                        onChange={(e) => setData("harga", e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                    {errors.harga && <p className="text-red-600 text-sm mt-1">{errors.harga}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Dari</label>
                                    <input
                                        type="date"
                                        value={data.berlaku_dari}
                                        onChange={(e) => setData("berlaku_dari", e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowHargaForm(false)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-3 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md text-sm disabled:opacity-50"
                                >
                                    {processing ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    )}

                    {historis.length === 0 ? (
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
                                    {historis.map((h) => (
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

                {/* Stok */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Stok</h2>
                        <Link
                            href={route("procurement.bahan-baku.stok", bahanBaku.id)}
                            className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                        >
                            Detail
                        </Link>
                    </div>
                    {bahanBaku.stok_per_titik?.length === 0 || !bahanBaku.stok_per_titik ? (
                        <p className="text-sm text-gray-500">Belum ada mutasi stok.</p>
                    ) : (
                        <div className="space-y-3">
                            {bahanBaku.stok_per_titik.map((s) => (
                                <div key={s.titik_id} className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm text-gray-600">{s.titik}</span>
                                    <span className={`text-sm font-semibold ${s.stok < 0 ? "text-red-600" : "text-gray-900"}`}>
                                        {Number(s.stok).toLocaleString("id-ID")} {bahanBaku.satuan}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}