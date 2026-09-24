import React, { useState, useMemo, useEffect } from "react";
import { router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Head } from "@inertiajs/react";
import { formatTanggal } from "@/utils/date";
import {
    Truck,
    CalendarClock,
    Clock,
    Gauge,
    Disc3,
    Route as RouteIcon,
    ArrowLeftRight,
    Fuel,
    AlertTriangle,
    ShieldCheck,
    Wrench,
    ListChecks,
    Search,
    FilterX,
    Download,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    X,
    MoonStar,
    Building2,
} from "lucide-react";

const JENIS = {
    dump_truck: "Dump Truck",
    dump_truck_tronton: "Dump Truck Tronton",
    self_loader: "Self Loader",
    alat_berat: "Alat Berat",
    truck_molen: "Truck Molen",
    lainnya: "Lainnya",
};

const TIPE_UNIT = {
    armada_jalan: "Armada Jalan",
    alat_berat: "Alat Berat",
};

const STATUS = {
    aktif: "bg-green-200 text-green-800",
    servis: "bg-yellow-200 text-yellow-800",
    nonaktif: "bg-red-200 text-red-800",
};

function KpiCard({ title, value, icon, colorClass, note }) {
    return (
        <div className={`rounded-xl shadow-sm border p-4 ${colorClass}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium opacity-80">{title}</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
                    {note ? <p className="text-xs opacity-70 mt-1">{note}</p> : null}
                </div>
                <div className="p-2 bg-white/60 rounded-lg">{icon}</div>
            </div>
        </div>
    );
}

const fmtNum = (n) => {
    if (n === null || n === undefined) return "-";
    return Number(n).toLocaleString("id-ID", { maximumFractionDigits: 2 });
};

/**
 * Grafik tren garis sederhana (SVG murni, tanpa dependensi tambahan).
 * Dipakai untuk menampilkan tren jam aktif harian dari rekap_per_tanggal.
 */
function TrendChart({ data, dataKey, label, color = "#6366f1", suffix = "" }) {
    const width = 760;
    const height = 200;
    const padding = { top: 16, right: 16, bottom: 28, left: 44 };

    if (!data || data.length === 0) {
        return <p className="text-sm text-gray-500 text-center py-8">Tidak ada data untuk grafik.</p>;
    }

    const values = data.map((d) => Number(d[dataKey]) || 0);
    const max = Math.max(...values, 1);
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const points = values.map((v, i) => {
        const x = padding.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
        const y = padding.top + innerH - (v / max) * innerH;
        return { x, y, v, tanggal: data[i].tanggal };
    });

    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`;

    // Tampilkan maksimal ~8 label tanggal di sumbu-x agar tidak berdesakan.
    const labelStep = Math.max(1, Math.ceil(points.length / 8));

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]" role="img" aria-label={label}>
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#e5e7eb" />
                <line x1={padding.left} y1={padding.top + innerH} x2={width - padding.right} y2={padding.top + innerH} stroke="#e5e7eb" />
                <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{fmtNum(max)}</text>
                <text x={padding.left - 8} y={padding.top + innerH} textAnchor="end" fontSize="10" fill="#9ca3af">0</text>
                <path d={area} fill={color} opacity="0.12" />
                <path d={path} fill="none" stroke={color} strokeWidth="2" />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="2.5" fill={color}>
                            <title>{`${formatTanggal(p.tanggal)}: ${fmtNum(p.v)}${suffix}`}</title>
                        </circle>
                        {i % labelStep === 0 ? (
                            <text x={p.x} y={height - 8} textAnchor="middle" fontSize="9" fill="#9ca3af">
                                {formatTanggal(p.tanggal)?.slice(0, 5) ?? ""}
                            </text>
                        ) : null}
                    </g>
                ))}
            </svg>
        </div>
    );
}

/**
 * Panel drill-down: riwayat timeline satu armada (checklist, ritase, sewa)
 * plus downtime & pengajuan servis terakhir. Diambil lewat fetch ke endpoint
 * JSON `fleet.monitoring-armada.detail`, tanpa reload halaman.
 */
