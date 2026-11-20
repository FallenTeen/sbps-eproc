import React from "react";
import { Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Eye, Check, X } from "lucide-react";
import { formatTanggal } from "@/utils/date";

const getStatusBadge = (kondisi) =>
    kondisi ? (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800 inline-flex items-center gap-1">
            <Check className="w-3 h-3" /> Baik
        </span>
    ) : (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800 inline-flex items-center gap-1">
            <X className="w-3 h-3" /> Bermasalah
        </span>
    );

export default function Index({ checklists, filters, sort, direction }) {
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
            render: (item) => (item.checkable_type?.includes("Armada") ? "🚛 Armada" : "🏭 Mesin"),
        },
        {
            key: "unit",
            label: "Unit",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (item) => item.checkable?.nama || item.checkable?.kode_unit || item.checkable?.plat_nomor || "-",
        },
        {
            key: "kondisi",
            label: "Kondisi",
            type: "select",
            sortable: false,
            options: [
                { value: "1", label: "Baik" },
                { value: "0", label: "Bermasalah" },
            ],
            cellClassName: "px-4 py-3 whitespace-nowrap",
            render: (item) => (
                <>
                    {getStatusBadge(item.kondisi_baik)}
                    {!item.kondisi_baik && item.item_bermasalah && (
                        <span className="ml-2 text-xs text-gray-500">({item.item_bermasalah})</span>
                    )}
                </>
            ),
        },
        {
            key: "status",
            label: "Status",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-3 whitespace-nowrap",
            render: (item) =>
                item.akhir ? (
                    <div className="flex flex-col gap-1">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-800 inline-flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" /> Selesai
                        </span>
                        {item.akhir.odo_anomali && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-200 text-amber-800 w-fit">ODO Anomali</span>
                        )}
                    </div>
                ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">Berjalan</span>
                ),
        },
        {
            key: "dicatat_oleh",
            label: "Dicatat Oleh",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (item) => item.dicatat_oleh?.nama || "-",
        },
        {
            key: "tanggal",
            label: "Tanggal",
            type: "dateRange",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (item) => formatTanggal(item.tanggal),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-right text-sm",
            render: (item) => (
                <Link href={route("fleet.checklist-harian.show", item.id)} className="text-blue-600 hover:text-blue-900 inline-block">
                    <Eye className="w-4 h-4" />
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Checklist Harian</h1>
            </div>

            <DataTable
                routeName="fleet.checklist-harian.index"
                columns={columns}
                rows={checklists}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada data checklist."
            />
        </AuthenticatedLayout>
    );
}
