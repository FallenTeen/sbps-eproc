import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Plus, Trash2, SearchX } from "lucide-react";
import TitikSelectorWithMap from "@/Components/TitikSelectorWithMap";
import { formatTanggal } from "@/utils/date";

export default function Index({ opnames, titiks, filters }) {
    const { auth } = usePage().props;
    const permissions = auth?.permissions || [];
    const canManage = permissions.includes("manage stok opname") || permissions.includes("manage procurement");

    const [tanggal, setTanggal] = useState(filters.tanggal || "");
    const [titikId, setTitikId] = useState(filters.titik_id || "");
    const [kategori, setKategori] = useState(filters.kategori || "");

    const apply = () => {
        router.get(route("inventory.stok-opname.index"), {
            tanggal: tanggal || undefined,
            titik_id: titikId || undefined,
            kategori: kategori || undefined,
        });
    };

    const clear = () => {
        setTanggal("");
        setTitikId("");
        setKategori("");
        router.get(route("inventory.stok-opname.index"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Stok Opname" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stok Opname</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Checklist inventarisasi: cocokkan saldo sistem vs saldo fisik
                    </p>
                </div>
                {canManage && (
                    <Link
                        href={route("inventory.stok-opname.create")}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Catat Opname
                    </Link>
                )}
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>
                    <div>
                        <TitikSelectorWithMap
                            titiks={titiks}
                            value={titikId}
                            onChange={(val) => setTitikId(val)}
                            label="Titik"
                            placeholder="Semua Titik"
                            optionFormatter={(t) => t.nama}
                            mapHeight="240px"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                            value={kategori}
                            onChange={(e) => setKategori(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Semua</option>
                            <option value="bahan_baku">Bahan Baku</option>
                            <option value="sparepart">Sparepart</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={apply}
                            className="flex-1 bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-700"
                        >
                            Terapkan
                        </button>
                        <button
                            onClick={clear}
                            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-100 inline-flex items-center justify-center gap-1"
                        >
                            <SearchX className="w-4 h-4" /> Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Kategori</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Titik</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Saldo Sistem</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Saldo Fisik</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Selisih</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Dicatat</th>
                            {canManage && (
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Aksi</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {opnames.data.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 9 : 8} className="px-6 py-8 text-center text-sm text-gray-500">
                                    Belum ada stok opname yang cocok dengan filter.
                                </td>
                            </tr>
                        ) : (
                            opnames.data.map((o) => (
                                <tr key={o.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTanggal(o.tanggal)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {o.bahan_baku?.nama}
                                        <span className="block text-xs text-gray-400">{o.bahan_baku?.kode}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                o.bahan_baku?.kategori === "sparepart"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-blue-100 text-blue-700"
                                            }`}
                                        >
                                            {o.bahan_baku?.kategori === "sparepart" ? "Sparepart" : "Bahan Baku"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{o.titik?.nama || "-"}</td>
                                    <td className="px-6 py-4 text-right text-sm tabular-nums">{o.saldo_sistem}</td>
                                    <td className="px-6 py-4 text-right text-sm tabular-nums">{o.saldo_fisik}</td>
                                    <td className="px-6 py-4 text-right text-sm font-semibold tabular-nums">
                                        <span className={o.selisih === 0 ? "text-gray-500" : o.selisih > 0 ? "text-green-600" : "text-red-600"}>
                                            {o.selisih > 0 ? "+" : ""}
                                            {o.selisih}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{o.dicatat_oleh?.name || "-"}</td>
                                    {canManage && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Hapus baris opname ini?")) {
                                                        router.delete(route("inventory.stok-opname.destroy", o.id));
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900 inline-flex"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {opnames.from || 0} - {opnames.to || 0} dari {opnames.total || 0} data
                </div>
                <div className="flex gap-2">
                    {opnames.links &&
                        opnames.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 border rounded ${link.active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100"}`}
                                disabled={!link.url}
                            />
                        ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}