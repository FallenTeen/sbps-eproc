import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus, Eye } from "lucide-react";
import { formatTanggal } from "@/utils/date";

const STATUS_META = {
    diajukan: { label: "Diajukan", cls: "bg-blue-100 text-blue-700" },
    disetujui: { label: "Disetujui", cls: "bg-indigo-100 text-indigo-700" },
    ditolak: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
    dikerjakan: { label: "Dikerjakan", cls: "bg-amber-100 text-amber-700" },
    menunggu_sparepart: { label: "Menunggu Sparepart", cls: "bg-yellow-100 text-yellow-800" },
    sparepart_tersedia: { label: "Sparepart Tersedia", cls: "bg-teal-100 text-teal-700" },
    selesai: { label: "Selesai", cls: "bg-green-100 text-green-700" },
};

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, m]) => ({
    value,
    label: m.label,
}));

export default function Index({ pengajuans, filters = {}, sort, direction }) {
    const { auth } = usePage().props;
    const permissions = auth?.permissions || [];
    const canSubmit =
        permissions.includes("manage fleet service") ||
        permissions.includes("submit fleet service") ||
        permissions.includes("manage fleet");

    const columns = [
        {
            key: "kode_pengajuan",
            label: "No. Pengajuan",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (p) => p.kode_pengajuan,
        },
        {
            key: "armada",
            label: "Armada",
            type: "text",
            placeholder: "Cari plat...",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-900",
            render: (p) => (
                <>
                    {p.armada?.plat_nomor}
                    <span className="block text-xs text-gray-400">{p.armada?.kode_unit}</span>
                </>
            ),
        },
        {
            key: "diajukan_oleh",
            label: "Diajukan",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (p) => p.diajukan_oleh?.name || "-",
        },
        {
            key: "tanggal_ajuan",
            label: "Tanggal",
            type: "dateRange",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (p) => formatTanggal(p.tanggal_ajuan),
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            options: STATUS_OPTIONS,
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm",
            render: (p) => {
                const meta = STATUS_META[p.status] || { label: p.status, cls: "bg-gray-100 text-gray-600" };
                return (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>
                        {meta.label}
                    </span>
                );
            },
        },
        {
            key: "total_biaya",
            label: "Biaya",
            search: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-right text-sm tabular-nums",
            render: (p) => Number(p.total_biaya || 0).toLocaleString("id-ID"),
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
                    href={route("fleet.servis-armada.show", p.id)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                >
                    <Eye className="w-4 h-4" /> Detail
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Servis Armada" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sistem Servis Armada</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Alur ajuan &rarr; approval &rarr; workshop &rarr; sparepart (multi-bagian)
                    </p>
                </div>
                {canSubmit && (
                    <Link
                        href={route("fleet.servis-armada.create")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Ajukan Servis
                    </Link>
                )}
            </div>

            <DataTable
                routeName="fleet.servis-armada.index"
                columns={columns}
                rows={pengajuans}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Belum ada pengajuan servis armada."
            />
        </AuthenticatedLayout>
    );
}
