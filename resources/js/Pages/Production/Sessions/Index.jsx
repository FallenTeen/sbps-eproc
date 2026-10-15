import React from "react";
import { Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import DataTable from "@/Components/DataTable";
import { Plus, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";

const STATUS_BADGE = {
    berjalan: { cls: "bg-blue-100 text-blue-800 border border-blue-200", icon: Activity, label: "BERJALAN" },
    selesai: { cls: "bg-emerald-100 text-emerald-800 border border-emerald-200", icon: CheckCircle2, label: "SELESAI" },
    dibatalkan: { cls: "bg-gray-100 text-gray-600 border border-gray-200", icon: XCircle, label: "DIBATALKAN" },
};

function fmt(n) {
    if (n == null || n === "") return "-";
    return "Rp " + Number(n).toLocaleString("id-ID");
}
function fmtDT(d) {
    if (!d) return "-";
    return new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function durasiMenit(mulai, selesai) {
    if (!mulai || !selesai) return null;
    return Math.round((new Date(selesai) - new Date(mulai)) / 60000);
}

export default function Index({ sessions, produks, filters, sort, direction }) {
    const countBerjalan = sessions.data.filter((s) => s.status === "berjalan").length;

    const columns = [
        {
            key: "mesin",
            label: "Mesin",
            type: "text",
            render: (s) => (
                <>
                    <p className="text-sm font-medium text-gray-900">{s.mesin?.nama || "-"}</p>
                    <p className="text-xs text-gray-400">{s.titik?.nama || ""}</p>
                </>
            ),
        },
        {
            key: "produk",
            label: "Produk",
            type: "select",
            options: produks.map((p) => ({ value: String(p.id), label: p.nama })),
            cellClassName: "px-4 py-4 text-sm text-gray-700",
            render: (s) => s.produk?.nama || "-",
        },
        {
            key: "operator",
            label: "Operator",
            type: "text",
            cellClassName: "px-4 py-4 text-sm text-gray-600",
            render: (s) => s.operator?.nama || "-",
        },
        {
            key: "mulai",
            label: "Mulai",
            type: "dateRange",
            cellClassName: "px-4 py-4 text-sm text-gray-600 whitespace-nowrap",
            render: (s) => fmtDT(s.mulai),
        },
        {
            key: "selesai",
            label: "Selesai / Durasi",
            search: false,
            cellClassName: "px-4 py-4 text-sm text-gray-600 whitespace-nowrap",
            render: (s) => {
                if (s.selesai) {
                    return (
                        <>
                            <p>{fmtDT(s.selesai)}</p>
                            <p className="text-xs text-gray-400">{durasiMenit(s.mulai, s.selesai)} menit</p>
                        </>
                    );
                }
                if (s.status === "berjalan") {
                    return (
                        <span className="flex items-center gap-1 text-blue-600 text-xs">
                            <Clock className="w-3 h-3 animate-pulse" />Sedang berjalan
                        </span>
                    );
                }
                return "-";
            },
        },
        {
            key: "output",
            label: "Output",
            search: false,
            cellClassName: "px-4 py-4 text-sm font-medium text-gray-800",
            render: (s) => (s.hasil_output != null ? `${s.hasil_output} ${s.produk?.satuan_output || ""}` : "-"),
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            options: [
                { value: "berjalan", label: "Berjalan" },
                { value: "selesai", label: "Selesai" },
                { value: "dibatalkan", label: "Dibatalkan" },
            ],
            render: (s) => {
                const badge = STATUS_BADGE[s.status] || STATUS_BADGE.dibatalkan;
                const StatusIcon = badge.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                        <StatusIcon className="w-3 h-3" />{badge.label}
                    </span>
                );
            },
        },
        {
            key: "margin",
            label: "Margin",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-4 text-sm font-semibold",
            render: (s) =>
                s.margin != null ? (
                    <span className={s.margin >= 0 ? "text-emerald-700" : "text-red-600"}>{fmt(s.margin)}</span>
                ) : (
                    <span className="text-gray-300">-</span>
                ),
        },
        {
            key: "aksi",
            label: "",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-4 text-right",
            render: (s) => (
                <Link href={route("production.sessions.show", s.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    {s.status === "berjalan" ? "Kelola" : "Detail"}
                </Link>
            ),
        },
    ];

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sesi Produksi</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Riwayat & monitoring produksi harian</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route("production.sessions.active")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                        <Activity className="w-4 h-4" />
                        Sesi Aktif
                        {countBerjalan > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{countBerjalan}</span>
                        )}
                    </Link>
                    <Link
                        href={route("production.sessions.create")}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Mulai Sesi
                    </Link>
                </div>
            </div>

            <DataTable
                routeName="production.sessions.index"
                columns={columns}
                rows={sessions}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada sesi produksi."
            />
        </Layout>
    );
}
