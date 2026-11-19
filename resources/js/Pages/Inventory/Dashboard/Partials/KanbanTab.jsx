import React from "react";
import { ArrowDownToLine, ArrowUpFromLine, Package } from "lucide-react";
import { formatTanggal } from "@/utils/date";

const angka = (nilai) => Number(nilai || 0).toLocaleString("id-ID");

function Column({ title, description, icon: Icon, count, children, tone = "slate" }) {
    const headerTone = {
        red: "bg-red-50 text-red-800",
        slate: "bg-gray-100 text-gray-800",
        amber: "bg-amber-50 text-amber-900",
    }[tone];

    return (
        <section className="flex min-h-96 flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50/70 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${headerTone}`}>
                        <Icon className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                        <p className="text-xs text-gray-600">{description}</p>
                    </div>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-gray-700">{count}</span>
            </div>
            <div className="flex-1 space-y-3 p-3">{children}</div>
        </section>
    );
}

function EmptyState({ children }) {
    return (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-sm text-gray-600" role="status">
            {children}
        </p>
    );
}

function MutasiCard({ item }) {
    const masuk = item.tipe === "masuk";

    return (
        <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{item.item}</p>
                <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        masuk ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"
                    }`}
                >
                    {masuk ? "+" : "-"}
                    {angka(item.jumlah)} {item.satuan}
                </span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
                {item.sumber_label} · {item.titik}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{formatTanggal(item.tanggal, { day: "numeric", month: "short" })}</span>
                <span>{item.waktu}</span>
            </div>
            {item.referensi && item.referensi !== "-" && (
                <p className="mt-1 truncate text-xs text-gray-500" title={item.referensi}>
                    {item.referensi}
                </p>
            )}
        </article>
    );
}

function StokCard({ item }) {
    const statusClass =
        item.status === "Kosong"
            ? "bg-red-100 text-red-900"
            : item.status === "Menipis"
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-100 text-emerald-900";

    return (
        <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{item.nama}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass}`}>{item.status}</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
                {item.kode} · {item.satuan}
            </p>
            <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold tabular-nums text-gray-900">
                    {angka(item.saldo)} {item.satuan}
                </span>
                <span className="text-xs text-gray-500">
                    {item.terakhir_bergerak ? formatTanggal(item.terakhir_bergerak, { day: "numeric", month: "short" }) : "-"}
                </span>
            </div>
        </article>
    );
}

export default function KanbanTab({ kanban = {} }) {
    const masuk = Array.isArray(kanban.masuk) ? kanban.masuk : [];
    const tersedia = Array.isArray(kanban.tersedia) ? kanban.tersedia : [];
    const keluar = Array.isArray(kanban.keluar) ? kanban.keluar : [];

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Column title="Barang masuk" description="Penerimaan terbaru" icon={ArrowDownToLine} count={masuk.length} tone="red">
                {masuk.length === 0 ? (
                    <EmptyState>Belum ada barang masuk pada rentang ini.</EmptyState>
                ) : (
                    masuk.map((item) => <MutasiCard key={item.id} item={item} />)
                )}
            </Column>

            <Column title="Tersedia di gudang" description="Saldo terkecil ditampilkan lebih dulu" icon={Package} count={tersedia.length}>
                {tersedia.length === 0 ? (
                    <EmptyState>Belum ada item dengan saldo lebih dari nol.</EmptyState>
                ) : (
                    tersedia.map((item) => <StokCard key={item.id} item={item} />)
                )}
            </Column>

            <Column title="Barang keluar" description="Pemakaian terbaru" icon={ArrowUpFromLine} count={keluar.length} tone="amber">
                {keluar.length === 0 ? (
                    <EmptyState>Belum ada barang keluar pada rentang ini.</EmptyState>
                ) : (
                    keluar.map((item) => <MutasiCard key={item.id} item={item} />)
                )}
            </Column>
        </div>
    );
}
