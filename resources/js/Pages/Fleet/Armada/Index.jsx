import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import DataTable from "@/Components/DataTable";
import ImagePreviewModal from "@/Components/ImagePreviewModal";
import { Plus, Truck } from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";

const JENIS = {
    dump_truck: "Dump Truck",
    dump_truck_tronton: "Dump Truck Tronton",
    self_loader: "Self Loader",
    alat_berat: "Alat Berat",
    truck_molen: "Truck Molen",
    lainnya: "Lainnya",
};

const MODEL_TARIF = {
    ritase: "Ritase",
    sewa_jam: "Sewa / Jam",
    internal: "Internal",
};

const STATUS = {
    aktif: "bg-green-200 text-green-800",
    servis: "bg-yellow-200 text-yellow-800",
    nonaktif: "bg-red-200 text-red-800",
};

export default function Index({
    armadas,
    filters,
    sort,
    direction,
    unitBisnis = [],
    titiks = [],
}) {
    const [fotoPreview, setFotoPreview] = useState(null);

    const columns = [
        {
            key: "kode_unit",
            label: "Unit",
            type: "text",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (a) => (
                <div className="flex items-center gap-3">
                    {a.foto_thumb_url ? (
                        <button
                            type="button"
                            title="Lihat foto penuh"
                            onClick={() => setFotoPreview({
                            src: a.foto_url,
                            alt: `Foto ${a.kode_unit}`,
                        })}
                            className="block shrink-0 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <img
                                src={a.foto_thumb_url}
                                alt={`Foto ${a.kode_unit}`}
                                loading="lazy"
                                decoding="async"
                                className="h-10 w-10 object-cover shrink-0 rounded-md border border-slate-200"
                            />
                        </button>
                    ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
                            <Truck className="h-5 w-5" />
                        </span>
                    )}
                    <span className="font-medium text-slate-800">
                        {a.kode_unit}
                    </span>
                </div>
            ),
        },
        {
            key: "plat_nomor",
            label: "Plat Nomor",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (a) => a.plat_nomor || "-",
        },
        {
            key: "jenis",
            label: "Jenis",
            type: "select",
            options: Object.entries(JENIS).map(([value, label]) => ({
                value,
                label,
            })),
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (a) => JENIS[a.jenis] || a.jenis,
        },
        {
            key: "model_tarif",
            label: "Model Tarif",
            type: "select",
            options: Object.entries(MODEL_TARIF).map(([value, label]) => ({
                value,
                label,
            })),
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (a) => MODEL_TARIF[a.model_tarif] || a.model_tarif,
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
            render: (a) => a.unit_bisnis?.nama || "-",
        },
        {
            key: "titik",
            label: "Titik",
            type: "select",
            options: titiks.map((t) => ({
                value: String(t.id),
                label: t.nama,
            })),
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (a) => a.titik?.nama || "-",
        },
        {
            key: "driver",
            label: "Driver",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (a) => a.current_driver?.karyawan?.nama || "-",
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            options: [
                { value: "aktif", label: "Aktif" },
                { value: "servis", label: "Servis" },
                { value: "nonaktif", label: "Nonaktif" },
            ],
            cellClassName: "px-4 py-3 whitespace-nowrap",
            render: (a) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS[a.status] || "bg-gray-200 text-gray-800"}`}
                >
                    {a.status}
                </span>
            ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 whitespace-nowrap text-right text-sm",
            render: (a) => (
                <Link
                    href={route("fleet.armada.show", a.id)}
                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                >
                    <Truck className="w-4 h-4" />
                    Detail
                </Link>
            ),
        },
    ];

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Armada</h1>
                <PrimaryButton variant="outline" asChild>
                    <Link href={route("fleet.armada.create")}>
                        <span>Tambah Armada</span>
                    </Link>
                </PrimaryButton>
            </div>

            <DataTable
                routeName="fleet.armada.index"
                columns={columns}
                rows={armadas}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada data armada."
            />

            <ImagePreviewModal
                open={Boolean(fotoPreview)}
                onClose={() => setFotoPreview(null)}
                src={fotoPreview?.src}
                alt={fotoPreview?.alt}
                title={fotoPreview?.alt || "Pratinjau Foto"}
            />
        </Layout>
    );
}
