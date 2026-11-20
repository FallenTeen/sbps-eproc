import React from "react";
import { Link } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowRight,
    ArrowUpFromLine,
    Clock,
    Package,
    TrendingUp,
    Wallet,
} from "lucide-react";
import KpiCard from "./KpiCard";
import TrendChart from "./TrendChart";

const rupiah = (nilai) => "Rp " + Number(nilai || 0).toLocaleString("id-ID");

export default function RingkasanTab({ dashboard = {}, metrics = {} }) {
    const trend = Array.isArray(dashboard.trend) ? dashboard.trend : [];
    const actions = Array.isArray(dashboard.actions) ? dashboard.actions : [];
    const kanban = dashboard.kanban ?? { masuk: [], tersedia: [], keluar: [] };
    const menipis = Array.isArray(metrics.mendekati_habis) ? metrics.mendekati_habis : [];
    const netFlow = trend.reduce((total, row) => {
        return total + (Number(row.masuk) || 0) - (Number(row.keluar) || 0);
    }, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Nilai stok saat ini"
                    value={rupiah(metrics.nilai_stok)}
                    icon={<Wallet className="h-6 w-6 text-red-600" />}
                    tone="red"
                />
                <KpiCard
                    title="Arus bersih 7 hari"
                    value={`${netFlow > 0 ? "+" : ""}${netFlow.toLocaleString("id-ID")}`}
                    icon={<TrendingUp className="h-6 w-6 text-gray-600" />}
                    tone="slate"
                />
                <KpiCard
                    title="Item perlu diisi ulang"
                    value={menipis.length}
                    icon={<AlertTriangle className="h-6 w-6 text-amber-600" />}
                    href={route("procurement.bahan-baku.index")}
                    tone="amber"
                />
                <KpiCard
                    title="PO menunggu persetujuan"
                    value={metrics.po_pending_approval ?? 0}
                    icon={<Clock className="h-6 w-6 text-gray-600" />}
                    href={route("procurement.purchase-orders.approval-queue")}
                    tone="slate"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <h2 className="text-base font-bold text-gray-900">Pergerakan stok 7 hari terakhir</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Membandingkan barang masuk dan keluar untuk melihat arus persediaan.
                    </p>
                    <div className="mt-5">
                        <TrendChart data={trend} />
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-bold text-gray-900">Posisi persediaan</h2>
                    <p className="mt-1 text-sm text-gray-600">Ringkasan situasi terbaru pada tab Kanban.</p>
                    <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2.5">
                            <span className="flex items-center gap-2 text-sm font-medium text-red-950">
                                <ArrowDownToLine className="h-4 w-4" /> Barang masuk
                            </span>
                            <span className="text-xl font-bold tabular-nums text-red-950">{kanban.masuk?.length ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
                            <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                <Package className="h-4 w-4" /> Tersedia di gudang
                            </span>
                            <span className="text-xl font-bold tabular-nums text-gray-900">{kanban.tersedia?.length ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2.5">
                            <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                <ArrowUpFromLine className="h-4 w-4" /> Barang keluar
                            </span>
                            <span className="text-xl font-bold tabular-nums text-gray-900">{kanban.keluar?.length ?? 0}</span>
                        </div>
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="text-base font-bold text-gray-900">Perlu tindakan</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Prioritas berikut dihitung dari saldo, opname, persetujuan PO, dan umur stok.
                    </p>
                </div>

                {actions.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-gray-600" role="status">
                        Tidak ada tindakan yang perlu dilakukan saat ini.
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {actions.map((action) => (
                            <li key={action.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">
                                        Prioritas {action.prioritas}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{action.judul}</p>
                                        <p className="mt-0.5 text-sm text-gray-600">{action.detail}</p>
                                    </div>
                                </div>
                                <Link
                                    href={action.href}
                                    className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-red-700 hover:underline"
                                >
                                    {action.label ?? "Lihat"} <ArrowRight className="h-4 w-4" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
