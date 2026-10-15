import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus, Eye } from "lucide-react";

export default function Index({ serviceable, serviceableType, histories, filters = {}, sort, direction, can }) {
    const serviceableName = serviceable?.kode_unit || serviceable?.plat_nomor || serviceable?.nama || "Unit";

    const columns = [
        {
            key: "tanggal",
            label: "Tanggal",
            type: "dateRange",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (h) => new Date(h.tanggal).toLocaleDateString("id-ID"),
        },
        {
            key: "jenis_servis",
            label: "Jenis Servis",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-900",
            render: (h) => h.jenis_servis || "-",
        },
        {
            key: "biaya",
            label: "Biaya",
            search: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right",
            render: (h) => `Rp ${Number(h.biaya).toLocaleString("id-ID")}`,
        },
        {
            key: "purchase_order",
            label: "PO",
            type: "text",
            placeholder: "Cari kode PO...",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (h) => h.purchase_order?.kode_po || "-",
        },
        {
            key: "notes",
            label: "Catatan",
            type: "text",
            cellClassName: "px-4 py-3 text-sm text-gray-600 max-w-xs truncate",
            render: (h) => h.notes || "-",
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-right text-sm",
            render: (h) => (
                <Link
                    href={route("fleet.service-history.show", h.id)}
                    className="text-blue-600 hover:text-blue-900 inline-block"
                >
                    <Eye className="w-4 h-4" />
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Riwayat Servis" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Riwayat Servis</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {serviceableName} · {serviceableType}
                    </p>
                </div>
                <div className="flex gap-2">
                    {can?.create && (
                        <Link
                            href={route("fleet.service-history.create", { type: serviceableType, id: serviceable?.id })}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Catat Servis
                        </Link>
                    )}
                </div>
            </div>

            <DataTable
                routeName="fleet.service-history.index"
                routeParams={{ type: serviceableType, id: serviceable?.id }}
                columns={columns}
                rows={histories}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada data riwayat servis."
            />
        </AuthenticatedLayout>
    );
}
