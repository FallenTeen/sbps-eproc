import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";

export default function Index({ produk, resep }) {
    return (
        <AuthenticatedLayout>
            <Head title={`Resep ${produk.nama}`} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        href={route("production.produk.show", produk.id)}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Produk
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Resep Produksi</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {produk.nama} · {produk.kode_produk || ""} · {produk.satuan_output} / output
                    </p>
                </div>
                <Link
                    href={route("production.resep.create", produk.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Item
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Bahan Baku</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Kategori</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Jumlah / Output</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {resep.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    Belum ada item resep. Tambahkan bahan baku untuk produk ini.
                                </td>
                            </tr>
                        ) : (
                            resep.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {r.bahan_baku?.nama}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {r.bahan_baku?.kategori === "bahan_baku" ? "Bahan Baku" : "Sparepart"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        {Number(r.jumlah_per_unit_output).toLocaleString("id-ID")} {r.bahan_baku?.satuan}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                        <Link
                                            href={route("production.resep.edit", r.id)}
                                            className="text-yellow-600 hover:text-yellow-900 inline-block"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Yakin hapus item resep ini?")) {
                                                    router.delete(route("production.resep.destroy", r.id));
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-900 inline-block"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}