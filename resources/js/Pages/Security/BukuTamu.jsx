import React from "react";
import { router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { formatTanggal } from "@/utils/date";
import { CheckCheck, HardDriveDownload, ShieldX } from "lucide-react";

const KENDARAAN = ["tanpa_kendaraan", "motor", "mobil", "truk", "lainnya"];

export default function BukuTamu({ rows, filters, sort, direction }) {
    const { flash } = usePage().props;

    const keluar = (id) => {
        router.post(
            route("security.buku-tamu.keluar", id),
            {},
            { preserveScroll: true },
        );
    };

    const columns = [
        { key: "waktu_masuk", label: "Masuk", type: "date", sortable: true, render: (t) => formatTanggal(t.waktu_masuk) ?? "-" },
        {
            key: "nama",
            label: "Nama",
            type: "text",
            sortable: true,
            render: (t) => (
                <>
                    {t.nama}{" "}
                    {t.jumlah_orang ? `(${t.jumlah_orang} org)` : ""}
                </>
            ),
        },
        { key: "asal", label: "Asal", type: "text", sortable: true },
        {
            key: "kendaraan",
            label: "Kendaraan",
            type: "select",
            options: KENDARAAN.map((k) => ({ value: k, label: k.replace(/_/g, " ") })),
            sortable: true,
            render: (t) => `${t.kendaraan ?? "-"} ● ${t.plat_nomor ?? ""}`,
        },
        {
            key: "waktu_keluar",
            label: "Keluar",
            type: "date",
            sortable: true,
            render: (t) =>
                !t.waktu_keluar ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
                        <ShieldX className="w-3 h-3 text-red-600" />
                        Menunggu
                    </span>
                ) : (
                    formatTanggal(t.waktu_keluar)
                ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 text-right text-sm",
            render: (t) =>
                !t.waktu_keluar && (
                    <button
                        onClick={() => keluar(t.id)}
                        className="flex gap-2 items-center rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Tandai Keluar
                    </button>
                ),
        },
    ];

    return (
        <AuthenticatedLayout title="Buku Tamu">
            <div className="space-y-4">
                {flash?.success && (
                    <div className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Buku Tamu (Security)</h1>
                    <a
                        href={route("security.buku-tamu.export", { filters })}
                        className="flex gap-2 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        <HardDriveDownload className="w-4 h-4" />
                        Export Excel
                    </a>
                </div>

                <DataTable
                    routeName="security.buku-tamu.index"
                    columns={columns}
                    rows={rows}
                    filters={filters}
                    sort={sort}
                    direction={direction}
                />
            </div>
        </AuthenticatedLayout>
    );
}