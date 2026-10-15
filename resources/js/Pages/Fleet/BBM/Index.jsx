import React from "react";
import { Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Eye, Plus, AlertTriangle } from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Index({ bbmLogs, filters, sort, direction }) {
    const formatCurrency = (value) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);

    const columns = [
        {
            key: "tipe",
            label: "Tipe",
            type: "select",
            sortable: false,
            options: [
                { value: "armada", label: "🚛 Armada" },
                { value: "mesin", label: "🏭 Mesin" },
            ],
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (item) => (item.serviceable_type?.includes("Armada") ? "🚛 Armada" : "🏭 Mesin"),
        },
        {
            key: "unit",
            label: "Unit",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (item) => item.serviceable?.nama || item.serviceable?.kode_unit || item.serviceable?.plat_nomor || "-",
        },
        {
            key: "tanggal",
            label: "Tanggal",
            type: "dateRange",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (item) => formatTanggal(item.tanggal),
        },
        {
            key: "liter",
            label: "Liter",
            search: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right tabular-nums",
            render: (item) => `${item.liter} L`,
        },
        {
            key: "biaya",
            label: "Biaya",
            search: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right tabular-nums",
            render: (item) => formatCurrency(item.biaya),
        },
        {
            key: "sumber",
            label: "Sumber",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm",
            render: (item) =>
                item.pengisian_solar ? (
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-blue-700">Pengisian Solar Driver</span>
                        {item.pengisian_solar.foto_nota_url && (
                            <a href={item.pengisian_solar.foto_nota_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                                Lihat nota
                            </a>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-gray-500">Input Manual</span>
                ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-right text-sm",
            render: (item) => (
                <Link href={route("fleet.bbm.show", item.id)} className="text-blue-600 hover:text-blue-900 inline-flex">
                    <Eye className="w-4 h-4" />
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Pencatatan BBM</h1>
                <div className="flex gap-2">
                    <Link
                        href={route("fleet.bbm.anomaly")}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-1"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Anomali
                    </Link>
                    <Link
                        href={route("fleet.bbm.create")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Catat BBM
                    </Link>
                </div>
            </div>

            <DataTable
                routeName="fleet.bbm.index"
                columns={columns}
                rows={bbmLogs}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada data BBM."
            />
        </AuthenticatedLayout>
    );
}
