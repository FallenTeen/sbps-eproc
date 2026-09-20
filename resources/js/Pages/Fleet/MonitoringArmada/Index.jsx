import React, { useState } from "react";
import { router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Head } from "@inertiajs/react";
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

export default function Index({ ringkasan, rekap_per_tanggal, per_unit, unit_bisnis, filters }) {
    const [unit, setUnit] = useState(filters.unit_bisnis_id || "");
    const [status, setStatus] = useState(filters.status || "");
    const [dari, setDari] = useState(filters.dari || "");
    const [sampai, setSampai] = useState(filters.sampai || "");

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

    const r = ringkasan || {};
    const attention = [
        { label: "Unit Bermasalah", value: r.unit_bermasalah || 0, color: "bg-red-50 border-red-100 text-red-900", icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
        { label: "Belum Checklist Hari Ini", value: r.belum_checklist_hari_ini || 0, color: "bg-amber-50 border-amber-100 text-amber-900", icon: <ListChecks className="w-5 h-5 text-amber-500" /> },
        { label: "Downtime Aktif", value: r.downtime_aktif || 0, color: "bg-orange-50 border-orange-100 text-orange-900", icon: <Wrench className="w-5 h-5 text-orange-500" /> },
        { label: "Servis Menunggu", value: r.servis_menunggu || 0, color: "bg-sky-50 border-sky-100 text-sky-900", icon: <ShieldCheck className="w-5 h-5 text-sky-500" /> },
    ];

    return (
        <Layout>
            <Head title="Monitoring Armada" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Monitoring Armada</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Metrik utilisasi (jam aktif, HM/Jam, rekap durasi) & kondisi seluruh armada — rentang{" "}
                    <strong>{filters.dari || "30 hari terakhir"}</strong> s.d.{" "}
                    <strong>{filters.sampai || "hari ini"}</strong>.
                </p>
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
                    title="Rasio HM/Jam"
                    value={r.rasio_hm_jam == null ? "-" : fmtNum(r.rasio_hm_jam)}
                    note="Pemakaian HM ÷ jam kalender aktif"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                                        <td className="py-2 pr-4 font-medium">{d.tanggal}</td>
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
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-500" /> Daftar Unit Armada
                    </h3>
                    <span className="text-xs text-gray-400">{per_unit.length} unit</span>
                </div>
                {per_unit.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Tidak ada unit yang cocok dengan filter.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase text-gray-400 border-b">
                                    <th className="py-2 pr-4">Unit</th>
                                    <th className="py-2 pr-4">Jenis</th>
                                    <th className="py-2 pr-4">Unit Bisnis</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Kondisi Terakhir</th>
                                    <th className="py-2 pr-4 text-center">Checklist Hari Ini</th>
                                    <th className="py-2 pr-4 text-right">Jam Aktif</th>
                                    <th className="py-2 pr-4 text-right">HM</th>
                                    <th className="py-2 pr-4 text-right">ODO (km)</th>
                                    <th className="py-2 pr-4 text-right">Ritase</th>
                                    <th className="py-2 text-left">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {per_unit.map((u) => (
                                    <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
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
                                                <p className="text-xs text-gray-400">{u.kondisi_terakhir.tanggal}</p>
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
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(u.total_hm)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(u.total_odo_km)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{u.jumlah_rit}</td>
                                        <td className="py-2">
                                            <div className="flex flex-wrap gap-1">
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
            </div>
        </Layout>
    );
}