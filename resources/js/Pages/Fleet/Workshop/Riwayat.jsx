import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    History,
    User,
    FileCheck2,
    Package,
    Wrench,
    CalendarDays,
    Receipt,
    Truck,
    ClipboardList,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";
function StatCard({ label, value, color = "blue" }) {
    const colors = {
        blue: "from-blue-600 to-blue-700",
        green: "from-green-600 to-green-700",
        amber: "from-amber-500 to-amber-600",
        purple: "from-purple-600 to-purple-700",
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
const rupiah = (n) => Number(n || 0).toLocaleString("id-ID");

function EmptyState({ icon: Icon, message }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <Icon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">Belum ada data</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">
                {message}
            </p>
        </div>
    );
}

function SectionHeader({
    icon: Icon,
    title,
    description,
    count,
    color = "blue",
}) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 ring-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    };

    return (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${colors[color]}`}
                >
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                        {title}
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {description}
                    </p>
                </div>
            </div>

            <span className="inline-flex shrink-0 items-center rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-gray-100">
                {count} data
            </span>
        </div>
    );
}

function InfoItem({ icon: Icon, label, children }) {
    return (
        <div className="flex min-w-0 items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {label}
                </p>
                <div className="mt-1 break-words text-sm text-gray-700">
                    {children || "-"}
                </div>
            </div>
        </div>
    );
}

function CostFooter({ amount }) {
    return (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2 text-gray-500">
                <Receipt className="h-4 w-4" />
                <span className="text-xs font-medium sm:text-sm">
                    Total biaya
                </span>
            </div>

            <p className="text-base font-bold tabular-nums text-gray-900 sm:text-lg">
                <span className="mr-1 text-xs font-medium text-gray-500">
                    Rp
                </span>
                {rupiah(amount)}
            </p>
        </div>
    );
}

function PengajuanCard({ p }) {
    const spareparts = p.spareparts || [];
    const personels = p.personels || [];

    return (
        <article className="p-4 transition-colors hover:bg-gray-50/70 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        <FileCheck2 className="h-3.5 w-3.5" />
                        {p.kode_pengajuan || "-"}
                    </span>

                    <h3 className="mt-2 text-sm font-bold leading-6 text-gray-900">
                        {p.armada?.plat_nomor || "-"}
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-500">
                        Kode unit: {p.armada?.kode_unit || "-"}
                    </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatTanggal(p.tanggal_selesai)}
                    </span>

                    <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        Selesai
                    </span>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
                <InfoItem icon={User} label="Diajukan oleh">
                    {p.diajukan_oleh?.name || "-"}
                </InfoItem>

                <InfoItem icon={Wrench} label="Personel servis">
                    {personels.length
                        ? personels.map((x) => x.nama_personel).join(", ")
                        : "-"}
                </InfoItem>
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 p-3">
                <div className="flex items-start gap-2.5">
                    <Package
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                            spareparts.length
                                ? "text-amber-600"
                                : "text-gray-400"
                        }`}
                    />

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-700">
                            Penggunaan sparepart
                        </p>

                        {spareparts.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {spareparts.map((s, index) => (
                                    <span
                                        key={s.id ?? `${s.nama_item}-${index}`}
                                        className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800"
                                    >
                                        {s.nama_item}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-1 text-xs text-gray-400">
                                Tidak menggunakan sparepart
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <CostFooter amount={p.total_biaya} />
        </article>
    );
}

function HistoryCard({ h }) {
    const unit = h.serviceable?.plat_nomor || h.serviceable?.nama || "-";

    return (
        <article className="p-4 transition-colors hover:bg-gray-50/70 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Truck className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                            <h3 className="break-words text-sm font-bold text-gray-900">
                                {unit}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Riwayat perawatan unit
                            </p>
                        </div>
                    </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-gray-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatTanggal(h.tanggal)}
                </span>
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Jenis servis
                </p>

                <p className="mt-1.5 text-sm font-semibold leading-6 text-gray-800">
                    {h.jenis_servis || "-"}
                </p>

                {h.notes && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Catatan servis
                        </p>
                        <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-6 text-gray-600">
                            {h.notes}
                        </p>
                    </div>
                )}
            </div>

            <CostFooter amount={h.biaya} />
        </article>
    );
}

export default function Riwayat({ pengajuans = [], histories = [] }) {
    const totalPengajuan = pengajuans.reduce(
        (total, p) => total + Number(p.total_biaya || 0),
        0,
    );

    const totalHistory = histories.reduce(
        (total, h) => total + Number(h.biaya || 0),
        0,
    );

    return (
        <AuthenticatedLayout>
            <Head title="Workshop — Riwayat Servis" />

            <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-6">
                {/* Ringkasan */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Pengajuan Selesai"
                        value={pengajuans.length ?? 0}
                        color="blue"
                    />
                    <StatCard
                        label="Total Biaya Pengajuan Selesai"
                        value={rupiah(totalPengajuan)}
                        color="blue"
                    />
                    <StatCard
                        label="Riwayat servis unit"
                        value={histories.length}
                        color="green"
                    />
                    <StatCard
                        label="Total Biaya Riwayat Servis Unit"
                        value={rupiah(totalHistory)}
                        color="green"
                    />
                </div>

                {/* Daftar riwayat */}
                <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
                    {/* Pengajuan servis selesai */}
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <SectionHeader
                            icon={FileCheck2}
                            title="Pengajuan Servis Selesai"
                            description="Rekap pengajuan yang telah diselesaikan"
                            count={pengajuans.length}
                            color="blue"
                        />

                        <div className="max-h-[680px] overflow-y-auto bg-gray-50/50 p-4">
                            {pengajuans.length === 0 ? (
                                <EmptyState
                                    icon={ClipboardList}
                                    message="Belum ada pengajuan servis yang selesai."
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {pengajuans.map((p) => (
                                        <div
                                            key={p.id}
                                            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                                        >
                                            <PengajuanCard p={p} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Riwayat servis unit */}
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <SectionHeader
                            icon={History}
                            title="Riwayat Servis Unit"
                            description="Catatan perawatan dan servis unit"
                            count={histories.length}
                            color="emerald"
                        />

                        <div className="max-h-[680px] overflow-y-auto bg-gray-50/50 p-4">
                            {histories.length === 0 ? (
                                <EmptyState
                                    icon={Wrench}
                                    message="Belum ada riwayat perawatan unit."
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {histories.map((h) => (
                                        <div
                                            key={h.id}
                                            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
                                        >
                                            <HistoryCard h={h} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
