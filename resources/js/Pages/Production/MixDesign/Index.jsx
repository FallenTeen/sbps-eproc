import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    Plus,
    ChevronDown,
    ChevronUp,
    Trash2,
    Pencil,
    Sparkles,
    ArrowRight,
    Edit,
} from "lucide-react";

function formatNum(n, dec = 3) {
    return Number(n).toLocaleString("id-ID", { maximumFractionDigits: dec });
}

export default function Index({ mixDesigns }) {
    const [openId, setOpenId] = useState(null);

    const handleDelete = (md) => {
        if (confirm(`Hapus template Mix Design "${md.mutu_beton}"?`)) {
            router.delete(route("production.mix-design.destroy", md.id));
        }
    };

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Mix Design Template
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Komposisi standar campuran beton per m³ (Khusus CBP)
                    </p>
                </div>

                <Link
                    href={route("production.mix-design.create")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Buat Template Baru
                </Link>
            </div>

            {/* Empty State */}
            {mixDesigns.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                        <Sparkles className="h-7 w-7 text-blue-600" />
                    </div>

                    <h2 className="mt-4 text-base font-semibold text-gray-900">
                        Belum Ada Template Mix Design
                    </h2>

                    <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                        Buat template komposisi beton untuk mempermudah proses
                        produksi dan menghasilkan resep campuran.
                    </p>

                    <Link
                        href={route("production.mix-design.create")}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Buat Template Pertama
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Daftar Template */}
                    {mixDesigns.map((md) => {
                        const isOpen = openId === md.id;
                        const items = md.items || [];

                        return (
                            <div
                                key={md.id}
                                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                                    isOpen
                                        ? "border-blue-200 ring-1 ring-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                {/* Template Header */}
                                <div className="p-4 sm:p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        {/* Tombol Accordion */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenId(isOpen ? null : md.id)
                                            }
                                            aria-expanded={isOpen}
                                            aria-label={`${
                                                isOpen ? "Tutup" : "Buka"
                                            } komposisi ${md.mutu_beton}`}
                                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                        >
                                            {/* Badge Mutu Beton */}
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                                <span className="text-xs font-bold">
                                                    {md.mutu_beton}
                                                </span>
                                            </div>

                                            {/* Informasi Template */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="font-semibold text-gray-900">
                                                        {md.mutu_beton}
                                                    </h2>

                                                    {md.nama && (
                                                        <span className="text-sm text-gray-600">
                                                            — {md.nama}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                                    {md.deskripsi ||
                                                        "Tanpa deskripsi"}
                                                </p>

                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-600">
                                                        {items.length} komponen
                                                    </span>

                                                    <span className="text-xs text-gray-400">
                                                        per m³
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Ikon Dropdown */}
                                            <div className="ml-1 shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
                                                {isOpen ? (
                                                    <ChevronUp className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Tombol Aksi */}
                                        <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                                            <Link
                                                href={route(
                                                    "production.mix-design.edit",
                                                    md.id,
                                                )}
                                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 sm:flex-none"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                Edit
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(md)}
                                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 sm:flex-none"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Detail Accordion */}
                                {isOpen && (
                                    <div className="border-t border-gray-200 bg-gray-50/50">
                                        {/* Judul Detail */}
                                        <div className="flex flex-col gap-1 px-4 py-4 sm:px-5">
                                            <h3 className="text-sm font-semibold text-gray-800">
                                                Komposisi Bahan Baku
                                            </h3>

                                            <p className="text-xs text-gray-500">
                                                Rincian kebutuhan material untuk
                                                setiap 1 m³ campuran beton.
                                            </p>
                                        </div>

                                        {/* Tabel */}
                                        <div className="overflow-x-auto border-y border-gray-200 bg-white">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        {[
                                                            "Bahan Baku",
                                                            "Kode",
                                                            "Satuan",
                                                            "Jumlah / m³",
                                                        ].map((heading) => (
                                                            <th
                                                                key={heading}
                                                                className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                                                                    heading ===
                                                                    "Jumlah / m³"
                                                                        ? "text-right"
                                                                        : "text-left"
                                                                }`}
                                                            >
                                                                {heading}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-gray-100">
                                                    {items.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="px-4 py-10 text-center"
                                                            >
                                                                <div className="flex flex-col items-center">
                                                                    <Sparkles className="h-7 w-7 text-gray-300" />

                                                                    <p className="mt-2 text-sm font-medium text-gray-600">
                                                                        Belum
                                                                        Ada
                                                                        Komposisi
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-gray-400">
                                                                        Template
                                                                        ini
                                                                        belum
                                                                        memiliki
                                                                        bahan
                                                                        baku.
                                                                    </p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        items.map((item) => (
                                                            <tr
                                                                key={item.id}
                                                                className="transition hover:bg-blue-50/40"
                                                            >
                                                                <td className="whitespace-nowrap px-4 py-3.5">
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {item
                                                                            .bahan_baku
                                                                            ?.nama ||
                                                                            "-"}
                                                                    </span>
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                                                                    {item
                                                                        .bahan_baku
                                                                        ?.kode ||
                                                                        "-"}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                                                                    {item
                                                                        .bahan_baku
                                                                        ?.satuan ||
                                                                        "-"}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                                                    <span className="font-mono text-sm font-semibold tabular-nums text-gray-800">
                                                                        {formatNum(
                                                                            item.jumlah_per_m3,
                                                                        )}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Footer Detail */}
                                        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                            <p className="text-xs text-gray-500">
                                                Total {items.length} komponen
                                                bahan baku
                                            </p>

                                            <Link
                                                href={route(
                                                    "production.mix-design.show",
                                                    md.id,
                                                )}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                            >
                                                Detail & Generate Resep
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}
