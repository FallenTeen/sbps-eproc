import React from "react";
import { Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import DataTable from "@/Components/DataTable";
import { Eye, Plus } from "lucide-react";
import { formatTanggal } from "@/utils/date";

const STATUS_OPTIONS = [
    { value: "dijadwalkan", label: "Dijadwalkan" },
    { value: "dalam_perjalanan", label: "Dalam Perjalanan" },
    { value: "selesai", label: "Selesai" },
    { value: "dibatalkan", label: "Dibatalkan" },
];

function getStatusColor(status) {
    switch (status) {
        case "dijadwalkan":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "dalam_perjalanan":
            return "bg-blue-100 text-blue-800 border-blue-200";
        case "selesai":
            return "bg-emerald-100 text-emerald-800 border-emerald-200";
        case "dibatalkan":
            return "bg-red-100 text-red-800 border-red-200";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

export default function Index({ pengirimen, filters, sort, direction }) {
    const columns = [
        {
            key: "waktu_muat",
            label: "Waktu Muat",
            type: "dateRange",
            cellClassName: "px-4 py-4 text-sm text-gray-700 whitespace-nowrap",
            render: (p) => formatTanggal(p.waktu_muat),
        },
        {
            key: "produk",
            label: "Sesi / Produk",
            type: "text",
            render: (p) => (
                <>
                    <div className="text-sm font-semibold text-gray-900">
                        {p.session?.produk?.nama}
                    </div>
                    <div className="text-xs text-gray-500">
                        Vol: {p.session?.hasil_output}{" "}
                        {p.session?.produk?.satuan_output}
                    </div>
                </>
            ),
        },
        {
            key: "tujuan",
            label: "Tujuan",
            type: "text",
            cellClassName: "px-4 py-4 text-sm text-gray-700 max-w-xs truncate",
            render: (p) => p.tujuan_alamat,
        },
        {
            key: "armada",
            label: "Armada",
            type: "text",
            cellClassName: "px-4 py-4 text-sm font-medium text-gray-900",
            render: (p) => p.armada?.nopol ?? "-",
        },
        {
            key: "driver",
            label: "Driver",
            type: "text",
            render: (p) => p.driver?.nama ?? "-",
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            options: STATUS_OPTIONS,
            render: (p) => (
                <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        getStatusColor(p.status)
                    }`}
                >
                    {p.status.replace("_", " ").toUpperCase()}
                </span>
            ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-4 text-right",
            render: (p) => (
                <Link
                    href={route("production.pengiriman.show", p.id)}
                    className="flex  gap-2 items-center text-blue-600 text-sm font-semibold px-3 py-1.5"
                >
                    <Eye className="h-4 w-4" />
                    Detail
                </Link>
            ),
        },
    ];

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Pengiriman Produksi
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Kelola jadwal dan riwayat pengiriman produk beton ke
                        proyek/customer.
                    </p>
                </div>
                <Link
                    href={route("production.pengiriman.create")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Jadwalkan Baru
                </Link>
            </div>

            <DataTable
                routeName="production.pengiriman.index"
                columns={columns}
                rows={pengirimen}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada data pengiriman."
            />
        </Layout>
    );
}
