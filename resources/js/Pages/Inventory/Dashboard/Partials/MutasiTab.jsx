import React from "react";
import { formatTanggal } from "@/utils/date";

const angka = (nilai) => Number(nilai || 0).toLocaleString("id-ID");

export default function MutasiTab({ mutasi = [] }) {
    const rows = Array.isArray(mutasi) ? mutasi : [];

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-bold text-gray-900">Daftar mutasi stok</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Seluruh catatan barang masuk dan keluar sesuai filter yang dipilih, diurutkan dari yang terbaru.
                </p>
            </div>

            {rows.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-600" role="status">
                    Tidak ada mutasi yang cocok dengan filter saat ini.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                <th scope="col" className="px-4 py-3">Tanggal</th>
                                <th scope="col" className="px-4 py-3">Barang</th>
                                <th scope="col" className="px-4 py-3">Tipe</th>
                                <th scope="col" className="px-4 py-3 text-right">Jumlah</th>
                                <th scope="col" className="px-4 py-3">Sumber</th>
                                <th scope="col" className="px-4 py-3">Referensi</th>
                                <th scope="col" className="px-4 py-3">Titik</th>
                                <th scope="col" className="px-4 py-3">Dicatat oleh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {rows.map((row) => {
                                const masuk = row.tipe === "masuk";
                                return (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                            {formatTanggal(row.tanggal, { day: "numeric", month: "short", year: "numeric" })}
                                            <span className="block text-xs text-gray-500">{row.waktu}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.item}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    masuk ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"
                                                }`}
                                            >
                                                {masuk ? "Masuk" : "Keluar"}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold tabular-nums text-gray-900">
                                            {masuk ? "+" : "-"}
                                            {angka(row.jumlah)} {row.satuan}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{row.sumber_label}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.referensi}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.titik}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.created_by}</td>
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
