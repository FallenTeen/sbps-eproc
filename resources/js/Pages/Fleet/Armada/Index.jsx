import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Plus, Search, Truck } from "lucide-react";

const JENIS = {
    dump_truck: "Dump Truck",
    dump_truck_tronton: "Dump Truck Tronton",
    self_loader: "Self Loader",
    alat_berat: "Alat Berat",
    truck_molen: "Truck Molen",
    lainnya: "Lainnya",
};

const MODEL_TARIF = {
    ritase: "Ritase",
    sewa_jam: "Sewa / Jam",
    internal: "Internal",
};

const STATUS = {
    aktif: "bg-green-200 text-green-800",
    servis: "bg-yellow-200 text-yellow-800",
    nonaktif: "bg-red-200 text-red-800",
};

export default function Index({ armadas, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [jenis, setJenis] = useState(filters.jenis || "");

    const handleSearch = () => {
        router.get(route("fleet.armada.index"), { search, status, jenis });
    };

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setJenis("");
        router.get(route("fleet.armada.index"));
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Armada</h1>
                <Link
                    href={route("fleet.armada.create")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Armada
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
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
                                placeholder="Cari kode unit / plat nomor..."
                                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                            Jenis
                        </label>
                        <select
                            value={jenis}
                            onChange={(e) => setJenis(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua</option>
                            {Object.entries(JENIS).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua</option>
                            <option value="aktif">Aktif</option>
                            <option value="servis">Servis</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                    >
                        Terapkan
                    </button>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Plat Nomor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Jenis
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Model Tarif
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unit Bisnis
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Titik
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Driver
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {armadas.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Tidak ada data
                                </td>
                            </tr>
                        ) : (
                            armadas.data.map((armada) => (
                                <tr key={armada.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {armada.kode_unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {armada.plat_nomor || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {JENIS[armada.jenis] || armada.jenis}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {MODEL_TARIF[armada.model_tarif] ||
                                            armada.model_tarif}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {armada.unit_bisnis?.nama || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {armada.titik?.nama || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {armada.current_driver?.karyawan?.nama ||
                                            "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS[armada.status] || "bg-gray-200 text-gray-800"}`}
                                        >
                                            {armada.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link
                                            href={route(
                                                "fleet.armada.show",
                                                armada.id,
                                            )}
                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                        >
                                            <Truck className="w-4 h-4" />
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
                    Menampilkan {armadas.from || 0} - {armadas.to || 0} dari{" "}
                    {armadas.total || 0} data
                </div>
                <div className="flex gap-2">
                    {armadas.links &&
                        armadas.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 border rounded ${link.active ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
                                disabled={!link.url}
                            />
                        ))}
                </div>
            </div>
        </Layout>
    );
}
