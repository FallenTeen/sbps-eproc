import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Plus, Search } from "lucide-react";

export default function Index({ pos, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");

    const handleSearch = () => {
        router.get(route("procurement.purchase-orders.index"), {
            search,
            status,
        });
    };

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        router.get(route("procurement.purchase-orders.index"));
    };

    const getStatusBadge = (status) => {
        const colors = {
            draft: "bg-gray-200 text-gray-800",
            diajukan: "bg-yellow-200 text-yellow-800",
            menunggu_approval_finance: "bg-blue-200 text-blue-800",
            menunggu_approval_owner: "bg-purple-200 text-purple-800",
            disetujui: "bg-green-200 text-green-800",
            diterima: "bg-indigo-200 text-indigo-800",
            dibayar_sebagian: "bg-orange-200 text-orange-800",
            lunas: "bg-emerald-200 text-emerald-800",
            ditolak: "bg-red-200 text-red-800",
        };
        return colors[status] || "bg-gray-200 text-gray-800";
    };

    return (
        <AuthenticatedLayout>
            <Head title="Purchase Orders" />

            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                    <p className="mt-1 text-sm text-gray-500">Kelola semua purchase order pengadaan</p>
                </div>
                <Link
                    href={route("procurement.purchase-orders.create")}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Buat PO
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
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
                                placeholder="Cari kode PO / supplier..."
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
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Semua</option>
                            <option value="draft">Draft</option>
                            <option value="diajukan">Diajukan</option>
                            <option value="menunggu_approval_finance">
                                Menunggu Finance
                            </option>
                            <option value="menunggu_approval_owner">
                                Menunggu Owner
                            </option>
                            <option value="disetujui">Disetujui</option>
                            <option value="diterima">Diterima</option>
                            <option value="dibayar_sebagian">
                                Dibayar Sebagian
                            </option>
                            <option value="lunas">Lunas</option>
                            <option value="ditolak">Ditolak</option>
                        </select>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Kode
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Supplier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Proyek
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Tanggal
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pos.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Tidak ada data
                                </td>
                            </tr>
                        ) : (
                            pos.data.map((po) => (
                                <tr key={po.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {po.kode_po}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {po.supplier?.nama}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {po.proyek?.nama}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        Rp{" "}
                                        {Number(po.total).toLocaleString(
                                            "id-ID",
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(po.status)}`}
                                        >
                                            {po.status.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(
                                            po.created_at,
                                        ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link
                                            href={route(
                                                "procurement.purchase-orders.show",
                                                po.id,
                                            )}
                                            className="text-gray-900 hover:text-gray-600 underline"
                                        >
                                            Detail
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {pos.from || 0} - {pos.to || 0} dari{" "}
                    {pos.total || 0} data
                </div>
                <div className="flex gap-2">
                    {pos.links &&
                        pos.links.map((link, index) => (
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
