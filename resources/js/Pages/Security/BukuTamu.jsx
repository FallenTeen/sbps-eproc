import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import Pagination from "@/Components/Pagination";
import { formatTanggal } from "@/utils/date";
import { CheckCheck, HardDriveDownload, SearchX, ShieldX } from "lucide-react";

const KENDARAAN = ["tanpa_kendaraan", "motor", "mobil", "truk", "lainnya"];

export default function BukuTamu({ rows, filters }) {
    const { flash } = usePage().props;
    const [cari, setCari] = useState(filters?.cari ?? "");
    const [tanggal, setTanggal] = useState(filters?.tanggal ?? "");
    const [kendaraan, setKendaraan] = useState(filters?.kendaraan ?? "");

    const params = (extra = {}) => ({ cari, tanggal, kendaraan, ...extra });

    const submit = (e) => {
        e.preventDefault();
        router.get(route("security.buku-tamu.index"), params(), {
            preserveState: true,
        });
    };

    const keluar = (id) => {
        router.post(
            route("security.buku-tamu.keluar", id),
            {},
            { preserveScroll: true },
        );
    };
    const clear = () => {
        setCari("");
        setTanggal("");
        setKendaraan("");
        router.get(route("security.buku-tamu.index"));
    };

    return (
        <Layout title="Buku Tamu">
            <div className="space-y-4">
                {flash?.success && (
                    <div className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Buku Tamu (Security)</h1>
                    <a
                        href={route("security.buku-tamu.export", params())}
                        className="flex gap-2 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        <HardDriveDownload className="w-4 h-4" />
                        Export Excel
                    </a>
                </div>

                <form onSubmit={submit} className="flex flex-wrap gap-2">
                    <input
                        className="w-full max-w-xs rounded border-gray-300 text-sm"
                        placeholder="Cari nama / asal / telepon / plat"
                        value={cari}
                        onChange={(e) => setCari(e.target.value)}
                    />
                    <input
                        type="date"
                        className="rounded border-gray-300 text-sm"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                    />
                    <select
                        className="rounded border-gray-300 text-sm"
                        value={kendaraan}
                        onChange={(e) => setKendaraan(e.target.value)}
                    >
                        <option value="">Semua kendaraan</option>
                        {KENDARAAN.map((k) => (
                            <option key={k} value={k}>
                                {k.replace(/_/g, " ")}
                            </option>
                        ))}
                    </select>
                    <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        Filter
                    </button>
                    <button
                        onClick={clear}
                        title="Reset Filter"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                    >
                        <SearchX className="w-5 h-5" />
                    </button>
                </form>

                <div className="overflow-x-auto rounded bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Masuk</th>
                                <th className="px-4 py-3">Nama</th>
                                <th className="px-4 py-3">Asal</th>
                                <th className="px-4 py-3">Kendaraan</th>
                                <th className="px-4 py-3">Keluar</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(rows?.data ?? []).map((t) => (
                                <tr key={t.id}>
                                    <td className="px-4 py-3">
                                        {formatTanggal(t.waktu_masuk) ?? "-"}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {t.nama}{" "}
                                        {t.jumlah_orang
                                            ? `(${t.jumlah_orang} org)`
                                            : ""}
                                    </td>
                                    <td className="px-4 py-3">
                                        {t.asal ?? "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {t.kendaraan ?? "-"} ●{" "}
                                        {t.plat_nomor ? `${t.plat_nomor}` : ""}
                                    </td>
                                    <td className="px-4 py-3">
                                        {!t.waktu_keluar ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
                                                <ShieldX className="w-3 h-3 text-red-600" />
                                                Menunggu
                                            </span>
                                        ) : (
                                            formatTanggal(t.waktu_keluar)
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {!t.waktu_keluar && (
                                            <button
                                                onClick={() => keluar(t.id)}
                                                className="flex gap-2 items-center rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                                            >
                                                <CheckCheck className="w-4 h-4"/>
                                                Tandai Keluar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {(rows?.data ?? []).length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-6 text-center text-gray-500"
                                    >
                                        Tidak ada data.
                                    </td>
                                </tr>
                            )}
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
                            route("security.buku-tamu.index"),
                            params({ per_page: n }),
                            { preserveState: true },
                        )
                    }
                />
            </div>
        </Layout>
    );
}
