import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Search, MapPin, ClipboardList, Users, Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const GROUP_OPTIONS = [
    { value: "hari", label: "Per Hari" },
    { value: "titik", label: "Per Titik Kerja" },
    { value: "proyek", label: "Per Proyek" },
    { value: "role", label: "Per Role" },
];

export default function Rekap({ summary, groups, filters, titiks }) {
    const [groupBy, setGroupBy] = useState(filters.group_by || "hari");
    const [from, setFrom] = useState(filters.from || "");
    const [to, setTo] = useState(filters.to || "");
    const [titikId, setTitikId] = useState(filters.titik_id || "");
    const [status, setStatus] = useState(filters.status_validasi || "");

    const apply = (overrides = {}) => {
        router.get(route("attendance.presensi.rekap"), {
            group_by: overrides.groupBy ?? groupBy,
            from: overrides.from ?? from,
            to: overrides.to ?? to,
            titik_id: overrides.titikId ?? titikId,
            status_validasi: overrides.status ?? status,
        });
    };

    const handleFilter = () => apply();
    const clearFilters = () => {
        setGroupBy("hari");
        setFrom("");
        setTo("");
        setTitikId("");
        setStatus("");
        router.get(route("attendance.presensi.rekap"));
    };

    const stats = [
        { label: "Total Presensi", value: summary.total ?? 0, icon: ClipboardList, color: "bg-gray-900 text-white" },
        { label: "Karyawan Unik", value: summary.karyawan_uniq ?? 0, icon: Users, color: "bg-blue-600 text-white" },
        { label: "Selesai Check-Out", value: summary.selesai ?? 0, icon: Clock, color: "bg-indigo-600 text-white" },
        { label: "Valid", value: summary.valid ?? 0, icon: CheckCircle2, color: "bg-green-600 text-white" },
        { label: "Luar Radius", value: summary.luar_radius ?? 0, icon: AlertTriangle, color: "bg-yellow-500 text-white" },
        { label: "Tidak Valid", value: summary.tidak_valid ?? 0, icon: XCircle, color: "bg-red-600 text-white" },
    ];

    const totalDiterapkan = (summary.valid ?? 0) + (summary.luar_radius ?? 0) + (summary.tidak_valid ?? 0);

    return (
        <AuthenticatedLayout>
            <Head title="Rekap Presensi" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Rekap Presensi</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Index absensi dikelompokkan per hari, titik kerja, proyek, atau role
                </p>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 ${stat.color}`}>
                            <stat.icon className="w-4 h-4" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kelompok</label>
                        <select
                            value={groupBy}
                            onChange={(e) => {
                                setGroupBy(e.target.value);
                                apply({ groupBy: e.target.value });
                            }}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            {GROUP_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dari</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sampai</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titik Kerja</label>
                        <select
                            value={titikId}
                            onChange={(e) => setTitikId(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Semua</option>
                            {titiks.map((t) => (
                                <option key={t.id} value={t.id}>{t.nama}</option>
                            ))}
                        </select>
                    </div>
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

            {/* Tabel kelompok */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                {GROUP_OPTIONS.find((o) => o.value === groupBy)?.label}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Selesai</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Valid</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Luar Radius</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tidak Valid</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {groups.length === 0 || summary.total === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    Tidak ada data presensi pada rentang yang dipilih
                                </td>
                            </tr>
                        ) : (
                            groups.map((g) => (
                                <tr key={g.key} className={g.total === 0 ? "bg-gray-50" : "hover:bg-gray-50"}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{g.label}</div>
                                        {g.parent && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-gray-400" />
                                                    {g.parent}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{g.total}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{g.selesai}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            {g.valid}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                            {g.luar_radius}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            {g.tidak_valid}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-500">
                {totalDiterapkan > 0 && summary.total > 0
                    ? `${totalDiterapkan} dari ${summary.total} presensi pada rentang ini telah divalidasi`
                    : ""}
            </div>
        </AuthenticatedLayout>
    );
}