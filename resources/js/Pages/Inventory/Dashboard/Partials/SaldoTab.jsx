import React from "react";
import { formatTanggal } from "@/utils/date";

const angka = (nilai) => Number(nilai || 0).toLocaleString("id-ID");
const rupiah = (nilai) => "Rp " + angka(nilai);

const statusClasses = {
    Kosong: "bg-red-100 text-red-900",
    Menipis: "bg-amber-100 text-amber-900",
    Aman: "bg-emerald-100 text-emerald-900",
};

export default function SaldoTab({ saldo = [] }) {
    const rows = Array.isArray(saldo) ? saldo : [];

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-bold text-gray-900">Saldo per item</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Saldo dihitung dari seluruh catatan barang masuk dikurangi barang keluar.
                </p>
            </div>

            {rows.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-600" role="status">
                    Belum ada item bahan baku atau suku cadang yang aktif.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                <th scope="col" className="px-4 py-3">Kode</th>
                                <th scope="col" className="px-4 py-3">Nama</th>
                                <th scope="col" className="px-4 py-3">Kategori</th>
                                <th scope="col" className="px-4 py-3 text-right">Saldo</th>
                                <th scope="col" className="px-4 py-3">Satuan</th>
                                <th scope="col" className="px-4 py-3 text-right">Nilai</th>
                                <th scope="col" className="px-4 py-3">Status</th>
                                <th scope="col" className="px-4 py-3">Terakhir bergerak (proksi umur stok)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{row.kode}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.nama}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {row.kategori === "sparepart" ? "Suku cadang" : "Bahan baku"}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-gray-900">{angka(row.saldo)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{row.satuan}</td>
                                    <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">{rupiah(row.nilai)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[row.status] ?? "bg-gray-100 text-gray-800"}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                        {row.terakhir_bergerak
                                            ? formatTanggal(row.terakhir_bergerak, { day: "numeric", month: "short", year: "numeric" })
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
