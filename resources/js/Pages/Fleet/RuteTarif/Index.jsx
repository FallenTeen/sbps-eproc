import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Plus, Search, Edit, Eye, Trash2 } from "lucide-react";

export default function Index({ ruteTarifs, unitBisnis, filters }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || "");
    const [unitFilter, setUnitFilter] = useState(filters.unit_bisnis_id || "");

    const can = (permission) => auth?.permissions?.includes(permission);

    const handleSearch = () => {
        router.get(route("fleet.rute-tarif.index"), {
            search,
            unit_bisnis_id: unitFilter,
        });
    };

    const clearFilters = () => {
        setSearch("");
        setUnitFilter("");
        router.get(route("fleet.rute-tarif.index"));
    };

    const isAktif = (r) => {
        if (!r.berlaku_dari) return false;
        const dari = new Date(r.berlaku_dari);
        const sampai = r.berlaku_sampai ? new Date(r.berlaku_sampai) : null;
        const today = new Date();
        if (today < dari) return false;
        if (sampai && today > sampai) return false;
        return true;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Rute Tarif" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rute Tarif</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Master tarif rute armada per unit bisnis
                    </p>
                </div>
                {can("manage fleet") && (
                    <Link
                        href={route("fleet.rute-tarif.create")}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Rute
                    </Link>
                )}
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder="Cari lokasi asal / tujuan..."
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Bisnis</label>
                        <select
                            value={unitFilter}
                            onChange={(e) => setUnitFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Semua</option>
                            {unitBisnis.map((u) => (
                                <option key={u.id} value={u.id}>{u.nama}</option>
                            ))}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Asal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tujuan</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Jarak (km)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Tarif/Rit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Unit Bisnis</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {ruteTarifs.data.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td>
                            </tr>
                        ) : (
                            ruteTarifs.data.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.lokasi_asal}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.lokasi_tujuan}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{Number(r.jarak_km).toLocaleString("id-ID")}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        Rp {Number(r.tarif_per_rit).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.unit_bisnis?.nama}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isAktif(r) ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                                            {isAktif(r) ? "Berlaku" : "Kadaluarsa"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                        <Link href={route("fleet.rute-tarif.show", r.id)} className="text-blue-600 hover:text-blue-900 inline-block">
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        {can("manage fleet") && (
                                            <Link href={route("fleet.rute-tarif.edit", r.id)} className="text-yellow-600 hover:text-yellow-900 inline-block">
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        )}
                                        {can("manage fleet") && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Yakin hapus rute tarif ini?")) {
                                                        router.delete(route("fleet.rute-tarif.destroy", r.id));
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900 inline-block"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
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
                    Menampilkan {ruteTarifs.from || 0} - {ruteTarifs.to || 0} dari {ruteTarifs.total || 0} data
                </div>
                <div className="flex gap-2">
                    {ruteTarifs.links &&
                        ruteTarifs.links.map((link, index) => (
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