import React, { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Edit, Eye, Plus, Save } from "lucide-react";
import { formatTanggal } from "@/utils/date";

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
                setData({
                    supplier_id: "",
                    harga: "",
                    berlaku_dari: new Date().toISOString().split("T")[0],
                });
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

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {bahanBaku.nama}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Kode: {bahanBaku.kode}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={route("procurement.bahan-baku.index")}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Link>

                        <Link
                            href={route(
                                "procurement.bahan-baku.edit",
                                bahanBaku.id,
                            )}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Link>
                    </div>
                </div>

                {/* Informasi Dasar */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">
                            Kategori
                        </p>
                        <p className="mt-2 text-lg font-semibold text-gray-800">
                            {bahanBaku.kategori === "bahan_baku"
                                ? "Bahan Baku"
                                : "Sparepart"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">
                            Satuan
                        </p>
                        <p className="mt-2 text-lg font-semibold text-gray-800">
                            {bahanBaku.satuan}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">
                            Harga Terakhir
                        </p>
                        <p className="mt-2 text-lg font-semibold text-gray-800">
                            {hargaAktif
                                ? `Rp ${Number(hargaAktif.harga).toLocaleString("id-ID")}`
                                : "-"}
                        </p>
                        {hargaAktif && (
                            <p className="mt-1 text-xs text-gray-500">
                                {hargaAktif.supplier?.nama} ·{" "}
                                {formatTanggal(hargaAktif.berlaku_dari)}
                            </p>
                        )}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">
                            Status
                        </p>
                        <div className="mt-2">
                            <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                    bahanBaku.aktif
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                }`}
                            >
                                {bahanBaku.aktif ? "Aktif" : "Nonaktif"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Konten Utama */}
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                    {/* Histori Harga */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
                        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Histori Harga Beli
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Riwayat perubahan harga dari supplier.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowHargaForm(!showHargaForm)}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Harga
                            </button>
                        </div>

                        {/* Form Tambah Harga */}
                        {showHargaForm && (
                            <form
                                onSubmit={handleHargaSubmit}
                                className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5"
                            >
                                <h3 className="mb-4 text-base font-semibold text-gray-800">
                                    Tambah Harga Beli
                                </h3>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {/* Supplier */}

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Supplier{" "}
                                            <span className="text-red-500">
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
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">
                                                Pilih Supplier
                                            </option>

                                            {(bahanBaku.harga_beli ?? []).map(
                                                (harga) =>
                                                    harga.supplier && (
                                                        <option
                                                            key={
                                                                harga.supplier
                                                                    .id
                                                            }
                                                            value={
                                                                harga.supplier
                                                                    .id
                                                            }
                                                        >
                                                            {
                                                                harga.supplier
                                                                    .nama
                                                            }
                                                        </option>
                                                    ),
                                            )}
                                        </select>

                                        {errors.supplier_id && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.supplier_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Harga */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Harga (Rp){" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.harga}
                                            onChange={(e) =>
                                                setData("harga", e.target.value)
                                            }
                                            placeholder="Masukkan harga"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        {errors.harga && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.harga}
                                            </p>
                                        )}
                                    </div>

                                    {/* Berlaku Dari */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Berlaku Dari
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
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowHargaForm(false)}
                                        className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        Batal
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        {processing ? "Menyimpan..." : "Simpan"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Tabel Histori Harga */}
                        {historis.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
                                <p className="text-sm font-medium text-gray-600">
                                    Belum ada data harga.
                                </p>
                                <p className="mt-1 text-sm text-gray-400">
                                    Tambahkan harga beli untuk mulai mencatat
                                    riwayat.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Supplier
                                            </th>
                                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Harga
                                            </th>
                                            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Berlaku Dari
                                            </th>
                                            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Berlaku Sampai
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {historis.map((h) => (
                                            <tr
                                                key={h.id}
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                                    {h.supplier?.nama || "-"}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-800">
                                                    Rp{" "}
                                                    {Number(
                                                        h.harga,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                                    {formatTanggal(
                                                        h.berlaku_dari,
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                                    {formatTanggal(
                                                        h.berlaku_sampai,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Informasi Stok */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center justify-between gap-3 border-b border-gray-200 pb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Stok
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Stok berdasarkan titik.
                                </p>
                            </div>

                            <Link
                                href={route(
                                    "procurement.bahan-baku.stok",
                                    bahanBaku.id,
                                )}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                Detail
                                <Eye className="h-4 w-4" />
                            </Link>
                        </div>

                        {!bahanBaku.stok_per_titik ||
                        bahanBaku.stok_per_titik.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
                                <p className="text-sm font-medium text-gray-600">
                                    Belum ada mutasi stok.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bahanBaku.stok_per_titik.map((s) => (
                                    <div
                                        key={s.titik_id}
                                        className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-3"
                                    >
                                        <span className="text-sm text-gray-600">
                                            {s.titik}
                                        </span>

                                        <span
                                            className={`whitespace-nowrap text-sm font-semibold ${
                                                s.stok < 0
                                                    ? "text-red-600"
                                                    : "text-gray-800"
                                            }`}
                                        >
                                            {Number(s.stok).toLocaleString(
                                                "id-ID",
                                            )}{" "}
                                            {bahanBaku.satuan}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
