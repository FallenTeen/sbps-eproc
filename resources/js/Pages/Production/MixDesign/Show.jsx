import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Pencil, Trash2, Sparkles } from "lucide-react";

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
        if (!confirm(`Generate resep dari template "${mixDesign.mutu_beton}" ke produk yang dipilih? Item resep lama tidak akan dihapus otomatis.`)) return;

        setLoading(true);
        router.post(route("production.mix-design.generate-resep", { mixDesign: mixDesign.id, produk: selectedProdukId }), {}, {
            onFinish: () => setLoading(false),
        });
    };

    const handleDelete = () => {
        if (confirm(`Hapus template "${mixDesign.mutu_beton}"?`)) {
            router.delete(route("production.mix-design.destroy", mixDesign.id));
        }
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href={route("production.mix-design.index")} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{mixDesign.mutu_beton}</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {mixDesign.mutu_beton}{mixDesign.nama ? ` — ${mixDesign.nama}` : ""}
                            </h1>
                        </div>
                        {mixDesign.deskripsi && <p className="text-sm text-gray-500 mt-1 ml-13">{mixDesign.deskripsi}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={route("production.mix-design.edit", mixDesign.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors">
                        <Pencil className="w-4 h-4" /> Edit
                    </Link>
                    <button onClick={handleDelete}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Komposisi Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-gray-800">Komposisi Bahan Baku</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Jumlah per m³ campuran beton mutu {mixDesign.mutu_beton}</p>
                        </div>
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["#", "Bahan Baku", "Kode", "Satuan", "Jumlah / m³"].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(mixDesign.items || []).length === 0 ? (
                                    <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">Belum ada item komposisi.</td></tr>
                                ) : (mixDesign.items || []).map((item, i) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3.5 text-sm text-gray-400">{i + 1}</td>
                                        <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{item.bahan_baku?.nama}</td>
                                        <td className="px-5 py-3.5 text-sm text-gray-500">{item.bahan_baku?.kode}</td>
                                        <td className="px-5 py-3.5 text-sm text-gray-500">{item.bahan_baku?.satuan}</td>
                                        <td className="px-5 py-3.5 text-sm font-bold text-gray-800">{formatNum(item.jumlah_per_m3)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Generate Resep Card */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-md sticky top-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-blue-200" />
                            <h3 className="text-base font-semibold">Generate Resep ke Produk</h3>
                        </div>
                        <p className="text-sm text-blue-100 mb-5">
                            Salin semua item komposisi template ini sebagai resep/BOM pada produk beton yang dipilih.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-blue-200 mb-1.5">Pilih Produk Target *</label>
                                <select value={selectedProdukId} onChange={(e) => setSelectedProdukId(e.target.value)}
                                    className="w-full rounded-lg border border-blue-400 bg-blue-500/50 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-blue-200">
                                    <option value="" className="text-gray-800">-- Pilih Produk --</option>
                                    {produks.map((p) => (
                                        <option key={p.id} value={p.id} className="text-gray-800">{p.nama}</option>
                                    ))}
                                </select>
                            </div>

                            <button onClick={handleGenerateResep} disabled={loading || !selectedProdukId}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <Sparkles className="w-4 h-4" />
                                {loading ? "Memproses..." : "Generate Resep Sekarang"}
                            </button>
                        </div>

                        <p className="text-xs text-blue-200 mt-4">
                            ⚠️ Item resep yang sudah ada pada produk tidak akan dihapus secara otomatis.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
