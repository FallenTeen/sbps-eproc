import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { Plus } from "lucide-react";

const STATUS_BADGE = {
    menunggu_hasil: "bg-yellow-200 text-yellow-800",
    lolos: "bg-green-200 text-green-800",
    tidak_lolos: "bg-red-200 text-red-800",
};

const STATUS_OPTIONS = [
    { value: "menunggu_hasil", label: "Menunggu Hasil" },
    { value: "lolos", label: "Lolos" },
    { value: "tidak_lolos", label: "Tidak Lolos" },
];

export default function Index({ samples, filters, sort, direction }) {
    const columns = [
        {
            key: "sesi",
            label: "Sesi",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (s) => s.session?.kode_sesi,
        },
        {
            key: "produk",
            label: "Produk",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (s) => s.session?.produk?.nama,
        },
        {
            key: "jenis_uji",
            label: "Jenis Uji",
            type: "select",
            options: [
                { value: "slump_test", label: "Slump Test" },
                { value: "uji_tekan", label: "Uji Tekan" },
            ],
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (s) => (s.jenis_uji === "slump_test" ? "Slump Test" : "Uji Tekan"),
        },
        {
            key: "nilai_slump",
            label: "Nilai Slump",
            search: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right",
            render: (s) => (s.nilai_slump != null ? s.nilai_slump : "-"),
        },
        {
            key: "hasil_uji_tekan",
            label: "Hasil Uji Tekan",
            search: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right",
            render: (s) => (s.hasil_uji_tekan != null ? s.hasil_uji_tekan + " MPa" : "-"),
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            options: STATUS_OPTIONS,
            render: (s) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[s.status] || "bg-gray-200 text-gray-800"}`}>
                    {s.status?.replace(/_/g, " ")}
                </span>
            ),
        },
        {
            key: "created_at",
            label: "Tanggal Dibuat",
            type: "dateRange",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (s) => new Date(s.created_at).toLocaleDateString("id-ID"),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="QC Samples" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">QC Samples</h1>
                    <p className="mt-1 text-sm text-gray-500">Daftar sampel uji mutu produksi</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={route("production.qc.pending")}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        Menunggu Hasil
                    </Link>
                    <Link
                        href={route("production.qc.create")}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Catat Sample
                    </Link>
                </div>
            </div>

            <DataTable
                routeName="production.qc.index"
                columns={columns}
                rows={samples}
                filters={filters}
                sort={sort}
                direction={direction}
            />
        </AuthenticatedLayout>
    );
}
