import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Plus, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function Index({ mesin, filters, unitBisnis, jenisOptions }) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [jenis, setJenis] = useState(filters.jenis || "");
    const [unitBisnisId, setUnitBisnisId] = useState(filters.unit_bisnis_id || "");

    const handleSearch = () => {
        router.get(route("production.mesin.index"), {
            search,
            status,
            jenis,
            unit_bisnis_id: unitBisnisId
        });
    };

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setJenis("");
        setUnitBisnisId("");
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

    // Logika Indikator Servis: Jika servis terakhir > 30 hari yang lalu, anggap jatuh tempo
    const checkServisJatuhTempo = (item) => {
        if (item.status === 'nonaktif') return false;
        if (!item.service_histories || item.service_histories.length === 0) return true; // Belum pernah servis
        
        const lastService = new Date(item.service_histories[0].tanggal);
        const today = new Date();
        const diffTime = Math.abs(today - lastService);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        return diffDays > 30; // 30 hari interval
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
                            Cari
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama/jenis..."
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
                    
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                router.get(route("production.mesin.index"), { search, status: e.target.value, jenis, unit_bisnis_id: unitBisnisId });
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="rusak">Rusak</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                    </div>

                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Mesin</label>
                        <select
                            value={jenis}
                            onChange={(e) => {
                                setJenis(e.target.value);
                                router.get(route("production.mesin.index"), { search, status, jenis: e.target.value, unit_bisnis_id: unitBisnisId });
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua Jenis</option>
                            {jenisOptions.map((j) => (
                                <option key={j} value={j}>{j}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Bisnis</label>
                        <select
                            value={unitBisnisId}
                            onChange={(e) => {
                                setUnitBisnisId(e.target.value);
                                router.get(route("production.mesin.index"), { search, status, jenis, unit_bisnis_id: e.target.value });
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua Unit Bisnis</option>
                            {unitBisnis.map((ub) => (
                                <option key={ub.id} value={ub.id}>{ub.nama}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm transition-colors h-[42px]"
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
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit / Titik</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kapasitas</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status & Servis</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {mesin.data.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    Tidak ada data mesin.
                                </td>
                            </tr>
                        ) : (
                            mesin.data.map((item) => {
                                const isServisJatuhTempo = checkServisJatuhTempo(item);
                                
                                return (
                                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.nama}
                                        {item.produk_default && (
                                            <div className="text-xs text-blue-600 mt-1 font-normal">
                                                Output: {item.produk_default.nama_produk}
                                            </div>
                                        )}
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
                                        <div className="flex flex-col gap-2 items-start">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                            {isServisJatuhTempo ? (
                                                <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Servis Jatuh Tempo
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Servis Aman
                                                </span>
                                            )}
                                        </div>
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
                                );
                            })
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
                                onClick={() => link.url && router.get(link.url, { search, status, jenis, unit_bisnis_id: unitBisnisId })}
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
