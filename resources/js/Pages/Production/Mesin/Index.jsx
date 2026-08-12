import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Plus, Search } from "lucide-react";

export default function Index({ mesin, filters }) {
    const [search, setSearch] = useState(filters.search || "");

    const handleSearch = () => {
        router.get(route("production.mesin.index"), {
            search,
        });
    };

    const clearFilters = () => {
        setSearch("");
        router.get(route("production.mesin.index"));
    };

    const getStatusBadge = (status) => {
        const colors = {
            aktif: "bg-emerald-200 text-emerald-800",
            rusak: "bg-red-200 text-red-800",
            maintenance: "bg-yellow-200 text-yellow-800",
            nonaktif: "bg-gray-200 text-gray-800",
        };
        return colors[status] || "bg-gray-200 text-gray-800";
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Mesin Produksi</h1>
                <Link
                    href={route("production.mesin.create")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Mesin
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cari Mesin
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau jenis..."
                                className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                className="bg-gray-50 border border-l-0 border-gray-300 rounded-r-md px-4 py-2 hover:bg-gray-100 transition-colors"
                            >
                                <Search className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Nama
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Jenis
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Unit Bisnis / Titik
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Kapasitas
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {mesin.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="px-6 py-8 text-center text-gray-500"
                                >
                                    Tidak ada data mesin.
                                </td>
                            </tr>
                        ) : (
                            mesin.data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.nama}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.jenis}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="font-medium text-gray-800">{item.unit_bisnis?.nama}</div>
                                        <div className="text-xs text-gray-500">{item.titik?.nama || "-"}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.kapasitas || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}
                                        >
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link
                                            href={route("production.mesin.show", item.id)}
                                            className="text-blue-600 hover:text-blue-800 font-medium mr-4"
                                        >
                                            Detail
                                        </Link>
                                        <Link
                                            href={route("production.mesin.edit", item.id)}
                                            className="text-amber-600 hover:text-amber-800 font-medium"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {mesin.from || 0} - {mesin.to || 0} dari {mesin.total || 0} data
                </div>
                <div className="flex gap-1">
                    {mesin.links &&
                        mesin.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-4 py-2 border rounded-md text-sm transition-colors ${link.active ? "bg-blue-600 border-blue-600 text-white font-medium" : "hover:bg-gray-50 border-gray-200 text-gray-700"}`}
                                disabled={!link.url}
                            />
                        ))}
                </div>
            </div>
        </Layout>
    );
}
