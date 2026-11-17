import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { formatTanggal } from "@/utils/date";
import { Search, SearchX, Edit, Save, ArrowLeft } from "lucide-react";

const JENIS = {
    dump_truck: "Dump Truck",
    dump_truck_tronton: "Dump Truck Tronton",
    self_loader: "Self Loader",
    alat_berat: "Alat Berat",
    truck_molen: "Truck Molen",
    lainnya: "Lainnya",
};

export default function TaraMaster({ rows, filters, sort, direction }) {
    const { flash } = usePage().props;
    const [editId, setEditId] = useState(null);
    const [tara, setTara] = useState("");

    const save = (e, armada) => {
        e.preventDefault();
        router.put(
            route("logistik.tara-master.update", armada.id),
            { tara_master_kg: tara },
            {
                preserveScroll: true,
                onSuccess: () => setEditId(null),
            },
        );
    };

    const columns = [
        { key: "plat_nomor", label: "Plat", type: "text", sortable: true },
        { key: "kode_unit", label: "Kode Unit", type: "text", sortable: true },
        {
            key: "jenis",
            label: "Jenis",
            type: "select",
            options: Object.entries(JENIS).map(([value, label]) => ({ value, label })),
            sortable: true,
            render: (a) => JENIS[a.jenis] ?? a.jenis ?? "-",
        },
        {
            key: "tara_master_kg",
            label: "Tara Master (kg)",
            type: "text",
            sortable: true,
            render: (a) => (
                editId === a.id ? (
                    <input
                        type="number"
                        step="0.01"
                        className="w-32 rounded border-gray-300 text-sm"
                        value={tara}
                        onChange={(e) => setTara(e.target.value)}
                    />
                ) : (
                    Number(a.tara_master_kg ?? 0).toLocaleString("id-ID")
                )
            ),
        },
        { key: "tara_diperbarui_pada", label: "Diperbarui", type: "date", sortable: true, render: (a) => formatTanggal(a.tara_diperbarui_pada) ?? "-" },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 text-right text-sm",
            render: (a) => (
                editId === a.id ? (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={(e) => save(e, a)}
                            className="flex gap-2 items-center rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                        >
                            <Save className="h-4 w-4" />
                            Simpan
                        </button>
                        <button
                            onClick={() => setEditId(null)}
                            className="flex gap-2 items-center rounded border px-3 py-1.5 text-xs bg-gray-600 text-white hover:bg-gray-700"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Batal
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            setEditId(a.id);
                            setTara(a.tara_master_kg ?? "");
                        }}
                        className="flex gap-2 items-center rounded bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                    >
                        <Edit className="w-4 h-4" />
                        Ubah
                    </button>
                )
            ),
        },
    ];

    return (
        <AuthenticatedLayout title="Tara Master">
            <div className="space-y-4">
                {flash?.success && (
                    <div className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}

                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Tara Master Armada (Logistik)
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Tara default (kg) dipakai sebagai berat kosong
                                saat penimbangan, dapat ditimpa per ritase
                                dengan opsi timbang ulang.
                            </p>
                        </div>
                    </div>
                </div>

                <DataTable
                    routeName="logistik.tara-master.index"
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