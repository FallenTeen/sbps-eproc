import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

export default function Index({ suppliers, filters, sort, direction }) {
    const { auth } = usePage().props;

    const permissions = auth?.permissions || [];
    const can = (permission) => permissions.includes(permission);

    const handleDelete = (id) => {
        if (window.confirm("Yakin hapus supplier ini?")) {
            router.delete(route("procurement.supplier.destroy", id));
        }
    };

    const columns = [
        { key: "kode", label: "Kode", type: "text" },
        {
            key: "nama",
            label: "Nama",
            type: "text",
            render: (s) => (
                <Link
                    href={route("procurement.supplier.show", s.id)}
                    className="text-gray-600 hover:text-blue-600"
                >
                    {s.nama}
                </Link>
            ),
        },
        { key: "kontak", label: "Kontak", type: "text", render: (s) => s.kontak || "-" },
        { key: "telepon", label: "Telepon", type: "text", render: (s) => s.telepon || "-" },
        {
            key: "aktif",
            label: "Status",
            type: "select",
            options: [
                { value: "1", label: "Aktif" },
                { value: "0", label: "Nonaktif" },
            ],
            render: (s) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        s.aktif ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                    }`}
                >
                    {s.aktif ? "Aktif" : "Nonaktif"}
                </span>
            ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 text-right text-sm space-x-2",
            render: (s) => (
                <>
                    {can("manage procurement") && (
                        <>
                            <Link
                                href={route("procurement.supplier.show", s.id)}
                                className="text-blue-600 hover:text-blue-900 inline-block"
                            >
                                <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                                href={route("procurement.supplier.edit", s.id)}
                                className="text-yellow-600 hover:text-yellow-900 inline-block"
                            >
                                <Edit className="w-4 h-4" />
                            </Link>
                        </>
                    )}
                    {can("manage procurement") && (
                        <button
                            onClick={() => handleDelete(s.id)}
                            className="text-red-600 hover:text-red-900 inline-block"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Supplier" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Supplier</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Master data supplier pengadaan
                    </p>
                </div>
                {can("manage procurement") && (
                    <Link
                        href={route("procurement.supplier.create")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Supplier
                    </Link>
                )}
            </div>

            <DataTable
                routeName="procurement.supplier.index"
                columns={columns}
                rows={suppliers}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
