import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import { formatTanggal } from "@/utils/date";
import { ExternalLink, Edit, Save, ArrowLeft } from "lucide-react";

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
                <div className="flex flex-wrap justify-end gap-2">
                    {editId === a.id ? (
                        <>
                            <button
                                onClick={(e) => save(e, a)}
                                className="flex items-center gap-2 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                            >
                                <Save className="h-4 w-4" />
                                Simpan
                            </button>
                            <button
                                onClick={() => setEditId(null)}
                                className="flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Batal
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => router.visit(route("fleet.armada.show", a.id))}
                                className="flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Lihat Armada
                            </button>
                            <button
                                onClick={() => {
                                    setEditId(a.id);
                                    setTara(a.tara_master_kg ?? "");
                                }}
                                className="flex items-center gap-2 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                            >
                                <Edit className="w-4 h-4" />
                                Ubah
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout title="Tara Master">
            <div className="space-y-6 pb-6">
                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
                        {flash.success}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tara Master Armada</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Tara default (kg) dipakai sebagai berat kosong saat penimbangan dan dapat ditimpa per ritase.
                        </p>
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