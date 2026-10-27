import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus, Eye } from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Index({ formulirs, filters, sort, direction }) {
    const columns = [
        {
            key: "karyawan",
            label: "Karyawan",
            type: "text",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (f) => f.presensi?.karyawan?.nama || "-",
        },
        {
            key: "tanggal",
            label: "Tanggal",
            type: "dateRange",
            render: (f) =>
                f.presensi?.check_in ? formatTanggal(f.presensi.check_in) : "-",
        },
        {
            key: "aktivitas",
            label: "Aktivitas",
            type: "text",
            cellClassName: "px-4 py-3 text-sm text-gray-600 max-w-xs truncate",
            render: (f) => f.aktivitas_dilakukan,
        },
        {
            key: "kondisi_area",
            label: "Kondisi Area",
            type: "text",
            cellClassName: "px-4 py-3 text-sm text-gray-600 max-w-xs truncate",
            render: (f) => f.kondisi_area || "-",
        },
        {
            key: "kendala",
            label: "Kendala",
            type: "text",
            cellClassName: "px-4 py-3 text-sm text-gray-600 max-w-xs truncate",
            render: (f) => f.kendala || "-",
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-right text-sm",
            render: (f) => (
                <Link
                    href={route("attendance.formulir.show", f.id)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                >
                    <Eye className="w-4 h-4" />
                    Detail
                </Link>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Formulir Lapangan" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Formulir Lapangan
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Laporan kondisi area dan aktivitas pekerjaan lapangan
                    </p>
                </div>
                <Link
                    href={route("attendance.formulir.create")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Buat Formulir
                </Link>
            </div>

            <DataTable
                routeName="attendance.formulir.index"
                columns={columns}
                rows={formulirs}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
