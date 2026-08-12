import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Plus, Search, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";

const STATUS_BADGE = {
    berjalan:   { cls: "bg-blue-100 text-blue-800 border border-blue-200",    icon: Activity,     label: "BERJALAN" },
    selesai:    { cls: "bg-emerald-100 text-emerald-800 border border-emerald-200", icon: CheckCircle2, label: "SELESAI" },
    dibatalkan: { cls: "bg-gray-100 text-gray-600 border border-gray-200",    icon: XCircle,      label: "DIBATALKAN" },
};

function fmt(n) {
    if (n == null || n === "") return "-";
    return "Rp " + Number(n).toLocaleString("id-ID");
}
function fmtDate(d) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDT(d) {
    if (!d) return "-";
    return new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function durasiMenit(mulai, selesai) {
    if (!mulai || !selesai) return null;
    return Math.round((new Date(selesai) - new Date(mulai)) / 60000);
}

export default function Index({ sessions, produks, filters }) {
    const [status,   setStatus]   = useState(filters.status    || "");
    const [produkId, setProdukId] = useState(filters.produk_id || "");
    const [tanggal,  setTanggal]  = useState(filters.tanggal   || "");
    const [search,   setSearch]   = useState(filters.search    || "");

    const applyFilter = (overrides = {}) => {
        router.get(route("production.sessions.index"), {
            status:    overrides.status    ?? status,
            produk_id: overrides.produk_id ?? produkId,
            tanggal:   overrides.tanggal   ?? tanggal,
            search:    overrides.search    ?? search,
        });
    };

    const clearFilters = () => {
        setStatus(""); setProdukId(""); setTanggal(""); setSearch("");
        router.get(route("production.sessions.index"));
    };

    /* Summary counts from current page */
    const countBerjalan  = sessions.data.filter(s => s.status === "berjalan").length;
    const countSelesai   = sessions.data.filter(s => s.status === "selesai").length;

    return (
        <Layout>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sesi Produksi</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Riwayat & monitoring produksi harian</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={route("production.sessions.active")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                        <Activity className="w-4 h-4" />
                        Sesi Aktif
                        {countBerjalan > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{countBerjalan}</span>
                        )}
                    </Link>
                    <Link href={route("production.sessions.create")}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        Mulai Sesi
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Cari Mesin / Produk</label>
                        <div className="flex">
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && applyFilter()}
                                placeholder="Cari nama mesin atau produk..."
                                className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none" />
                            <button onClick={() => applyFilter()}
                                className="border border-l-0 border-gray-300 rounded-r-lg px-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <Search className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                    {/* Status */}
                    <div className="w-44">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                        <select value={status} onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none">
                            <option value="">Semua Status</option>
                            <option value="berjalan">Berjalan</option>
                            <option value="selesai">Selesai</option>
                            <option value="dibatalkan">Dibatalkan</option>
                        </select>
                    </div>
                    {/* Produk */}
                    <div className="w-52">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Produk</label>
                        <select value={produkId} onChange={e => { setProdukId(e.target.value); applyFilter({ produk_id: e.target.value }); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none">
                            <option value="">Semua Produk</option>
                            {produks.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                    </div>
                    {/* Tanggal */}
                    <div className="w-44">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Mulai</label>
                        <input type="date" value={tanggal} onChange={e => { setTanggal(e.target.value); applyFilter({ tanggal: e.target.value }); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none" />
                    </div>
                    <button onClick={clearFilters}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors h-[42px]">
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            {["Mesin", "Produk", "Operator", "Mulai", "Selesai / Durasi", "Output", "Status", "Margin", ""].map(h => (
                                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sessions.data.length === 0 ? (
                            <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400">
                                Tidak ada sesi produksi. <Link href={route("production.sessions.create")} className="text-blue-600 hover:underline">Mulai sesi pertama →</Link>
                            </td></tr>
                        ) : sessions.data.map(s => {
                            const badge = STATUS_BADGE[s.status] || STATUS_BADGE.dibatalkan;
                            const StatusIcon = badge.icon;
                            const durasi = durasiMenit(s.mulai, s.selesai);
                            return (
                                <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-medium text-gray-900">{s.mesin?.nama || "-"}</p>
                                        <p className="text-xs text-gray-400">{s.titik?.nama || ""}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-700">{s.produk?.nama || "-"}</td>
                                    <td className="px-5 py-4 text-sm text-gray-600">{s.operator?.nama || "-"}</td>
                                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{fmtDT(s.mulai)}</td>
                                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                                        {s.selesai
                                            ? <><p>{fmtDT(s.selesai)}</p><p className="text-xs text-gray-400">{durasi} menit</p></>
                                            : s.status === "berjalan"
                                                ? <span className="flex items-center gap-1 text-blue-600 text-xs"><Clock className="w-3 h-3 animate-pulse" />Sedang berjalan</span>
                                                : "-"
                                        }
                                    </td>
                                    <td className="px-5 py-4 text-sm font-medium text-gray-800">
                                        {s.hasil_output != null ? `${s.hasil_output} ${s.produk?.satuan_output || ""}` : "-"}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                                            <StatusIcon className="w-3 h-3" />{badge.label}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm font-semibold">
                                        {s.margin != null
                                            ? <span className={s.margin >= 0 ? "text-emerald-700" : "text-red-600"}>{fmt(s.margin)}</span>
                                            : <span className="text-gray-300">-</span>
                                        }
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <Link href={route("production.sessions.show", s.id)}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                            {s.status === "berjalan" ? "⚡ Kelola" : "Detail"}
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-5 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    Menampilkan {sessions.from || 0}–{sessions.to || 0} dari {sessions.total || 0} sesi
                </p>
                <div className="flex gap-1">
                    {sessions.links?.map((link, i) => (
                        <button key={i} onClick={() => link.url && router.get(link.url)}
                            disabled={!link.url}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-3 py-1.5 rounded border text-sm transition-colors ${link.active ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        />
                    ))}
                </div>
            </div>
        </Layout>
    );
}
