import React from "react";
import { Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import DataTable from "@/Components/DataTable";
import { Plus, Truck } from "lucide-react";

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

export default function Index({ armadas, filters, sort, direction, unitBisnis = [], titiks = [] }) {
    const columns = [
        {
            key: "kode_unit",
            label: "Unit",
            type: "text",
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900",
            render: (a) => a.kode_unit,
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
            options: Object.entries(JENIS).map(([value, label]) => ({ value, label })),
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (a) => JENIS[a.jenis] || a.jenis,
        },
        {
            key: "model_tarif",
            label: "Model Tarif",
            type: "select",
            options: Object.entries(MODEL_TARIF).map(([value, label]) => ({ value, label })),
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (a) => MODEL_TARIF[a.model_tarif] || a.model_tarif,
        },
        {
            key: "unit_bisnis",
            label: "Unit Bisnis",
            type: "select",
            options: unitBisnis.map((u) => ({ value: String(u.id), label: u.nama })),
            cellClassName: "px-4 py-3 whitespace-nowrap text-sm text-gray-600",
            render: (a) => a.unit_bisnis?.nama || "-",
        },
        {
            key: "titik",
            label: "Titik",
            type: "select",
            options: titiks.map((t) => ({ value: String(t.id), label: t.nama })),
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
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS[a.status] || "bg-gray-200 text-gray-800"}`}>
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
                <Link href={route("fleet.armada.show", a.id)} className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
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
                <Link
                    href={route("fleet.armada.create")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Armada
                </Link>
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
        </Layout>
    );
}
