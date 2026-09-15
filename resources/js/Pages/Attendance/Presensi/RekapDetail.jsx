import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Search, Eye, MapPin, Clock } from "lucide-react";

const GROUP_NAMES = {
    hari: "Hari",
    titik: "Titik Kerja",
    proyek: "Proyek",
    karyawan: "Karyawan",
    role: "Role",
};

const getStatusBadge = (status) => {
    const colors = {
        valid: "bg-green-200 text-green-800",
        tidak_valid: "bg-red-200 text-red-800",
        luar_radius: "bg-yellow-200 text-yellow-800",
    };
    return colors[status] || "bg-gray-200 text-gray-800";
};

export default function RekapDetail({ presensis, group_by, group_key, group_label, filters, karyawan }) {
    const [status, setStatus] = useState(filters.status_validasi || "");
    const [karyawanId, setKaryawanId] = useState("");

    const backHref = () => {
        const params = { group_by, from: filters.from || "", to: filters.to || "", status_validasi: filters.status_validasi || "" };
        return route("attendance.presensi.index", params);
    };

    const handleFilter = () => {
        router.get(route("attendance.presensi.rekapDetail"), {
            group_by,
            group_key,
            from: filters.from || "",
            to: filters.to || "",
            status_validasi: status,
            karyawan_id: karyawanId,
        });
    };

    const clearFilters = () => {
        setStatus("");
        setKaryawanId("");
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Presensi • ${GROUP_NAMES[group_by] || "Group"}`} />

            <div className="mb-6">
                <Link
                    href={backHref()}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Index Presensi
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{group_label}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Detail presensi per {GROUP_NAMES[group_by]?.toLowerCase()} — {presensis.total} data
                </p>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Validasi</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Semua</option>
                            <option value="valid">Valid</option>
                            <option value="tidak_valid">Tidak Valid</option>
                            <option value="luar_radius">Luar Radius</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Karyawan</label>
                        <select
                            value={karyawanId}
                            onChange={(e) => setKaryawanId(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Semua</option>
                            {karyawan.map((k) => (
                                <option key={k.id} value={k.id}>{k.nama}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleFilter}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        <Search className="w-4 h-4" />
                        Filter
                    </button>
                    <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Karyawan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Titik</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Check-In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Check-Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Formulir</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {presensis.data.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td>
                            </tr>
                        ) : (
                            presensis.data.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.karyawan?.nama}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {p.titik ? (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-gray-400" />
                                                {p.titik.nama}
                                            </span>
                                        ) : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {p.check_in ? new Date(p.check_in).toLocaleString("id-ID") : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {p.check_out ? (
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                {new Date(p.check_out).toLocaleString("id-ID")}
                                            </span>
                                        ) : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(p.status_validasi)}`}>
                                            {p.status_validasi?.replace(/_/g, " ")}
                                        </span>
                                        {p.catatan_override && (
                                            <p className="text-xs text-gray-500 mt-1">Catatan: {p.catatan_override}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {p.formulir ? "Terkirim" : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link
                                            href={route("attendance.presensi.show", p.id)}
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                                        >
                                            <Eye className="w-4 h-4" />
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
                    Menampilkan {presensis.from || 0} - {presensis.to || 0} dari {presensis.total || 0} data
                </div>
                <div className="flex gap-2">
                    {presensis.links &&
                        presensis.links.map((link, index) => (
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