import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Plus, ChevronDown, ChevronUp, Trash2, Pencil, Sparkles } from "lucide-react";

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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mix Design Template</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Komposisi standar campuran beton per m³ (Khusus CBP)</p>
                </div>
                <Link href={route("production.mix-design.create")}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Buat Template Baru
                </Link>
            </div>

            {mixDesigns.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                    <Sparkles className="w-12 h-12 text-blue-200 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Belum ada template mix design.</p>
                    <Link href={route("production.mix-design.create")} className="mt-3 inline-block text-sm text-blue-600 hover:underline font-medium">
                        Buat template pertama →
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {mixDesigns.map((md) => (
                        <div key={md.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5">
                                <button onClick={() => setOpenId(openId === md.id ? null : md.id)}
                                    className="flex items-center gap-4 flex-1 text-left">
                                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                                        <span className="text-white font-bold text-xs">{md.mutu_beton}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{md.mutu_beton} {md.nama ? `— ${md.nama}` : ""}</p>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {md.items?.length || 0} komponen · {md.deskripsi || "Tanpa deskripsi"}
                                        </p>
                                    </div>
                                    <div className="ml-auto mr-4">
                                        {openId === md.id
                                            ? <ChevronUp className="w-5 h-5 text-gray-400" />
                                            : <ChevronDown className="w-5 h-5 text-gray-400" />
                                        }
                                    </div>
                                </button>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link href={route("production.mix-design.edit", md.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors">
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </Link>
                                    <button onClick={() => handleDelete(md)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                    </button>
                                </div>
                            </div>

                            {/* Expandable Detail */}
                            {openId === md.id && (
                                <div className="border-t border-gray-100 p-5">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50 rounded-lg">
                                            <tr>
                                                {["Bahan Baku", "Kode", "Satuan", "Jumlah / m³"].map(h => (
                                                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {(md.items || []).length === 0 ? (
                                                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">Belum ada item komposisi.</td></tr>
                                            ) : (md.items || []).map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.bahan_baku?.nama}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.bahan_baku?.kode}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.bahan_baku?.satuan}</td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatNum(item.jumlah_per_m3)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="mt-4 flex justify-end">
                                        <Link href={route("production.mix-design.show", md.id)}
                                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                                            Detail & Generate Resep →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
}
