import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus, Edit, Eye, Trash2 } from "lucide-react";

export default function Index({ bahanBakus, filters, sort, direction }) {
    const { auth } = usePage().props;
    const permissions = auth?.permissions || [];
    const can = (permission) => permissions.includes(permission);

    const columns = [
        { key: "kode", label: "Kode", type: "text" },
        { key: "nama", label: "Nama", type: "text" },
        {
            key: "kategori",
            label: "Kategori",
            type: "select",
            options: [
                { value: "bahan_baku", label: "Bahan Baku" },
                { value: "sparepart", label: "Sparepart" },
            ],
            render: (b) => (b.kategori === "bahan_baku" ? "Bahan Baku" : "Sparepart"),
        },
        { key: "satuan", label: "Satuan", type: "text" },
        {
            key: "harga",
            label: "Harga Terakhir",
            search: false,
            sortable: false,
            align: "right",
            render: (b) => {
                const harga = b.harga_beli?.[0]?.harga;
                return harga != null ? "Rp " + Number(harga).toLocaleString("id-ID") : "-";
            },
        },
        {
            key: "aktif",
            label: "Status",
            type: "select",
            options: [
                { value: "1", label: "Aktif" },
                { value: "0", label: "Nonaktif" },
            ],
            render: (b) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.aktif ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                    {b.aktif ? "Aktif" : "Nonaktif"}
                </span>
            ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm space-x-2",
            render: (b) => (
                <>
                    <Link href={route("procurement.bahan-baku.show", b.id)} className="text-blue-600 hover:text-blue-900 inline-block">
                        <Eye className="w-4 h-4" />
                    </Link>
                    {can("manage procurement") && (
                        <Link href={route("procurement.bahan-baku.edit", b.id)} className="text-yellow-600 hover:text-yellow-900 inline-block">
                            <Edit className="w-4 h-4" />
                        </Link>
                    )}
                    {can("manage procurement") && (
                        <button
                            onClick={() => {
                                if (window.confirm("Yakin hapus bahan baku ini?")) {
                                    router.delete(route("procurement.bahan-baku.destroy", b.id));
                                }
                            }}
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
            <Head title="Bahan Baku" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bahan Baku</h1>
                    <p className="mt-1 text-sm text-gray-500">Master bahan baku &amp; sparepart</p>
                </div>
                {can("manage procurement") && (
                    <Link
                        href={route("procurement.bahan-baku.create")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Bahan Baku
                    </Link>
                )}
            </div>

            <DataTable
                routeName="procurement.bahan-baku.index"
                columns={columns}
                rows={bahanBakus}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
