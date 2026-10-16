import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus, MapPin, Calendar } from "lucide-react";
import { formatTanggal } from "@/utils/date";

const STATUS_COLOR = {
    disetujui: "bg-green-100 text-green-800",
    ditagih: "bg-blue-100 text-blue-800",
};

function StatCard({ label, value, color = "blue" }) {
    const colors = {
        blue: "from-blue-600 to-blue-700",
        green: "from-green-600 to-green-700",
        amber: "from-amber-500 to-amber-600",
        purple: "from-purple-600 to-purple-700",
    };
    return (
        <div className={`rounded-xl bg-gradient-to-br ${colors[color]} text-white p-5 shadow-md`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    );
}

export default function RitaseIndex({ ritase, filters = {}, armadaList = [], stats = {}, can = {}, sort, direction }) {
    const { flash } = usePage().props;

    const columns = [
        {
            key: "tanggal",
            label: "Tanggal",
            type: "dateRange",
            cellClassName: "px-4 py-3 text-sm text-slate-700 whitespace-nowrap",
            render: (r) => (
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatTanggal(r.tanggal)}
                </div>
            ),
        },
        {
            key: "armada",
            label: "Armada / Driver",
            type: "select",
            options: armadaList.map((a) => ({
                value: String(a.id),
                label: [a.kode_unit, a.plat_nomor].filter(Boolean).join(" · "),
            })),
            cellClassName: "px-4 py-3",
            render: (r) => (
                <>
                    <p className="text-sm font-semibold text-slate-800">{r.armada?.kode_unit}</p>
                    <p className="text-xs text-slate-500">
                        {r.armada?.plat_nomor} · {r.driver?.nama ?? "–"}
                    </p>
                </>
            ),
        },
        {
            key: "driver",
            label: "Driver",
            type: "text",
            cellClassName: "px-4 py-3 text-sm text-slate-700",
            render: (r) => r.driver?.nama || "–",
        },
        {
            key: "rute",
            label: "Rute",
            type: "text",
            cellClassName: "px-4 py-3",
            render: (r) => (
                <div className="flex items-start gap-1 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span>
                        {r.rute_tarif
                            ? `${r.rute_tarif.lokasi_asal} → ${r.rute_tarif.lokasi_tujuan}`
                            : r.titik?.nama ?? "–"}
                    </span>
                </div>
            ),
        },
        {
            key: "jumlah_rit",
            label: "Trip / Volume",
            search: false,
            cellClassName: "px-4 py-3 text-sm text-slate-700",
            render: (r) => (
                <>
                    <span className="font-semibold">{r.jumlah_rit}x</span>
                    <span className="text-slate-400 mx-1">·</span>
                    {Number(r.jumlah_volume ?? 0).toLocaleString("id-ID")} {r.satuan_volume}
                </>
            ),
        },
        {
            key: "tarif_per_rit_snapshot",
            label: "Tarif/Trip",
            search: false,
            cellClassName: "px-4 py-3 text-sm text-slate-700 tabular-nums",
            render: (r) => `Rp ${Number(r.tarif_per_rit_snapshot ?? 0).toLocaleString("id-ID")}`,
        },
        {
            key: "total_upah_rit",
            label: "Total Upah",
            search: false,
            cellClassName: "px-4 py-3 text-sm font-semibold text-emerald-700 tabular-nums",
            render: (r) => `Rp ${Number(r.total_upah_rit ?? 0).toLocaleString("id-ID")}`,
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            options: [
                { value: "disetujui", label: "Disetujui" },
                { value: "ditagih", label: "Ditagih" },
            ],
            cellClassName: "px-4 py-3",
            render: (r) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {r.status}
                </span>
            ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-3",
            render: (r) => (
                <Link
                    href={route("fleet.armada.show", r.armada_id)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                    Detail
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Ritase Harian</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Rekap perjalanan dan upah borongan armada</p>
                    </div>
                    {(can?.create ?? true) && (
                        <Link
                            href={route("fleet.ritase.create")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Catat Ritase
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Ritase Harian" />

            {flash?.success && (
                <div className="mb-4 flex items-center bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    <span className="text-sm">{flash.success}</span>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Trip Hari Ini" value={stats.total_trip_today ?? 0} color="blue" />
                <StatCard label="Total Kubik Hari Ini" value={`${Number(stats.total_volume_today ?? 0).toLocaleString("id-ID")} m³`} color="green" />
                <StatCard label="Upah Borongan Bulan Ini" value={`Rp ${Number(stats.total_upah_bulan ?? 0).toLocaleString("id-ID")}`} color="amber" />
                <StatCard label="Armada Aktif Beroperasi" value={stats.armada_beroperasi ?? 0} color="purple" />
            </div>

            <DataTable
                routeName="fleet.ritase.index"
                columns={columns}
                rows={ritase}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Belum ada data ritase."
            />
        </AuthenticatedLayout>
    );
}
