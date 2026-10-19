import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus, Trash2 } from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Index({ opnames, titiks, filters, sort, direction }) {
    const { auth } = usePage().props;
    const permissions = auth?.permissions || [];
    const canManage =
        permissions.includes("manage stok opname") ||
        permissions.includes("manage procurement");

    const columns = [
        {
            key: "tanggal",
            label: "Tanggal",
            type: "dateRange",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-900",
            render: (o) => formatTanggal(o.tanggal),
        },
        {
            key: "item",
            label: "Item",
            type: "text",
            cellClassName: "px-4 py-3 text-sm text-gray-900",
            render: (o) => (
                <>
                    {o.bahan_baku?.nama}
                    <span className="block text-xs text-gray-400">
                        {o.bahan_baku?.kode}
                    </span>
                </>
            ),
        },
        {
            key: "kategori",
            label: "Kategori",
            type: "select",
            options: [
                { value: "bahan_baku", label: "Bahan Baku" },
                { value: "sparepart", label: "Sparepart" },
            ],
            render: (o) => (
                <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        o.bahan_baku?.kategori === "sparepart"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                >
                    {o.bahan_baku?.kategori === "sparepart"
                        ? "Sparepart"
                        : "Bahan Baku"}
                </span>
            ),
        },
        {
            key: "titik",
            label: "Titik",
            type: "select",
            options: titiks.map((t) => ({
                value: String(t.id),
                label: t.nama,
            })),
            render: (o) => o.titik?.nama || "-",
        },
        {
            key: "saldo_sistem",
            label: "Saldo Sistem",
            search: false,
            align: "right",
            cellClassName: "px-4 py-3 text-right text-sm tabular-nums",
            render: (o) => o.saldo_sistem,
        },
        {
            key: "saldo_fisik",
            label: "Saldo Fisik",
            search: false,
            align: "right",
            cellClassName: "px-4 py-3 text-right text-sm tabular-nums",
            render: (o) => o.saldo_fisik,
        },
        {
            key: "selisih",
            label: "Selisih",
            search: false,
            align: "right",
            cellClassName:
                "px-4 py-3 text-right text-sm font-semibold tabular-nums",
            render: (o) => (
                <span
                    className={
                        o.selisih === 0
                            ? "text-gray-500"
                            : o.selisih > 0
                              ? "text-green-600"
                              : "text-red-600"
                    }
                >
                    {o.selisih > 0 ? "+" : ""}
                    {o.selisih}
                </span>
            ),
        },
        {
            key: "dicatat_oleh",
            label: "Dicatat",
            type: "text",
            cellClassName: "px-4 py-3 text-sm text-gray-500",
            render: (o) => o.dicatat_oleh?.name || "-",
        },
    ];

    if (canManage) {
        columns.push({
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-right text-sm",
            render: (o) => (
                <button
                    onClick={() => {
                        if (window.confirm("Hapus baris opname ini?")) {
                            router.delete(
                                route("inventory.stok-opname.destroy", o.id),
                            );
                        }
                    }}
                    className="text-red-600 hover:text-red-900 inline-flex"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stok Opname" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Stok Opname
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Checklist inventarisasi: cocokkan saldo sistem vs saldo
                        fisik
                    </p>
                </div>
                {canManage && (
                    <Link
                        href={route("inventory.stok-opname.create")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Catat Opname
                    </Link>
                )}
            </div>

            <DataTable
                routeName="inventory.stok-opname.index"
                columns={columns}
                rows={opnames}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Belum ada stok opname yang cocok dengan filter."
            />
        </AuthenticatedLayout>
    );
}
