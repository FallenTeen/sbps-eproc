import React from "react";
import { Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Eye, Printer } from "lucide-react";

export default function Index({ pembayarans, filters, sort, direction }) {
    const formatCurrency = (value) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);

    const columns = [
        { key: "po", label: "PO", type: "text", render: (item) => item.purchase_order?.kode_po || "-" },
        { key: "jumlah", label: "Jumlah", search: false, align: "right", render: (item) => formatCurrency(item.jumlah) },
        {
            key: "metode",
            label: "Metode",
            type: "select",
            options: [
                { value: "tunai", label: "Tunai" },
                { value: "transfer", label: "Transfer" },
                { value: "cek", label: "Cek" },
                { value: "lainnya", label: "Lainnya" },
            ],
            render: (item) => (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{item.metode}</span>
            ),
        },
        { key: "akun_kas", label: "Akun Kas", type: "text", render: (item) => item.akun_kas_bank?.nama || "-" },
        {
            key: "tanggal",
            label: "Tanggal",
            type: "dateRange",
            render: (item) => new Date(item.tanggal).toLocaleDateString("id-ID"),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm space-x-2",
            render: (item) => (
                <>
                    <Link href={route("procurement.pembayaran.show", item.id)} className="text-blue-600 hover:text-blue-900 inline-block">
                        <Eye className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={() => window.open(route("procurement.pembayaran.print", item.id), "_blank")}
                        className="text-green-600 hover:text-green-900 inline-block"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                </>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Riwayat Pembayaran PO</h1>
            </div>

            <DataTable
                routeName="procurement.pembayaran.index"
                columns={columns}
                rows={pembayarans}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
