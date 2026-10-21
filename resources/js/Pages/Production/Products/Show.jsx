import React, { useState } from "react";
import { Link, useForm, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Pencil, Trash2, Plus, Tag, BookOpen, Edit } from "lucide-react";
import { formatTanggal } from "@/utils/date";

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(n || 0);
}

const TABS = [
    { key: "info", label: "Informasi", icon: BookOpen },
    { key: "harga", label: "Harga Jual", icon: Tag },
    { key: "resep", label: "Resep / BOM", icon: BookOpen },
];

export default function Show({ produk }) {
    const [activeTab, setActiveTab] = useState("info");
    const { delete: destroy } = useForm();

    // Harga Form
    const hargaForm = useForm({
        harga: "",
        berlaku_dari: new Date().toISOString().slice(0, 10),
    });

    const handleDeleteProduk = () => {
        if (confirm(`Hapus produk "${produk.nama}"?`)) {
            destroy(route("production.produk.destroy", produk.id));
        }
    };

    const handleAddHarga = (e) => {
        e.preventDefault();
        hargaForm.post(route("production.produk.set-harga", produk.id), {
            onSuccess: () => hargaForm.reset(),
        });
    };

    const handleDeleteResep = (resepId) => {
        if (confirm("Hapus item resep ini?")) {
            router.delete(route("production.resep.destroy", resepId));
        }
    };

    return (
        <Layout>
            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="break-words text-2xl font-bold tracking-tight text-gray-900">
                                    {produk.nama}
                                </h1>
                                <div>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            produk.aktif
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {produk.aktif ? "AKTIF" : "NONAKTIF"}
                                    </span>
                                </div>
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                                {produk.kategori?.replace("_", " ")}{" "}
                                <span className="mx-1 text-gray-300">·</span>
                                {produk.satuan_output}
                                <span className="mx-1 text-gray-300">·</span>
                                {produk.unit_bisnis?.nama}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                        <Link
                            href={route("production.produk.index")}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Kembali
                        </Link>
                        <Link
                            href={route("production.produk.edit", produk.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Link>

                        <button
                            type="button"
                            onClick={handleDeleteProduk}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav
                        className="-mb-px flex gap-1 overflow-x-auto"
                        aria-label="Tab detail produk"
                    >
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                                    activeTab === tab.key
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Informasi */}
                {activeTab === "info" && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                            <h2 className="text-base font-semibold text-gray-900">
                                Informasi Produk
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Ringkasan informasi dan status produk.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
                            <DField label="Nama Produk" value={produk.nama} />

                            <DField
                                label="Kategori"
                                value={produk.kategori?.replace("_", " ")}
                            />

                            <DField
                                label="Satuan Output"
                                value={produk.satuan_output}
                            />

                            <DField
                                label="Unit Bisnis"
                                value={produk.unit_bisnis?.nama}
                            />

                            <DField
                                label="Status"
                                value={
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            produk.aktif
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {produk.aktif ? "Aktif" : "Nonaktif"}
                                    </span>
                                }
                            />

                            <DField
                                label="Item Resep"
                                value={`${produk.resep_produksis?.length || 0} bahan baku`}
                            />
                        </div>
                    </div>
                )}

                {/* Tab Harga Jual */}
                {activeTab === "harga" && (
                    <div className="space-y-6">
                        {/* Form Tambah Harga */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5">
                                <h2 className="text-base font-semibold text-gray-900">
                                    Tambah Harga Baru
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Masukkan harga jual dan tanggal mulai
                                    berlakunya.
                                </p>
                            </div>

                            <form onSubmit={handleAddHarga}>
                                <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Harga Jual (Rp /{" "}
                                            {produk.satuan_output}){" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={hargaForm.data.harga}
                                            onChange={(e) =>
                                                hargaForm.setData(
                                                    "harga",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: 850000"
                                            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                hargaForm.errors.harga
                                                    ? "border-red-400 focus:ring-red-200"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />

                                        {hargaForm.errors.harga && (
                                            <p className="mt-1.5 text-xs text-red-500">
                                                {hargaForm.errors.harga}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Berlaku Dari{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="date"
                                            value={hargaForm.data.berlaku_dari}
                                            onChange={(e) =>
                                                hargaForm.setData(
                                                    "berlaku_dari",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                hargaForm.errors.berlaku_dari
                                                    ? "border-red-400 focus:ring-red-200"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />

                                        {hargaForm.errors.berlaku_dari && (
                                            <p className="mt-1.5 text-xs text-red-500">
                                                {hargaForm.errors.berlaku_dari}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:pt-6">
                                        <button
                                            type="submit"
                                            disabled={hargaForm.processing}
                                            className="inline-flex items-center gap-1.5 px-2 py-3 text-xs font-bold uppercase tracking-widest text-white hover:text-white bg-blue-600 border-2 border-black hover:bg-gray-900 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {hargaForm.processing
                                                ? "Menyimpan..."
                                                : "Tambah Harga"}
                                        </button>
                                    </div>
                                </div>

                                <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
                                    <span className="font-semibold">
                                        Catatan:
                                    </span>{" "}
                                    Harga lama yang masih aktif akan otomatis
                                    ditutup pada tanggal sebelum harga baru
                                    berlaku.
                                </p>
                            </form>
                        </div>

                        {/* Histori Harga */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                                <h2 className="text-base font-semibold text-gray-900">
                                    Histori Harga Jual
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Daftar perubahan harga jual produk.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {[
                                                "Harga (Rp)",
                                                "Berlaku Dari",
                                                "Berlaku Sampai",
                                                "Status",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {(produk.harga_jual || []).length ===
                                        0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-5 py-10 text-center text-sm text-gray-500"
                                                >
                                                    Belum ada histori harga.
                                                </td>
                                            </tr>
                                        ) : (
                                            (produk.harga_jual || []).map(
                                                (h) => {
                                                    const today = new Date();
                                                    const dari = new Date(
                                                        h.berlaku_dari,
                                                    );
                                                    const sampai =
                                                        h.berlaku_sampai
                                                            ? new Date(
                                                                  h.berlaku_sampai,
                                                              )
                                                            : null;
                                                    const isAktif =
                                                        dari <= today &&
                                                        (!sampai ||
                                                            sampai >= today);

                                                    return (
                                                        <tr
                                                            key={h.id}
                                                            className={`transition-colors hover:bg-gray-50 ${
                                                                isAktif
                                                                    ? "bg-emerald-50/30"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                                                                {formatRupiah(
                                                                    h.harga,
                                                                )}
                                                            </td>

                                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                                {formatTanggal(
                                                                    h.berlaku_dari,
                                                                )}
                                                            </td>

                                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                                {h.berlaku_sampai ? (
                                                                    formatTanggal(
                                                                        h.berlaku_sampai,
                                                                    )
                                                                ) : (
                                                                    <span className="italic text-gray-400">
                                                                        Tidak
                                                                        dibatasi
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="whitespace-nowrap px-5 py-4">
                                                                {isAktif ? (
                                                                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                                        AKTIF
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-500">
                                                                        KADALUARSA
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Resep / BOM */}
                {activeTab === "resep" && (
                    <div className="space-y-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">
                                    Resep Produksi / BOM
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Komposisi bahan baku per{" "}
                                    {produk.satuan_output} output.
                                </p>
                            </div>

                            <Link
                                href={route(
                                    "production.resep.create",
                                    produk.id,
                                )}
                                className="inline-flex items-center gap-1.5 px-2 py-3 text-xs font-bold uppercase tracking-widest text-white hover:text-white bg-blue-600 border-2 border-black hover:bg-gray-900 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Bahan
                            </Link>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {[
                                                "#",
                                                "Bahan Baku",
                                                "Satuan",
                                                "Jumlah per " +
                                                    produk.satuan_output,
                                                "Aksi",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {(produk.resep_produksis || [])
                                            .length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-5 py-10 text-center"
                                                >
                                                    <p className="text-sm text-gray-500">
                                                        Belum ada resep
                                                        produksi.
                                                    </p>
                                                    <Link
                                                        href={route(
                                                            "production.resep.create",
                                                            produk.id,
                                                        )}
                                                        className="mt-2 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        Tambah bahan baku
                                                        pertama
                                                    </Link>
                                                </td>
                                            </tr>
                                        ) : (
                                            (produk.resep_produksis || []).map(
                                                (item, i) => (
                                                    <tr
                                                        key={item.id}
                                                        className="transition-colors hover:bg-gray-50"
                                                    >
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-400">
                                                            {i + 1}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {
                                                                    item
                                                                        .bahan_baku
                                                                        ?.nama
                                                                }
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-gray-500">
                                                                {
                                                                    item
                                                                        .bahan_baku
                                                                        ?.kode
                                                                }
                                                            </p>
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                            {
                                                                item.bahan_baku
                                                                    ?.satuan
                                                            }
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-800">
                                                            {
                                                                item.jumlah_per_unit_output
                                                            }
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Link
                                                                    href={route("production.resep.edit", item.id)}
                                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 transition-colors hover:text-amber-800"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    Edit
                                                                </Link>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteResep(item.id)}
                                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 transition-colors hover:text-red-800"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        )}
                                    </tbody>

                                    {(produk.resep_produksis || []).length >
                                        0 && (
                                        <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-5 py-4 text-sm font-semibold text-gray-600"
                                                >
                                                    Total Bahan
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-green-500">
                                                    {(
                                                        produk.resep_produksis ||
                                                        []
                                                    )
                                                        .reduce(
                                                            (sum, r) =>
                                                                sum +
                                                                (r.jumlah_per_unit_output ||
                                                                    0),
                                                            0,
                                                        )
                                                        .toFixed(3)}{" "}
                                                    (total qty)
                                                </td>

                                                <td />
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

function DField({ label, value }) {
    return (
        <div className="grid grid-cols-[9rem_0.75rem_minmax(0,1fr)] items-center gap-2">
            <dt className="text-sm text-gray-500">{label}</dt>
            <span className="text-sm text-gray-500">:</span>
            <dd className="text-left text-sm font-medium text-gray-900">
                {value ?? "-"}
            </dd>
        </div>
    );
}
