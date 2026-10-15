import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus } from "lucide-react";

export default function Index({ pos, filters, sort, direction }) {
    const getStatusBadge = (status) => {
        const colors = {
            draft: "bg-gray-200 text-gray-800",
            diajukan: "bg-yellow-200 text-yellow-800",
            menunggu_approval_finance: "bg-blue-200 text-blue-800",
            menunggu_approval_owner: "bg-purple-200 text-purple-800",
            disetujui: "bg-green-200 text-green-800",
            diterima: "bg-indigo-200 text-indigo-800",
            dibayar_sebagian: "bg-orange-200 text-orange-800",
            lunas: "bg-emerald-200 text-emerald-800",
            ditolak: "bg-red-200 text-red-800",
        };
        return colors[status] || "bg-gray-200 text-gray-800";
    };

    const columns = [
        { key: "kode_po", label: "Kode", type: "text" },
        { key: "supplier", label: "Supplier", type: "text", render: (po) => po.supplier?.nama || "-" },
        { key: "proyek", label: "Proyek", type: "text", render: (po) => po.proyek?.nama || "-" },
        {
            key: "total",
            label: "Total",
            search: false,
            align: "right",
            render: (po) => "Rp " + Number(po.total).toLocaleString("id-ID"),
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            options: [
                { value: "draft", label: "Draft" },
                { value: "diajukan", label: "Diajukan" },
                { value: "menunggu_approval_finance", label: "Menunggu Finance" },
                { value: "menunggu_approval_owner", label: "Menunggu Owner" },
                { value: "disetujui", label: "Disetujui" },
                { value: "diterima", label: "Diterima" },
                { value: "dibayar_sebagian", label: "Dibayar Sebagian" },
                { value: "lunas", label: "Lunas" },
                { value: "ditolak", label: "Ditolak" },
            ],
            render: (po) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(po.status)}`}>
                    {po.status.replace(/_/g, " ")}
                </span>
            ),
        },
        {
            key: "created_at",
            label: "Tanggal",
            type: "dateRange",
            render: (po) => new Date(po.created_at).toLocaleDateString("id-ID"),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm",
            render: (po) => (
                <Link href={route("procurement.purchase-orders.show", po.id)} className="text-gray-900 hover:text-gray-600 underline">
                    Detail
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Purchase Orders" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                    <p className="mt-1 text-sm text-gray-500">Kelola semua purchase order pengadaan</p>
                </div>
                <Link
                    href={route("procurement.purchase-orders.create")}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Buat PO
                </Link>
            </div>

            <DataTable
                routeName="procurement.purchase-orders.index"
                columns={columns}
                rows={pos}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
