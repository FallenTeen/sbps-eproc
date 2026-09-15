import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Plus, Search, Eye, MapPin, Clock, ClipboardList, Users,
    CheckCircle2, AlertTriangle, XCircle, ChevronRight,
} from "lucide-react";

const getStatusBadge = (status) => {
    const colors = {
        valid: "bg-green-200 text-green-800",
        tidak_valid: "bg-red-200 text-red-800",
        luar_radius: "bg-yellow-200 text-yellow-800",
    };
    return colors[status] || "bg-gray-200 text-gray-800";
};

const GROUP_OPTIONS = [
    { value: "", label: "List Individual" },
    { value: "hari", label: "Per Hari" },
    { value: "titik", label: "Per Titik Kerja" },
    { value: "proyek", label: "Per Proyek" },
    { value: "karyawan", label: "Per Karyawan" },
    { value: "role", label: "Per Role" },
];

export default function Index({ mode, summary, groups, presensis, karyawan, titiks, filters }) {
    const isGrouped = mode === "grouped";

    const [groupBy, setGroupBy] = useState(filters.group_by || "");
    const [tanggal, setTanggal] = useState(filters.tanggal || "");
    const [karyawanId, setKaryawanId] = useState(filters.karyawan_id || "");
    const [from, setFrom] = useState(filters.from || "");
    const [to, setTo] = useState(filters.to || "");
    const [titikId, setTitikId] = useState(filters.titik_id || "");
    const [status, setStatus] = useState(filters.status_validasi || "");

    const apply = (overrides = {}) => {
        const targetGroup = overrides.groupBy ?? groupBy;

        const params = { status_validasi: overrides.status ?? status };
        if (targetGroup) {
            params.group_by = targetGroup;
            params.from = overrides.from ?? from;
            params.to = overrides.to ?? to;
            params.titik_id = overrides.titikId ?? titikId;
        } else {
            params.tanggal = overrides.tanggal ?? tanggal;
            params.karyawan_id = overrides.karyawanId ?? karyawanId;
        }

        router.get(route("attendance.presensi.index"), params);
    };

    const handleFilter = () => apply();
    const clearFilters = () => {
        setGroupBy("");
        setTanggal("");
        setKaryawanId("");
        setFrom("");
        setTo("");
        setTitikId("");
        setStatus("");
        router.get(route("attendance.presensi.index"));
    };

    const openGroup = (g) => {
        router.get(route("attendance.presensi.rekapDetail"), {
            group_by: groupBy,
            group_key: g.key,
            from,
            to,
            titik_id: titikId || "",
            status_validasi: status || "",
        });
    };

    const stats = isGrouped
        ? [
            { label: "Total Presensi", value: summary.total ?? 0, icon: ClipboardList, color: "bg-gray-900 text-white" },
            { label: "Karyawan Unik", value: summary.karyawan_uniq ?? 0, icon: Users, color: "bg-blue-600 text-white" },
            { label: "Selesai Check-Out", value: summary.selesai ?? 0, icon: Clock, color: "bg-indigo-600 text-white" },
            { label: "Valid", value: summary.valid ?? 0, icon: CheckCircle2, color: "bg-green-600 text-white" },
            { label: "Luar Radius", value: summary.luar_radius ?? 0, icon: AlertTriangle, color: "bg-yellow-500 text-white" },
            { label: "Tidak Valid", value: summary.tidak_valid ?? 0, icon: XCircle, color: "bg-red-600 text-white" },
        ]
        : [];

    const groupedLabel = GROUP_OPTIONS.find((o) => o.value === groupBy)?.label || "Kelompok";

    return (
        <AuthenticatedLayout>
            <Head title="Presensi" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Presensi Karyawan</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isGrouped
                            ? "Index absensi dikelompokkan per hari, titik kerja, proyek, karyawan, atau role"
                            : "Rekap check-in / check-out karyawan di lapangan"}
                    </p>
                </div>
                <Link
                    href={route("attendance.presensi.create")}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Catat Presensi
                </Link>
            </div>

            {/* Statistik (mode grouped) */}
            {isGrouped && (
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
            )}

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

                    {isGrouped ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    value={tanggal}
                                    onChange={(e) => setTanggal(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2"
                                />
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
                        </>
                    )}

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

            {isGrouped ? (
                <>
                    {/* Tabel kelompok (clickable) */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">{groupedLabel}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Selesai</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Valid</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Luar Radius</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tidak Valid</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {groups.length === 0 || summary.total === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            Tidak ada data presensi pada rentang yang dipilih
                                        </td>
                                    </tr>
                                ) : (
                                    groups.map((g) => (
                                        <tr
                                            key={g.key}
                                            onClick={() => g.total > 0 && openGroup(g)}
                                            className={g.total === 0 ? "bg-gray-50" : "hover:bg-gray-50 cursor-pointer transition"}
                                        >
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
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {g.total > 0 ? (
                                                    <ChevronRight className="inline w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {(summary.valid ?? 0) + (summary.luar_radius ?? 0) + (summary.tidak_valid ?? 0) > 0 && summary.total > 0 && (
                        <div className="mt-4 text-sm text-gray-500">
                            {(summary.valid ?? 0) + (summary.luar_radius ?? 0) + (summary.tidak_valid ?? 0)} dari {summary.total} presensi pada rentang ini telah divalidasi
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Table individual */}
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
                </>
            )}
        </AuthenticatedLayout>
    );
}