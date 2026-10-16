import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus, Edit, Eye, Trash2 } from "lucide-react";

export default function Index({
    ruteTarifs,
    unitBisnis = [],
    filters,
    sort,
    direction,
}) {
    const { auth } = usePage().props;
    const can = (permission) => auth?.permissions?.includes(permission);

    const isAktif = (r) => {
        if (!r.berlaku_dari) return false;
        const dari = new Date(r.berlaku_dari);
        const sampai = r.berlaku_sampai ? new Date(r.berlaku_sampai) : null;
        const today = new Date();
        if (today < dari) return false;
        if (sampai && today > sampai) return false;
        return true;
    };

    const columns = [
        {
            key: "lokasi_asal",
            label: "Asal",
            type: "text",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (r) => r.lokasi_asal,
        },
        {
            key: "lokasi_tujuan",
            label: "Tujuan",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (r) => r.lokasi_tujuan,
        },
        {
            key: "jarak_km",
            label: "Jarak (km)",
            search: false,
            align: "right",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right tabular-nums",
            render: (r) => Number(r.jarak_km).toLocaleString("id-ID"),
        },
        {
            key: "tarif_per_rit",
            label: "Tarif/Rit",
            search: false,
            align: "right",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right tabular-nums",
            render: (r) =>
                `Rp ${Number(r.tarif_per_rit).toLocaleString("id-ID")}`,
        },
        {
            key: "unit_bisnis",
            label: "Unit Bisnis",
            type: "select",
            options: unitBisnis.map((u) => ({
                value: String(u.id),
                label: u.nama,
            })),
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (r) => r.unit_bisnis?.nama || "-",
        },
        {
            key: "status",
            label: "Status",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-3 whitespace-nowrap",
            render: (r) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${isAktif(r) ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"}`}
                >
                    {isAktif(r) ? "Berlaku" : "Kadaluarsa"}
                </span>
            ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-right text-sm space-x-2",
            render: (r) => (
                <>
                    <Link
                        href={route("fleet.rute-tarif.show", r.id)}
                        className="text-blue-600 hover:text-blue-900 inline-block"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                    {can("manage fleet") && (
                        <Link
                            href={route("fleet.rute-tarif.edit", r.id)}
                            className="text-yellow-600 hover:text-yellow-900 inline-block"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                    )}
                    {can("manage fleet") && (
                        <button
                            onClick={() => {
                                if (
                                    window.confirm(
                                        "Yakin hapus rute tarif ini?",
                                    )
                                ) {
                                    router.delete(
                                        route("fleet.rute-tarif.destroy", r.id),
                                    );
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
            <Head title="Rute Tarif" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Rute Tarif
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Master tarif rute armada per unit bisnis
                    </p>
                </div>
                {can("manage fleet") && (
                    <Link
                        href={route("fleet.rute-tarif.create")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Rute
                    </Link>
                )}
            </div>

            <DataTable
                routeName="fleet.rute-tarif.index"
                columns={columns}
                rows={ruteTarifs}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada data rute tarif."
            />
        </AuthenticatedLayout>
    );
}
