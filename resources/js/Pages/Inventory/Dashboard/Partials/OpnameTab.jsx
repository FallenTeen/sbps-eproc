import React from "react";
import { formatTanggal } from "@/utils/date";

const angka = (nilai) => Number(nilai || 0).toLocaleString("id-ID");

export default function OpnameTab({ opname = [] }) {
    const rows = Array.isArray(opname) ? opname : [];

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-bold text-gray-900">Pemeriksaan stok terbaru</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Baris dengan selisih ditampilkan lebih atas untuk memprioritaskan pemeriksaan ulang.
                </p>
            </div>

            {rows.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-600" role="status">
                    Belum ada pemeriksaan stok yang dicatat.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                <th scope="col" className="px-4 py-3">Tanggal</th>
                                <th scope="col" className="px-4 py-3">Item</th>
                                <th scope="col" className="px-4 py-3">Titik</th>
                                <th scope="col" className="px-4 py-3 text-right">Saldo sistem</th>
                                <th scope="col" className="px-4 py-3 text-right">Saldo fisik</th>
                                <th scope="col" className="px-4 py-3 text-right">Selisih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {rows.map((row) => {
                                const selisih = Number(row.selisih || 0);
                                const selisihClass =
                                    selisih > 0 ? "text-emerald-800" : selisih < 0 ? "text-red-800" : "text-gray-700";

                                return (
                                    <tr key={row.id} className={selisih !== 0 ? "bg-red-50 hover:bg-red-100/60" : "hover:bg-gray-50"}>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                            {formatTanggal(row.tanggal, { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.item}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.titik}</td>
                                        <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                                            {angka(row.saldo_sistem)} {row.satuan}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                                            {angka(row.saldo_fisik)} {row.satuan}
                                        </td>
                                        <td className={`px-4 py-3 text-right text-sm font-bold tabular-nums ${selisihClass}`}>
                                            {selisih > 0 ? "+" : ""}
                                            {angka(selisih)} {row.satuan}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
