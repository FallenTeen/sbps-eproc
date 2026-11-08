import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import Pagination from "@/Components/Pagination";
import { Search, SearchX, Edit, Save, ArrowLeft } from "lucide-react";
import { formatTanggal } from "@/utils/date";

const JENIS = {
    dump_truck: "Dump Truck",
    dump_truck_tronton: "Dump Truck Tronton",
    self_loader: "Self Loader",
    alat_berat: "Alat Berat",
    truck_molen: "Truck Molen",
    lainnya: "Lainnya",
};

export default function TaraMaster({ rows, filters }) {
    const { flash } = usePage().props;
    const [cari, setCari] = useState(filters?.cari ?? "");
    const [editId, setEditId] = useState(null);
    const [tara, setTara] = useState("");

    const submitFilter = (e) => {
        e.preventDefault();
        router.get(
            route("logistik.tara-master.index"),
            { cari },
            { preserveState: true },
        );
    };

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
    const clear = () => {
        setCari("");
        router.get(route("logistik.ritase-verifikasi.index"));
    };

    return (
        <Layout title="Tara Master">
            <div className="space-y-4">
                {flash?.success && (
                    <div className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}

                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                Tara Master Armada (Logistik)
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Tara default (kg) dipakai sebagai berat kosong
                                saat penimbangan, dapat ditimpa per ritase
                                dengan opsi timbang ulang.
                            </p>
                        </div>
                    </div>
                    {/* Filter Form */}
                    <form
                        onSubmit={submitFilter}
                        className="flex w-full items-center gap-3 md:w-auto"
                    >
                        <div className="relative w-full max-w-sm">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                className="w-full rounded-xl border border-gray-300 pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-white shadow-sm"
                                placeholder="Cari plat / kode unit..."
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                            />
                        </div>
                        <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm active:scale-[0.98]">
                            Cari
                        </button>
                        {filters?.cari && (
                            <button
                                onClick={clear}
                                title="Reset Filter"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                            >
                                <SearchX className="w-5 h-5" />
                            </button>
                        )}
                    </form>
                </div>

                <div className="overflow-x-auto rounded-2xl bg-white shadow-sm border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50/70 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Plat</th>
                                <th className="px-4 py-3">Kode Unit</th>
                                <th className="px-4 py-3">Jenis</th>
                                <th className="px-4 py-3">Tara Master (kg)</th>
                                <th className="px-4 py-3">Diperbarui</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(rows?.data ?? []).map((a) => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3 font-medium">
                                        {a.plat_nomor}
                                    </td>
                                    <td className="px-4 py-3">
                                        {a.kode_unit ?? "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {JENIS[a.jenis] ?? a.jenis ?? "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {editId === a.id ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-32 rounded border-gray-300 text-sm"
                                                value={tara}
                                                onChange={(e) =>
                                                    setTara(e.target.value)
                                                }
                                            />
                                        ) : (
                                            Number(
                                                a.tara_master_kg ?? 0,
                                            ).toLocaleString("id-ID")
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {formatTanggal(a.tara_diperbarui_pada) ?? "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {editId === a.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={(e) => save(e, a)}
                                                    className="flex gap-2 items-center rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    Simpan
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditId(null)
                                                    }
                                                    className="flex gap-2 items-center rounded border px-3 py-1.5 text-xs bg-gray-600 text-white hover:bg-gray-700"
                                                >
                                                    <ArrowLeft className="h-4 w-4"/>
                                                    Batal
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditId(a.id);
                                                    setTara(
                                                        a.tara_master_kg ?? "",
                                                    );
                                                }}
                                                className="flex gap-2 items-center rounded bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Ubah
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    paginator={rows}
                    onPageUrl={(url) =>
                        router.get(url, {}, { preserveState: true })
                    }
                    onPerPageChange={(n) =>
                        router.get(
                            route("logistik.tara-master.index"),
                            { per_page: n },
                            { preserveState: true },
                        )
                    }
                />
            </div>
        </Layout>
    );
}
