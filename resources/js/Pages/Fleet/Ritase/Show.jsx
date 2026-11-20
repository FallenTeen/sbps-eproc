import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TimelineStrip from "@/Components/Fleet/TimelineStrip";
import RelatedLinks from "@/Components/Fleet/RelatedLinks";
import { ArrowLeft, Truck } from "lucide-react";

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "-";
    return Number(value).toLocaleString("id-ID");
}

function SummaryItem({ label, value }) {
    return (
        <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-800 mt-1">{value ?? "-"}</p>
        </div>
    );
}

export default function RitaseShow({ ritase, timeline = [], related_links = [] }) {
    return (
        <AuthenticatedLayout>
            <Head title={`Detail Ritase ${ritase.id}`} />
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("fleet.ritase.index")}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">
                                Detail Ritase
                            </h1>
                            <p className="text-xs text-slate-500">{ritase.id}</p>
                        </div>
                    </div>
                </div>

                <section className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Truck size={18} className="text-slate-500" />
                            <div>
                                <p className="text-sm font-medium text-slate-800">
                                    {ritase.armada?.plat_nomor || "-"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {ritase.armada?.kode_unit || "-"}
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                            {ritase.status || "-"}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                        <SummaryItem label="Tanggal" value={formatDate(ritase.tanggal)} />
                        <SummaryItem label="Driver" value={ritase.driver?.nama} />
                        <SummaryItem
                            label="Jumlah"
                            value={`${formatNumber(ritase.jumlah_rit)} ${ritase.satuan_volume || ""}`}
                        />
                        <SummaryItem
                            label="Total upah"
                            value={formatNumber(ritase.total_upah_rit)}
                        />
                        <SummaryItem
                            label="Sumber angka"
                            value={ritase.sumber_angka_resmi || "-"}
                        />
                        <SummaryItem label="Customer" value={ritase.customer} />
                        <SummaryItem
                            label="Rute"
                            value={
                                ritase.rute_tarif
                                    ? `${ritase.rute_tarif.lokasi_asal} → ${ritase.rute_tarif.lokasi_tujuan}`
                                    : "-"
                            }
                        />
                        <SummaryItem label="Catatan" value={ritase.catatan} />
                    </div>

                    <div className="flex gap-4 mt-5 text-xs">
                        {ritase.armada_id && (
                            <Link
                                href={route("fleet.armada.show", ritase.armada_id)}
                                className="text-blue-600 hover:underline"
                            >
                                Lihat Armada
                            </Link>
                        )}
                        <Link
                            href={route("fleet.ritase.index")}
                            className="text-blue-600 hover:underline"
                        >
                            Kembali ke Daftar
                        </Link>
                    </div>
                </section>

                <RelatedLinks items={related_links} />
                <TimelineStrip events={timeline} title="Alur Ritase" />
            </div>
        </AuthenticatedLayout>
    );
}
