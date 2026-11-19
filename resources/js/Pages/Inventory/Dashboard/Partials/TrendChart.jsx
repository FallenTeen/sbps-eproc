import React from "react";
import { formatTanggal } from "@/utils/date";

export default function TrendChart({ data = [] }) {
    const rows = Array.isArray(data) ? data : [];
    const maksimum = Math.max(
        1,
        ...rows.flatMap((row) => [Number(row.masuk) || 0, Number(row.keluar) || 0])
    );

    if (rows.length === 0) {
        return (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-600">
                Belum ada pergerakan stok pada rentang ini.
            </div>
        );
    }

    return (
        <div className="min-h-48">
            <div className="mb-4 flex items-center gap-4 text-xs font-medium text-gray-600">
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-red-600" /> Barang masuk
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-gray-400" /> Barang keluar
                </span>
            </div>

            <div className="flex h-40 items-end gap-2 sm:gap-3" aria-label="Grafik pergerakan stok tujuh hari terakhir">
                {rows.map((row) => {
                    const masuk = Math.max(0, Number(row.masuk) || 0);
                    const keluar = Math.max(0, Number(row.keluar) || 0);
                    const tinggiMasuk = Math.max(3, Math.round((masuk / maksimum) * 100));
                    const tinggiKeluar = Math.max(3, Math.round((keluar / maksimum) * 100));
                    const label = formatTanggal(row.tanggal, { day: "numeric", month: "short" });

                    return (
                        <div key={row.tanggal} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
                            <div className="flex h-full items-end justify-center gap-1">
                                <div
                                    className="w-2.5 rounded-t bg-red-600 sm:w-4"
                                    style={{ height: `${tinggiMasuk}%` }}
                                    title={`${label}: masuk ${masuk}`}
                                />
                                <div
                                    className="w-2.5 rounded-t bg-gray-400 sm:w-4"
                                    style={{ height: `${tinggiKeluar}%` }}
                                    title={`${label}: keluar ${keluar}`}
                                />
                            </div>
                            <span className="truncate text-center text-[11px] text-gray-500">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
