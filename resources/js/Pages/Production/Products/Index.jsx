import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Plus, Search, Filter } from "lucide-react";

const KATEGORI_BADGE = {
    beton_cor:   "bg-blue-100 text-blue-700",
    aspal:       "bg-amber-100 text-amber-700",
    agregat:     "bg-stone-100 text-stone-700",
    lainnya:     "bg-gray-100 text-gray-700",
};

function formatRupiah(n) {
    if (!n) return "-";
    return "Rp " + Number(n).toLocaleString("id-ID");
}

function HargaAktif(hargaArr) {
    if (!hargaArr || hargaArr.length === 0) return null;
    const today = new Date();
    return hargaArr.find(h => {
        const dari = new Date(h.berlaku_dari);
        const sampai = h.berlaku_sampai ? new Date(h.berlaku_sampai) : null;
        return dari <= today && (!sampai || sampai >= today);
    });
}

export default function Index({ produks, unitBisnis, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [unitId, setUnitId] = useState(filters.unit_bisnis_id || "");

    const applyFilter = (newSearch = search, newUnit = unitId) => {
        router.get(route("production.produk.index"), {
            search: newSearch,
            unit_bisnis_id: newUnit,
        });
    };

    const clearFilters = () => {
        setSearch(""); setUnitId("");
        router.get(route("production.produk.index"));
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Katalog Produk</h1>
                <Link href={route("production.produk.create")}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Tambah Produk
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[220px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Produk</label>
                        <div className="flex">
                            <input type="text" value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                                placeholder="Nama atau kategori..."
                                className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button onClick={() => applyFilter()}
                                className="border border-l-0 border-gray-300 rounded-r-lg px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <Search className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                    <div className="w-52">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Bisnis</label>
                        <select value={unitId}
                            onChange={(e) => { setUnitId(e.target.value); applyFilter(search, e.target.value); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Semua Unit</option>
                            {unitBisnis.map((ub) => <option key={ub.id} value={ub.id}>{ub.nama}</option>)}
                        </select>
                    </div>
                    <button onClick={clearFilters}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 h-[42px] text-gray-600 transition-colors">
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            {["Nama Produk", "Kategori", "Satuan Output", "Unit Bisnis", "Harga Aktif", "Status", "Aksi"].map(h => (
                                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {produks.data.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Tidak ada produk ditemukan.</td></tr>
                        ) : produks.data.map((p) => {
                            const hargaAktif = HargaAktif(p.harga_jual);
                            return (
                                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-semibold text-gray-900">{p.nama}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${KATEGORI_BADGE[p.kategori] || KATEGORI_BADGE.lainnya}`}>
                                            {p.kategori?.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-600">{p.satuan_output}</td>
                                    <td className="px-5 py-4 text-sm text-gray-600">{p.unit_bisnis?.nama || "-"}</td>
                                    <td className="px-5 py-4 text-sm font-medium text-gray-900">
                                        {hargaAktif ? formatRupiah(hargaAktif.harga) : <span className="text-gray-400 italic text-xs">Belum ada harga</span>}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.aktif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                            {p.aktif ? "AKTIF" : "NONAKTIF"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link href={route("production.produk.show", p.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Detail</Link>
                                            <Link href={route("production.produk.edit", p.id)} className="text-sm text-amber-600 hover:text-amber-800 font-medium">Edit</Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-5 flex justify-between items-center">
                <p className="text-sm text-gray-500">Menampilkan {produks.from || 0}–{produks.to || 0} dari {produks.total || 0} produk</p>
                <div className="flex gap-1">
                    {produks.links?.map((link, i) => (
                        <button key={i} onClick={() => link.url && router.get(link.url)}
                            disabled={!link.url}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-3 py-1.5 rounded border text-sm transition-colors ${link.active ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        />
                    ))}
                </div>
            </div>
        </Layout>
    );
}
