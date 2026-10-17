import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Activity,
    AlertTriangle,
    ClipboardCheck,
    Truck,
    CalendarDays,
    User,
    CheckCircle2,
    ClipboardList,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

function StatCard({ icon: Icon, label, value, description, color }) {
    const colors = {
        blue: "from-blue-600 to-blue-700",
        amber: "from-amber-500 to-amber-600",
        red: "from-red-600 to-red-700",
    };
    return (
        <div
            className={`rounded-xl bg-gradient-to-br ${colors[color]} text-white p-5 shadow-md`}
        >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {label}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    );
}

function SectionHeader({ icon: Icon, title, description, count, color }) {
    const colors = {
        red: "bg-red-50 text-red-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
                >
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                        {title}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">{description}</p>
                </div>
            </div>

            <span className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {count} unit
            </span>
        </div>
    );
}

function EmptyState({ icon: Icon, title, description, color }) {
    const colors = {
        green: "bg-emerald-50 text-emerald-600",
        gray: "bg-gray-100 text-gray-400",
    };

    return (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div
                className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${colors[color]}`}
            >
                <Icon className="h-6 w-6" />
            </div>

            <p className="text-sm font-semibold text-gray-800">{title}</p>

            <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">
                {description}
            </p>
        </div>
    );
}

function ConditionCard({ item }) {
    const unit = item.checkable?.plat_nomor || item.checkable?.nama || "-";

    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-red-200 hover:shadow-md sm:p-5">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="break-words text-sm font-bold text-gray-900">
                                {unit}
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                Unit terdeteksi bermasalah
                            </p>
                        </div>

                        <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-100">
                            Perlu pemeriksaan
                        </span>
                    </div>

                    {item.item_bermasalah && (
                        <div className="mt-4 rounded-lg border border-red-100 bg-red-50/70 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500">
                                Detail masalah
                            </p>

                            <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-6 text-red-800">
                                {item.item_bermasalah}
                            </p>
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatTanggal(item.tanggal)}
                        </span>

                        {item.dicatat_oleh?.nama && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                <User className="h-3.5 w-3.5" />
                                {item.dicatat_oleh.nama}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function UncheckedCard({ armada }) {
    return (
        <article className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-amber-200 hover:shadow-md sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Truck className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-bold text-gray-900">
                    {armada.plat_nomor || "-"}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                    Kode unit: {armada.kode_unit || "-"}
                </p>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-100">
                <Activity className="h-3.5 w-3.5" />
                Belum checklist
            </span>
        </article>
    );
}

export default function Monitoring({
    kondisi_buruk = [],
    belum_checklist = [],
    stats = {},
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Workshop — Monitoring Kondisi Alat" />

            <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-6">
                {/* Statistik */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard
                        icon={AlertTriangle}
                        label="Unit kondisi tidak baik"
                        value={stats.unit_bermasalah}
                        // description="Unit dengan temuan kondisi bermasalah"
                        color="red"
                    />

                    <StatCard
                        icon={ClipboardCheck}
                        label="Belum checklist hari ini"
                        value={stats.belum_checklist_hari_ini}
                        // description="Armada yang belum diperiksa hari ini"
                        color="amber"
                    />

                    <StatCard
                        icon={Truck}
                        label="Total armada aktif"
                        value={stats.total_armada}
                        // description="Jumlah armada aktif terdaftar"
                        color="blue"
                    />
                </div>

                {/* Daftar monitoring */}
                <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
                    {/* Kondisi tidak baik */}
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 shadow-sm">
                        <SectionHeader
                            icon={AlertTriangle}
                            title="Kondisi Tidak Baik"
                            description="Temuan dalam 24 jam terakhir"
                            count={kondisi_buruk.length}
                            color="red"
                        />

                        <div className="max-h-[680px] space-y-3 overflow-y-auto p-4">
                            {kondisi_buruk.length === 0 ? (
                                <EmptyState
                                    icon={CheckCircle2}
                                    title="Semua unit dalam kondisi baik"
                                    description="Tidak ada temuan kondisi buruk dalam periode pemantauan."
                                    color="green"
                                />
                            ) : (
                                kondisi_buruk.map((item) => (
                                    <ConditionCard key={item.id} item={item} />
                                ))
                            )}
                        </div>
                    </section>

                    {/* Belum checklist */}
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 shadow-sm">
                        <SectionHeader
                            icon={ClipboardCheck}
                            title="Armada Belum Checklist"
                            description="Pemeriksaan harian yang belum dilakukan"
                            count={belum_checklist.length}
                            color="amber"
                        />

                        <div className="max-h-[680px] space-y-3 overflow-y-auto p-4">
                            {belum_checklist.length === 0 ? (
                                <EmptyState
                                    icon={ClipboardList}
                                    title="Semua armada sudah diperiksa"
                                    description="Tidak ada armada yang menunggu checklist hari ini."
                                    color="green"
                                />
                            ) : (
                                belum_checklist.map((armada) => (
                                    <UncheckedCard
                                        key={armada.id}
                                        armada={armada}
                                    />
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
