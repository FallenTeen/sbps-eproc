import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Plus, Search, Edit, Eye, Trash2 } from "lucide-react";

export default function Index({ bahanBakus, filters }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || "");

    const permissions = auth?.permissions || [];

    const handleSearch = () => {
        router.get(route("procurement.bahan-baku.index"), { search });
    };

    const clearFilters = () => {
        setSearch("");
        router.get(route("procurement.bahan-baku.index"));
    };

    const can = (permission) => permissions.includes(permission);

    return (
        <AuthenticatedLayout>
            <Head title="Bahan Baku" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bahan Baku</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Master bahan baku & sparepart
                    </p>
                </div>
                {can("manage procurement") && (
                    <Link
                        href={route("procurement.bahan-baku.create")}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Bahan Baku
                    </Link>
                )}
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cari
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder="Cari kode / nama..."
                                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                            />
                            <button
                                onClick={handleSearch}
                                className="bg-gray-50 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 hover:bg-gray-100"
                            >
                                <Search className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Kode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Kategori</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Satuan</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Harga Terakhir</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bahanBakus.data.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                    Tidak ada data
                                </td>
                            </tr>
                        ) : (
                            bahanBakus.data.map((b) => {
                                const harga = b.harga_beli?.[0]?.harga;
                                return (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {b.kode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {b.nama}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {b.kategori === "bahan_baku" ? "Bahan Baku" : "Sparepart"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {b.satuan}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {harga != null
                                                ? "Rp " + Number(harga).toLocaleString("id-ID")
                                                : "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.aktif ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                                                {b.aktif ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                            <Link
                                                href={route("procurement.bahan-baku.show", b.id)}
                                                className="text-blue-600 hover:text-blue-900 inline-block"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            {can("manage procurement") && (
                                                <Link
                                                    href={route("procurement.bahan-baku.edit", b.id)}
                                                    className="text-yellow-600 hover:text-yellow-900 inline-block"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                            )}
                                            {can("manage procurement") && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm("Yakin hapus bahan baku ini?")) {
                                                            router.delete(route("procurement.bahan-baku.destroy", b.id));
                                                        }
                                                    }}
                                                    className="text-red-600 hover:text-red-900 inline-block"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {bahanBakus.from || 0} - {bahanBakus.to || 0} dari{" "}
                    {bahanBakus.total || 0} data
                </div>
                <div className="flex gap-2">
                    {bahanBakus.links &&
                        bahanBakus.links.map((link, index) => (
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