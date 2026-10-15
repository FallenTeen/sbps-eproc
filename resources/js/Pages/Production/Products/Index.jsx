import React from "react";
import { Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import DataTable from "@/Components/DataTable";
import { Plus } from "lucide-react";

const KATEGORI_BADGE = {
    beton_cor: "bg-blue-100 text-blue-700",
    aspal: "bg-amber-100 text-amber-700",
    agregat: "bg-stone-100 text-stone-700",
    lainnya: "bg-gray-100 text-gray-700",
};

const KATEGORI_OPTIONS = [
    { value: "beton_cor", label: "Beton Cor" },
    { value: "aspal", label: "Aspal" },
    { value: "agregat", label: "Agregat" },
    { value: "lainnya", label: "Lainnya" },
];

function formatRupiah(n) {
    if (!n) return "-";
    return "Rp " + Number(n).toLocaleString("id-ID");
}

function HargaAktif(hargaArr) {
    if (!hargaArr || hargaArr.length === 0) return null;
    const today = new Date();
    return hargaArr.find((h) => {
        const dari = new Date(h.berlaku_dari);
        const sampai = h.berlaku_sampai ? new Date(h.berlaku_sampai) : null;
        return dari <= today && (!sampai || sampai >= today);
    });
}

export default function Index({ produks, unitBisnis, filters, sort, direction }) {
    const columns = [
        {
            key: "nama",
            label: "Nama Produk",
            type: "text",
            cellClassName: "px-4 py-4 text-sm font-semibold text-gray-900",
            render: (p) => p.nama,
        },
        {
            key: "kategori",
            label: "Kategori",
            type: "select",
            options: KATEGORI_OPTIONS,
            render: (p) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${KATEGORI_BADGE[p.kategori] || KATEGORI_BADGE.lainnya}`}>
                    {p.kategori?.replace("_", " ")}
                </span>
            ),
        },
        {
            key: "satuan_output",
            label: "Satuan Output",
            type: "select",
            options: [
                { value: "ton", label: "ton" },
                { value: "m3", label: "m3" },
            ],
            cellClassName: "px-4 py-4 text-sm text-gray-600",
            render: (p) => p.satuan_output,
        },
        {
            key: "unit_bisnis",
            label: "Unit Bisnis",
            type: "select",
            options: unitBisnis.map((ub) => ({ value: String(ub.id), label: ub.nama })),
            cellClassName: "px-4 py-4 text-sm text-gray-600",
            render: (p) => p.unit_bisnis?.nama || "-",
        },
        {
            key: "harga",
            label: "Harga Aktif",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-4 text-sm font-medium text-gray-900",
            render: (p) => {
                const hargaAktif = HargaAktif(p.harga_jual);
                return hargaAktif ? (
                    formatRupiah(hargaAktif.harga)
                ) : (
                    <span className="text-gray-400 italic text-xs">Belum ada harga</span>
                );
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
            render: (p) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.aktif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.aktif ? "AKTIF" : "NONAKTIF"}
                </span>
            ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-4 text-right",
            render: (p) => (
                <div className="flex items-center justify-end gap-3">
                    <Link href={route("production.produk.show", p.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Detail</Link>
                    <Link href={route("production.produk.edit", p.id)} className="text-sm text-amber-600 hover:text-amber-800 font-medium">Edit</Link>
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Katalog Produk</h1>
                <Link
                    href={route("production.produk.create")}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Tambah Produk
                </Link>
            </div>

            <DataTable
                routeName="production.produk.index"
                columns={columns}
                rows={produks}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada produk ditemukan."
            />
        </Layout>
    );
}
