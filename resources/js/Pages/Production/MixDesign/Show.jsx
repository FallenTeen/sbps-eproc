import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Sparkles,
    Layers,
    AlertTriangle,
} from "lucide-react";

function formatNum(n, dec = 3) {
    return Number(n).toLocaleString("id-ID", { maximumFractionDigits: dec });
}

export default function Show({ mixDesign, produks }) {
    const [selectedProdukId, setSelectedProdukId] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerateResep = () => {
        if (!selectedProdukId) {
            alert("Pilih produk target terlebih dahulu.");
            return;
        }
        if (
            !confirm(
                `Generate resep dari template "${mixDesign.mutu_beton}" ke produk yang dipilih? Item resep lama tidak akan dihapus otomatis.`,
            )
        )
            return;

        setLoading(true);
        router.post(
            route("production.mix-design.generate-resep", {
                mixDesign: mixDesign.id,
                produk: selectedProdukId,
            }),
            {},
            {
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleDelete = () => {
        if (confirm(`Hapus template "${mixDesign.mutu_beton}"?`)) {
            router.delete(route("production.mix-design.destroy", mixDesign.id));
        }
    };

    return (
        <Layout>
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
                            <span className="text-center text-xs font-bold text-white">
                                {mixDesign.mutu_beton}
                            </span>
                        </div>

                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                {mixDesign.mutu_beton}
                                {mixDesign.nama ? ` — ${mixDesign.nama}` : ""}
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Detail template mix design dan komposisi bahan
                                baku untuk campuran beton.
                            </p>

                            {mixDesign.deskripsi && (
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                                    {mixDesign.deskripsi}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Link
                            href={route("production.mix-design.index")}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Link>

                        <Link
                            href={route(
                                "production.mix-design.edit",
                                mixDesign.id,
                            )}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-600 transition hover:bg-amber-100"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Link>

                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                        >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                    {/* Komposisi Bahan Baku */}
                    <div className="min-w-0 lg:col-span-2">
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Layers className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-gray-900">
                                            Komposisi Bahan Baku
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Kebutuhan bahan untuk setiap m³
                                            campuran beton mutu{" "}
                                            {mixDesign.mutu_beton}.
                                        </p>
                                    </div>
                                </div>

                                <span className="inline-flex w-fit items-center rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-600">
                                    {(mixDesign.items || []).length} bahan
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {[
                                                "#",
                                                "Bahan Baku",
                                                "Kode",
                                                "Satuan",
                                                "Jumlah / m³",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {(mixDesign.items || []).length ===
                                        0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-5 py-12 text-center"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                                            <Layers className="h-6 w-6" />
                                                        </div>

                                                        <p className="mt-3 text-sm font-semibold text-gray-700">
                                                            Belum ada komposisi
                                                            bahan
                                                        </p>

                                                        <p className="mt-1 text-sm text-gray-500">
                                                            Tambahkan bahan baku
                                                            melalui halaman edit
                                                            template.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            (mixDesign.items || []).map(
                                                (item, i) => (
                                                    <tr
                                                        key={item.id}
                                                        className="transition-colors hover:bg-gray-50"
                                                    >
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-400">
                                                            {i + 1}
                                                        </td>

                                                        <td className="min-w-40 px-5 py-4">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {item.bahan_baku
                                                                    ?.nama ??
                                                                    "-"}
                                                            </p>
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                                                            {item.bahan_baku
                                                                ?.kode ?? "-"}
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                                                            {item.bahan_baku
                                                                ?.satuan ?? "-"}
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold tabular-nums text-gray-800">
                                                            {formatNum(
                                                                item.jumlah_per_m3,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {(mixDesign.items || []).length > 0 && (
                                <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4">
                                    <p className="text-xs leading-5 text-gray-500">
                                        Jumlah bahan di atas merupakan kebutuhan
                                        berdasarkan satuan masing-masing bahan
                                        untuk setiap 1 m³ campuran beton.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Generate Resep */}
                    <div className="min-w-0 lg:col-span-1">
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>

                                <h2 className="mt-4 text-lg font-bold">
                                    Generate Resep ke Produk
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-blue-100">
                                    Salin komposisi bahan dari template ini
                                    sebagai resep atau Bill of Materials (BOM)
                                    pada produk beton yang dipilih.
                                </p>
                            </div>

                            <div className="space-y-5 p-6">
                                <div>
                                    <label
                                        htmlFor="produk-target"
                                        className="mb-2 block text-sm font-semibold text-gray-700"
                                    >
                                        Produk Target{" "}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        id="produk-target"
                                        value={selectedProdukId}
                                        onChange={(e) =>
                                            setSelectedProdukId(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            -- Pilih Produk --
                                        </option>

                                        {produks.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGenerateResep}
                                    disabled={loading || !selectedProdukId}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {loading
                                        ? "Memproses..."
                                        : "Generate Resep Sekarang"}
                                </button>

                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-start gap-2.5">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                                        <p className="text-xs leading-5 text-amber-800">
                                            Item resep yang sudah ada pada
                                            produk tidak akan dihapus secara
                                            otomatis. Periksa komposisi produk
                                            setelah proses generate selesai.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