function ArmadaDetailModal({ armadaId, filters, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.dari) params.set("dari", filters.dari);
        if (filters.sampai) params.set("sampai", filters.sampai);

        fetch(`${route("fleet.monitoring-armada.detail", armadaId)}?${params.toString()}`, {
            headers: { Accept: "application/json" },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Gagal memuat riwayat unit.");
                return res.json();
            })
            .then((json) => {
                if (!cancelled) setData(json);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [armadaId, filters.dari, filters.sampai]);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                    <div>
                        <h3 className="font-bold text-gray-900">
                            {data?.armada?.kode_unit || "Memuat..."}
                        </h3>
                        <p className="text-xs text-gray-500">{data?.armada?.plat_nomor} · {data?.armada?.unit_bisnis}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4">
                    {loading ? <p className="text-sm text-gray-500 py-6 text-center">Memuat riwayat...</p> : null}
                    {error ? <p className="text-sm text-red-600 py-6 text-center">{error}</p> : null}

                    {!loading && !error && data ? (
                        <div className="space-y-6">
                            {(data.downtime?.some((d) => d.aktif) || data.servis?.length > 0) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {data.downtime?.filter((d) => d.aktif).map((d, i) => (
                                        <div key={`dt-${i}`} className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-xs">
                                            <p className="font-semibold text-orange-800 flex items-center gap-1">
                                                <Wrench className="w-3.5 h-3.5" /> Downtime aktif sejak {d.mulai}
                                            </p>
                                            {d.keterangan ? <p className="text-orange-700 mt-1">{d.keterangan}</p> : null}
                                        </div>
                                    ))}
                                    {data.servis?.slice(0, 1).map((s, i) => (
                                        <div key={`sv-${i}`} className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs">
                                            <p className="font-semibold text-sky-800 flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Servis: {s.status}
                                            </p>
                                            <p className="text-sky-700 mt-1">{formatTanggal(s.tanggal)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Timeline Aktivitas</h4>
                                {data.timeline?.length === 0 ? (
                                    <p className="text-sm text-gray-500 py-4 text-center">Tidak ada aktivitas pada rentang ini.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {data.timeline?.map((t, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm border-b last:border-0 pb-2">
                                                <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">{formatTanggal(t.tanggal)}</span>
                                                <div>
                                                    <p className="text-gray-800">{t.label}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {[
                                                            t.jam_aktif ? `${fmtNum(t.jam_aktif)} jam` : null,
                                                            t.hm ? `HM ${fmtNum(t.hm)}` : null,
                                                            t.odo_km ? `${fmtNum(t.odo_km)} km` : null,
                                                        ].filter(Boolean).join(" · ")}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function SortIcon({ active, dir }) {
    if (!active) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 inline ml-1" />;
    return dir === "asc"
        ? <ArrowUp className="w-3.5 h-3.5 text-gray-600 inline ml-1" />
        : <ArrowDown className="w-3.5 h-3.5 text-gray-600 inline ml-1" />;
}

export default function Index({ ringkasan, per_unit_bisnis, rekap_per_tanggal, per_unit, unit_bisnis, filters }) {
    const [unit, setUnit] = useState(filters.unit_bisnis_id || "");
    const [status, setStatus] = useState(filters.status || "");
    const [dari, setDari] = useState(filters.dari || "");
    const [sampai, setSampai] = useState(filters.sampai || "");
    const [cari, setCari] = useState("");
    const [sortKey, setSortKey] = useState("kode_unit");
    const [sortDir, setSortDir] = useState("asc");
    const [selectedArmadaId, setSelectedArmadaId] = useState(null);

    const applyFilters = () => {
        const params = {};
        if (unit) params.unit_bisnis_id = unit;
        if (status) params.status = status;
        if (dari) params.dari = dari;
        if (sampai) params.sampai = sampai;
        router.get(route("fleet.monitoring-armada.index"), params, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setUnit("");
        setStatus("");
        setDari("");
        setSampai("");
        router.get(route("fleet.monitoring-armada.index"));
    };

    const exportUrl = useMemo(() => {
        const params = {};
        if (unit) params.unit_bisnis_id = unit;
        if (status) params.status = status;
        if (dari) params.dari = dari;
        if (sampai) params.sampai = sampai;
        return route("fleet.monitoring-armada.export", params);
    }, [unit, status, dari, sampai]);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const filteredUnits = useMemo(() => {
        const term = cari.trim().toLowerCase();
        let rows = per_unit;

        if (term) {
            rows = rows.filter((u) =>
                [u.kode_unit, u.plat_nomor, u.unit_bisnis, u.unit_bisnis_kode]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(term))
            );
        }

        rows = [...rows].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (av === null || av === undefined) return 1;
            if (bv === null || bv === undefined) return -1;
            if (typeof av === "string") {
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            return sortDir === "asc" ? av - bv : bv - av;
        });

        return rows;
    }, [per_unit, cari, sortKey, sortDir]);

    const r = ringkasan || {};
    const attention = [
        { label: "Unit Bermasalah", value: r.unit_bermasalah || 0, color: "bg-red-50 border-red-100 text-red-900", icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
        { label: "Belum Checklist Hari Ini", value: r.belum_checklist_hari_ini || 0, color: "bg-amber-50 border-amber-100 text-amber-900", icon: <ListChecks className="w-5 h-5 text-amber-500" /> },
        { label: "Downtime Aktif", value: r.downtime_aktif || 0, color: "bg-orange-50 border-orange-100 text-orange-900", icon: <Wrench className="w-5 h-5 text-orange-500" /> },
        { label: "Servis Menunggu", value: r.servis_menunggu || 0, color: "bg-sky-50 border-sky-100 text-sky-900", icon: <ShieldCheck className="w-5 h-5 text-sky-500" /> },
        { label: "Unit Idle (>3 hari)", value: r.unit_idle || 0, color: "bg-purple-50 border-purple-100 text-purple-900", icon: <MoonStar className="w-5 h-5 text-purple-500" /> },
    ];

    const th = (label, key, align = "right") => (
        <th
            className={`py-2 pr-4 cursor-pointer select-none text-${align} ${align === "left" ? "text-left" : ""}`}
            onClick={() => toggleSort(key)}
        >
            {label}
            <SortIcon active={sortKey === key} dir={sortDir} />
        </th>
    );

    return (
        <Layout>
            <Head title="Monitoring Armada" />

            <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Monitoring Armada</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Metrik utilisasi (jam aktif, HM/Jam, jam/rit) & kondisi seluruh armada — rentang{" "}
                        <strong>{filters.dari || "30 hari terakhir"}</strong> s.d.{" "}
                        <strong>{filters.sampai || "hari ini"}</strong>.
                    </p>
                </div>
                <a
                    href={exportUrl}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm flex items-center gap-1.5 shrink-0"
                >
                    <Download className="w-4 h-4" /> Export Excel
                </a>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="w-56">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Bisnis</label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua Unit</option>
                            {unit_bisnis.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.kode} — {u.nama}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-44">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                        <input
                            type="date"
                            value={dari}
                            onChange={(e) => setDari(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={sampai}
                            onChange={(e) => setSampai(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center gap-1"
                    >
                        <Search className="w-4 h-4" /> Terapkan
                    </button>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm flex items-center gap-1"
                    >
                        <FilterX className="w-4 h-4" /> Reset
                    </button>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <KpiCard
                    title="Total Armada"
                    value={(r.total_armada ?? 0) + " unit"}
                    icon={<Truck className="w-6 h-6 text-blue-500" />}
                    colorClass="bg-blue-50 border-blue-100 text-blue-900"
                />
                <KpiCard
                    title="Hari Operasi (Unit×Hari)"
                    value={fmtNum(r.total_hari_unit_operasi)}
                    icon={<CalendarClock className="w-6 h-6 text-indigo-500" />}
                    colorClass="bg-indigo-50 border-indigo-100 text-indigo-900"
                />
                <KpiCard
                    title="Total Jam Aktif"
                    value={fmtNum(r.total_jam_aktif) + " jam"}
                    icon={<Clock className="w-6 h-6 text-violet-500" />}
                    colorClass="bg-violet-50 border-violet-100 text-violet-900"
                />
                <KpiCard
                    title="Rasio HM/Jam (Alat Berat)"
                    value={r.rasio_hm_jam == null ? "-" : fmtNum(r.rasio_hm_jam)}
                    note="Pemakaian HM ÷ jam aktif — khusus alat berat"
                    icon={<Gauge className="w-6 h-6 text-fuchsia-500" />}
                    colorClass="bg-fuchsia-50 border-fuchsia-100 text-fuchsia-900"
                />
                <KpiCard
                    title="Pemakaian HM"
                    value={fmtNum(r.total_hm)}
                    icon={<Disc3 className="w-6 h-6 text-cyan-500" />}
                    colorClass="bg-cyan-50 border-cyan-100 text-cyan-900"
                />
                <KpiCard
                    title="Total ODO / Tempuh"
                    value={fmtNum(r.total_odo_km) + " km"}
                    icon={<RouteIcon className="w-6 h-6 text-emerald-500" />}
                    colorClass="bg-emerald-50 border-emerald-100 text-emerald-900"
                />
                <KpiCard
                    title="Total Ritase"
                    value={fmtNum(r.total_ritase) + " rit"}
                    icon={<ArrowLeftRight className="w-6 h-6 text-amber-500" />}
                    colorClass="bg-amber-50 border-amber-100 text-amber-900"
                />
                <KpiCard
                    title="Total Solar"
                    value={fmtNum(r.total_solar_liter) + " L"}
                    icon={<Fuel className="w-6 h-6 text-rose-500" />}
                    colorClass="bg-rose-50 border-rose-100 text-rose-900"
                />
            </div>

            {/* Perhatian */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {attention.map((a) => (
                    <div key={a.label} className={`rounded-xl shadow-sm border p-4 ${a.color}`}>
                        <div className="flex items-center gap-2">
                            {a.icon}
                            <p className="text-sm font-medium">{a.label}</p>
                        </div>
                        <p className="text-2xl font-bold mt-2 tabular-nums">{a.value}</p>
                    </div>
                ))}
            </div>

            {/* Grafik Tren */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-violet-500" /> Tren Jam Aktif Harian
                </h3>
                <TrendChart data={rekap_per_tanggal} dataKey="total_jam_aktif" label="Tren jam aktif harian" color="#8b5cf6" suffix=" jam" />
            </div>

            {/* Breakdown Per Unit Bisnis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" /> Performa per Unit Bisnis
                </h3>
                {!per_unit_bisnis || per_unit_bisnis.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Tidak ada data.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase text-gray-400 border-b">
                                    <th className="py-2 pr-4">Unit Bisnis</th>
                                    <th className="py-2 pr-4 text-right">Armada</th>
                                    <th className="py-2 pr-4 text-right">Jam Aktif</th>
                                    <th className="py-2 pr-4 text-right">HM</th>
                                    <th className="py-2 pr-4 text-right">ODO (km)</th>
                                    <th className="py-2 pr-4 text-right">Solar (L)</th>
                                    <th className="py-2 pr-4 text-right">Ritase</th>
                                    <th className="py-2 pr-4 text-right">Bermasalah</th>
                                    <th className="py-2 text-right">Idle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {per_unit_bisnis.map((u) => (
                                    <tr key={u.unit_bisnis_kode} className="border-b last:border-0">
                                        <td className="py-2 pr-4">
                                            <span className="font-mono bg-gray-100 rounded px-1 py-0.5 text-xs mr-1">{u.unit_bisnis_kode}</span>
                                            {u.unit_bisnis}
                                        </td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{u.total_armada}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(u.total_jam_aktif)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(u.total_hm)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(u.total_odo_km)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(u.total_solar_liter)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{u.total_ritase}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">
                                            {u.unit_bermasalah > 0 ? <span className="text-red-600 font-semibold">{u.unit_bermasalah}</span> : 0}
                                        </td>
                                        <td className="py-2 text-right tabular-nums">
                                            {u.unit_idle > 0 ? <span className="text-purple-600 font-semibold">{u.unit_idle}</span> : 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Rekap Durasi per Tanggal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-indigo-500" /> Rekap Durasi per Tanggal
                </h3>
                {rekap_per_tanggal.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                        Tidak ada data operasional pada rentang tanggal ini.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase text-gray-400 border-b">
                                    <th className="py-2 pr-4">Tanggal</th>
                                    <th className="py-2 pr-4">Unit (armada)</th>
                                    <th className="py-2 pr-4 text-right">Jam Aktif</th>
                                    <th className="py-2 pr-4 text-right">HM</th>
                                    <th className="py-2 pr-4 text-right">ODO (km)</th>
                                    <th className="py-2 pr-4 text-right">Solar (L)</th>
                                    <th className="py-2 pr-4 text-right">Ritase</th>
                                    <th className="py-2 text-right">Sewa Jam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rekap_per_tanggal.map((d) => (
                                    <tr key={d.tanggal} className="border-b last:border-0">
                                        <td className="py-2 pr-4 font-medium">{formatTanggal(d.tanggal)}</td>
                                        <td className="py-2 pr-4">{d.jumlah_unit}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(d.total_jam_aktif)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(d.total_hm)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(d.total_odo_km)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(d.total_solar_liter)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{d.jumlah_rit}</td>
                                        <td className="py-2 text-right tabular-nums">{fmtNum(d.total_sewa_jam)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Daftar Unit */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-500" /> Daftar Unit Armada
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                                placeholder="Cari kode unit / plat / unit bisnis..."
                                className="border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-sm w-64 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{filteredUnits.length} / {per_unit.length} unit</span>
                    </div>
                </div>
                {filteredUnits.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Tidak ada unit yang cocok dengan filter.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase text-gray-400 border-b">
                                    {th("Unit", "kode_unit", "left")}
                                    <th className="py-2 pr-4">Jenis</th>
                                    <th className="py-2 pr-4">Unit Bisnis</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Kondisi Terakhir</th>
                                    <th className="py-2 pr-4 text-center">Checklist Hari Ini</th>
                                    {th("Jam Aktif", "total_jam_aktif")}
                                    {th("HM/Jam · Jam/Rit", "rasio_hm_jam")}
                                    {th("ODO (km)", "total_odo_km")}
                                    {th("Ritase", "jumlah_rit")}
                                    {th("Idle (hari)", "hari_sejak_aktivitas")}
                                    <th className="py-2 text-left">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUnits.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelectedArmadaId(u.id)}
                                    >
                                        <td className="py-2 pr-4">
                                            <p className="font-semibold text-gray-800">{u.kode_unit || "-"}</p>
                                            <p className="text-xs text-gray-400">{u.plat_nomor || "-"}</p>
                                        </td>
                                        <td className="py-2 pr-4">
                                            <p>{JENIS[u.jenis] || u.jenis || "-"}</p>
                                            <p className="text-xs text-gray-400">{TIPE_UNIT[u.tipe_unit] || u.tipe_unit || "-"}</p>
                                        </td>
                                        <td className="py-2 pr-4 text-xs">
                                            <span className="font-mono bg-gray-100 rounded px-1 py-0.5">{u.unit_bisnis_kode || "-"}</span>
                                            <p className="text-gray-500">{u.unit_bisnis || "-"}</p>
                                        </td>
                                        <td className="py-2 pr-4">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS[u.status] || "bg-gray-100 text-gray-700"}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4">
                                            {u.kondisi_terakhir ? (
                                                u.kondisi_terakhir.kondisi_baik ? (
                                                    <span className="text-green-700 text-xs font-medium inline-flex items-center gap-1">
                                                        <ShieldCheck className="w-3.5 h-3.5" /> Baik
                                                    </span>
                                                ) : (
                                                    <span className="text-red-700 text-xs font-medium inline-flex items-center gap-1">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> {u.kondisi_terakhir.item_bermasalah || "Bermasalah"}
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-gray-400 text-xs">Belum ada checklist</span>
                                            )}
                                            {u.kondisi_terakhir ? (
                                                <p className="text-xs text-gray-400">{formatTanggal(u.kondisi_terakhir.tanggal)}</p>
                                            ) : null}
                                        </td>
                                        <td className="py-2 pr-4 text-center">
                                            {u.checklist_hari_ini ? (
                                                <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">Sudah</span>
                                            ) : (
                                                <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600">Belum</span>
                                            )}
                                        </td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(u.total_jam_aktif)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">
                                            {u.tipe_unit === "alat_berat"
                                                ? (u.rasio_hm_jam == null ? "-" : fmtNum(u.rasio_hm_jam))
                                                : (u.jam_per_rit == null ? "-" : `${fmtNum(u.jam_per_rit)} j/rit`)}
                                        </td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(u.total_odo_km)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{u.jumlah_rit}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">
                                            {u.aktif ? (
                                                <span className={u.idle ? "text-purple-600 font-semibold" : "text-gray-400"}>
                                                    {u.hari_sejak_aktivitas ?? "—"}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="py-2">
                                            <div className="flex flex-wrap gap-1">
                                                {u.idle ? (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">Idle</span>
                                                ) : null}
                                                {u.downtime_aktif ? (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800">Downtime</span>
                                                ) : null}
                                                {u.servis_menunggu ? (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-sky-100 text-sky-800">Servis</span>
                                                ) : null}
                                                {u.status === "nonaktif" ? (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Nonaktif</span>
                                                ) : null}
                                                {!u.checklist_hari_ini && u.aktif ? (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">Belum checklist</span>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <p className="text-xs text-gray-400 mt-3">Klik baris untuk melihat riwayat lengkap unit.</p>
            </div>

            {selectedArmadaId ? (
                <ArmadaDetailModal
                    armadaId={selectedArmadaId}
                    filters={{ dari: filters.dari, sampai: filters.sampai }}
                    onClose={() => setSelectedArmadaId(null)}
                />
            ) : null}
        </Layout>
    );
}
