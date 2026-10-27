import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import StatusBadge from "@/Components/StatusBadge";
import {
    Plus,
    Search,
    Eye,
    MapPin,
    Clock,
    ClipboardList,
    Users,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ChevronRight,
    Camera,
    ImageOff,
    Navigation,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

const GROUP_OPTIONS = [
    { value: "", label: "List Individual"},
    { value: "hari", label: "Per Hari" },
    { value: "titik", label: "Per Titik Kerja" },
    { value: "proyek", label: "Per Proyek" },
    { value: "karyawan", label: "Per Karyawan" },
    { value: "role", label: "Per Role" },
];

export default function Index({
    mode,
    summary,
    groups,
    presensis,
    titiks = [],
    filters = {},
    sort,
    direction,
}) {
    const isGrouped = mode === "grouped";
    const isOwner = (usePage().props.auth?.roles || []).includes("Owner");

    const [groupBy, setGroupBy] = useState(filters.group_by || "");
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
        }

        router.get(route("attendance.presensi.index"), params);
    };

    const handleFilter = () => apply();
    const clearFilters = () => {
        setGroupBy("");
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

    const stats = summary
        ? [
              {
                  label: "Total Presensi",
                  value: summary.total ?? 0,
                  icon: ClipboardList,
                  color: "bg-gray-900 text-white",
              },
              {
                  label: "Karyawan Unik",
                  value: summary.karyawan_uniq ?? 0,
                  icon: Users,
                  color: "bg-blue-600 text-white",
              },
              {
                  label: "Selesai Check-Out",
                  value: summary.selesai ?? 0,
                  icon: Clock,
                  color: "bg-indigo-600 text-white",
              },
              {
                  label: "Valid",
                  value: summary.valid ?? 0,
                  icon: CheckCircle2,
                  color: "bg-green-600 text-white",
                  filterValue: "valid",
              },
              {
                  label: "Luar Radius",
                  value: summary.luar_radius ?? 0,
                  icon: AlertTriangle,
                  color: "bg-yellow-500 text-white",
                  filterValue: "luar_radius",
              },
              {
                  label: "Tidak Valid",
                  value: summary.tidak_valid ?? 0,
                  icon: XCircle,
                  color: "bg-red-600 text-white",
                  filterValue: "tidak_valid",
              },
          ]
        : [];

    const toggleStatFilter = (filterValue) => {
        const next = status === filterValue ? "" : filterValue;
        setStatus(next);
        apply({ status: next });
    };

    const groupedLabel =
        GROUP_OPTIONS.find((o) => o.value === groupBy)?.label || "Kelompok";

    const columns = [
        {
            key: "karyawan",
            label: "Karyawan",
            type: "text",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (p) => p.karyawan?.nama || "-",
        },
        {
            key: "titik",
            label: "Titik",
            type: "select",
            options: titiks.map((t) => ({
                value: String(t.id),
                label: t.nama,
            })),
            render: (p) =>
                p.titik ? (
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {p.titik.nama}
                    </span>
                ) : (
                    "-"
                ),
        },
        {
            key: "check_in",
            label: "Check-In",
            type: "dateRange",
            render: (p) => (p.check_in ? formatTanggal(p.check_in) : "-"),
        },
        {
            key: "check_out",
            label: "Check-Out",
            search: false,
            render: (p) =>
                p.check_out ? (
                    <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formatTanggal(p.check_out) ?? "-"}
                    </span>
                ) : (
                    "-"
                ),
        },
        {
            key: "status_validasi",
            label: "Status",
            type: "select",
            options: [
                { value: "valid", label: "Valid" },
                { value: "tidak_valid", label: "Tidak Valid" },
                { value: "luar_radius", label: "Luar Radius" },
            ],
            render: (p) => (
                <>
                    <StatusBadge status={p.status_validasi} />
                    {p.catatan_override && (
                        <p className="text-xs text-gray-500 mt-1">
                            Catatan: {p.catatan_override}
                        </p>
                    )}
                </>
            ),
        },
        {
            key: "foto",
            label: "Foto",
            search: false,
            sortable: false,
            render: (p) => (
                <div className="flex items-center gap-3">
                    <Link
                        href={route("attendance.presensi.show", p.id)}
                        title="Lihat foto check-in"
                    >
                        {p.check_in_photo ? (
                            <img
                                src={
                                    p.check_in_photo_url ||
                                    "/storage/" + p.check_in_photo
                                }
                                alt="Check-in"
                                className="w-9 h-9 object-cover rounded-md border border-gray-200"
                            />
                        ) : (
                            <span
                                className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 text-gray-400"
                                title="Tidak ada foto check-in"
                            >
                                <ImageOff className="w-4 h-4" />
                            </span>
                        )}
                    </Link>
                    <Link
                        href={route("attendance.presensi.show", p.id)}
                        title="Lihat foto check-out"
                    >
                        {p.check_out_photo ? (
                            <img
                                src={
                                    p.check_out_photo_url ||
                                    "/storage/" + p.check_out_photo
                                }
                                alt="Check-out"
                                className="w-9 h-9 object-cover rounded-md border border-gray-200"
                            />
                        ) : (
                            <span
                                className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 text-gray-400"
                                title="Tidak ada foto check-out"
                            >
                                <Camera className="w-4 h-4" />
                            </span>
                        )}
                    </Link>
                </div>
            ),
        },
        {
            key: "formulir",
            label: "Formulir",
            search: false,
            sortable: false,
            render: (p) => (p.formulir ? "Terkirim" : "-"),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-right text-sm",
            render: (p) => (
                <Link
                    href={route("attendance.presensi.show", p.id)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                >
                    <Eye className="w-4 h-4" />
                    Detail
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Presensi" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Presensi Karyawan
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isGrouped
                            ? "Index absensi dikelompokkan per hari, titik kerja, proyek, karyawan, atau role"
                            : "Rekap check-in / check-out karyawan di lapangan"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route("attendance.presensi.create")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Catat Presensi
                    </Link>
                    {isOwner && (
                        <Link
                            href={route("attendance.tracking.index")}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                            <Navigation className="w-4 h-4" />
                            Tracking Linimasa
                        </Link>
                    )}
                </div>
            </div>

            {stats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {stats.map((stat) => {
                        const clickable = Boolean(stat.filterValue);
                        const active = clickable && status === stat.filterValue;
                        return (
                            <button
                                key={stat.label}
                                type="button"
                                onClick={
                                    clickable
                                        ? () =>
                                              toggleStatFilter(stat.filterValue)
                                        : undefined
                                }
                                className={`text-left bg-white rounded-xl border shadow-sm p-4 transition ${
                                    clickable
                                        ? "hover:border-gray-400 cursor-pointer"
                                        : "cursor-default"
                                } ${active ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"}`}
                            >
                                <div
                                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 ${stat.color}`}
                                >
                                    <stat.icon className="w-4 h-4" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {stat.value}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {stat.label}
                                    {clickable && (
                                        <span className="block text-gray-400">
                                            {active
                                                ? "Klik untuk hapus filter"
                                                : "Klik untuk filter"}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kelompok
                        </label>
                        <select
                            value={groupBy}
                            onChange={(e) => {
                                setGroupBy(e.target.value);
                                apply({ groupBy: e.target.value });
                            }}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            {GROUP_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isGrouped && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dari
                                </label>
                                <input
                                    type="date"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sampai
                                </label>
                                <input
                                    type="date"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titik Kerja
                                </label>
                                <select
                                    value={titikId}
                                    onChange={(e) => setTitikId(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">Semua</option>
                                    {titiks.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.nama}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status Validasi
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">Semua</option>
                                    <option value="valid">Valid</option>
                                    <option value="tidak_valid">
                                        Tidak Valid
                                    </option>
                                    <option value="luar_radius">
                                        Luar Radius
                                    </option>
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
                        </>
                    )}
                </div>
            </div>

            {isGrouped ? (
                <>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                        {groupedLabel}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                        Selesai
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                        Valid
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                        Luar Radius
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                        Tidak Valid
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {groups.length === 0 || summary.total === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-4 text-center text-gray-500"
                                        >
                                            Tidak ada data presensi pada rentang
                                            yang dipilih
                                        </td>
                                    </tr>
                                ) : (
                                    groups.map((g) => (
                                        <tr
                                            key={g.key}
                                            onClick={() =>
                                                g.total > 0 && openGroup(g)
                                            }
                                            className={
                                                g.total === 0
                                                    ? "bg-gray-50"
                                                    : "hover:bg-gray-50 cursor-pointer transition"
                                            }
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {groupBy === "hari"
                                                        ? formatTanggal(g.label)
                                                        : g.label}
                                                </div>
                                                {g.parent && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-gray-400" />
                                                            {g.parent}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {g.total}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {g.selesai}
                                            </td>
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
                                                    <span className="text-xs text-gray-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {(summary.valid ?? 0) +
                        (summary.luar_radius ?? 0) +
                        (summary.tidak_valid ?? 0) >
                        0 &&
                        summary.total > 0 && (
                            <div className="mt-4 text-sm text-gray-500">
                                {(summary.valid ?? 0) +
                                    (summary.luar_radius ?? 0) +
                                    (summary.tidak_valid ?? 0)}{" "}
                                dari {summary.total} presensi pada rentang ini
                                telah divalidasi
                            </div>
                        )}
                </>
            ) : (
                <DataTable
                    routeName="attendance.presensi.index"
                    columns={columns}
                    rows={presensis}
                    filters={filters}
                    sort={sort}
                    direction={direction}
                />
            )}
        </AuthenticatedLayout>
    );
}
