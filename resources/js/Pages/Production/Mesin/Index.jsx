import React from "react";
import { Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import DataTable from "@/Components/DataTable";
import { Plus, AlertTriangle, CheckCircle2, Eye, Edit } from "lucide-react";

const STATUS_BADGE = {
    aktif: "bg-emerald-200 text-emerald-800",
    servis: "bg-yellow-200 text-yellow-800",
    nonaktif: "bg-red-200 text-red-800",
};

function checkServisJatuhTempo(item) {
    if (item.status === "nonaktif") return false;
    if (!item.service_histories || item.service_histories.length === 0)
        return true;

    const lastService = new Date(item.service_histories[0].tanggal);
    const diffDays = Math.ceil(
        Math.abs(new Date() - lastService) / (1000 * 60 * 60 * 24),
    );

    return diffDays > 30;
}

export default function Index({
    mesin,
    filters,
    sort,
    direction,
    unitBisnis = [],
    jenisOptions = [],
}) {
    const columns = [
        {
            key: "nama",
            label: "Nama",
            type: "text",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (item) => (
                <>
                    {item.nama}
                    {item.produk_default && (
                        <div className="text-xs text-blue-600 mt-1 font-normal">
                            Output: {item.produk_default.nama_produk}
                        </div>
                    )}
                </>
            ),
        },
        {
            key: "jenis",
            label: "Jenis",
            type: "select",
            options: jenisOptions.map((j) => ({ value: j, label: j })),
            render: (item) => item.jenis,
        },
        {
            key: "unit_bisnis",
            label: "Unit / Titik",
            type: "select",
            options: unitBisnis.map((ub) => ({
                value: String(ub.id),
                label: ub.nama,
            })),
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (item) => (
                <>
                    <div className="font-medium text-gray-800">
                        {item.unit_bisnis?.nama}
                    </div>
                    <div className="text-xs text-gray-500">
                        {item.titik?.nama || "-"}
                    </div>
                </>
            ),
        },
        {
            key: "kapasitas",
            label: "Kapasitas",
            search: false,
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (item) => item.kapasitas || "-",
        },
        {
            key: "status",
            label: "Status & Servis",
            type: "select",
            options: [
                { value: "aktif", label: "Aktif" },
                { value: "servis", label: "Servis" },
                { value: "nonaktif", label: "Nonaktif" },
            ],
            cellClassName: "px-4 py-3 whitespace-nowrap",
            render: (item) => {
                const jatuhTempo = checkServisJatuhTempo(item);
                return (
                    <div className="flex flex-col gap-2 items-start">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[item.status] || STATUS_BADGE.nonaktif}`}
                        >
                            {item.status.toUpperCase()}
                        </span>
                        {jatuhTempo ? (
                            <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                Servis Jatuh Tempo
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                Servis Aman
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-right text-sm",
            render: (item) => (
                <>
                    <div className="flex">
                        <Link
                            href={route("production.mesin.show", item.id)}
                            className="text-blue-600 hover:text-blue-700 font-medium mr-4"
                        >
                            <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                            href={route("production.mesin.edit", item.id)}
                            className="text-amber-600 hover:text-amber-700 font-medium"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                    </div>
                </>
            ),
        },
    ];

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Mesin Produksi
                </h1>
                <Link
                    href={route("production.mesin.create")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Mesin
                </Link>
            </div>

            <DataTable
                routeName="production.mesin.index"
                columns={columns}
                rows={mesin}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada data mesin."
            />
        </Layout>
    );
}
