import React, { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TimelineStrip from "@/Components/Fleet/TimelineStrip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
    CalendarDays,
    ClipboardList,
    Eye,
    FileCheck2,
    History,
    Package,
    Receipt,
    Truck,
    User,
    Wrench,
    X,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

const rupiah = (n) => Number(n || 0).toLocaleString("id-ID");

function StatCard({ label, value, accent = "blue" }) {
    const accents = {
        blue: "from-blue-600 to-blue-700",
        green: "from-emerald-600 to-emerald-700",
    };

    return (
        <div
            className={`rounded-xl bg-gradient-to-br ${accents[accent]} p-5 text-white shadow-sm`}
        >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        </div>
    );
}

function TableHeader({ children, className = "" }) {
    return (
        <th
            className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${className}`}
        >
            {children}
        </th>
    );
}

function EmptyRow({ colSpan, icon: Icon, message }) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-6 py-12 text-center">
                <Icon className="mx-auto h-7 w-7 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">{message}</p>
            </td>
        </tr>
    );
}

function ActionButton({ onClick, icon: Icon, children, primary = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                primary
                    ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
        >
            <Icon className="h-3.5 w-3.5" />
            {children}
        </button>
    );
}

function TimelineModal({ modal, onClose }) {
    useEffect(() => {
        const handler = (event) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    if (!modal) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Timeline ${modal.title}`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold text-gray-900">
                            Timeline Servis
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                            {modal.title}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        aria-label="Tutup timeline"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    {modal.events?.length ? (
                        <TimelineStrip
                            events={modal.events}
                            title="Alur Penyelesaian"
                        />
                    ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                            Timeline belum tersedia.
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-200 p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Riwayat({ pengajuans = [], histories = [] }) {
    const [tab, setTab] = useState("pengajuan");
    const [modal, setModal] = useState(null);

    const totalPengajuan = pengajuans.reduce(
        (sum, item) => sum + Number(item.total_biaya || 0),
        0,
    );
    const totalHistory = histories.reduce(
        (sum, item) => sum + Number(item.biaya || 0),
        0,
    );

    const openPengajuanTimeline = (p) => {
        setModal({
            title: `${p.kode_pengajuan || "-"} · ${p.armada?.plat_nomor || "-"}`,
            events: p.timeline || [],
        });
    };

    const openHistoryTimeline = (h) => {
        const unit = h.serviceable?.plat_nomor || h.serviceable?.nama || "-";
        setModal({
            title: `${unit} · ${formatTanggal(h.tanggal)}`,
            events: h.timeline || [],
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Workshop - Riwayat Servis" />

            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Riwayat Servis
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Rekap pengajuan selesai dan catatan perawatan unit Workshop.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Pengajuan Selesai"
                        value={pengajuans.length}
                    />
                    <StatCard
                        label="Total Biaya Pengajuan"
                        value={`Rp ${rupiah(totalPengajuan)}`}
                    />
                    <StatCard
                        label="Riwayat Unit"
                        value={histories.length}
                        accent="green"
                    />
                    <StatCard
                        label="Total Biaya Riwayat"
                        value={`Rp ${rupiah(totalHistory)}`}
                        accent="green"
                    />
                </div>

                <Tabs value={tab} onValueChange={setTab} className="gap-4">
                    <div className="w-full overflow-x-auto pb-1">
                        <TabsList
                            className="h-auto w-fit min-w-max gap-1 rounded-md border bg-muted p-1"
                            aria-label="Jenis riwayat servis"
                        >
                            <TabsTrigger
                                value="pengajuan"
                                className={`h-9 shrink-0 gap-2 rounded-md px-3.5 text-sm transition-colors ${
                                    tab === "pengajuan"
                                        ? "!bg-gray-900 !font-semibold !text-white shadow-sm"
                                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                                }`}
                            >
                                <FileCheck2 className="h-4 w-4" />
                                Pengajuan Selesai
                                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-700">
                                    {pengajuans.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="unit"
                                className={`h-9 shrink-0 gap-2 rounded-md px-3.5 text-sm transition-colors ${
                                    tab === "unit"
                                        ? "!bg-gray-900 !font-semibold !text-white shadow-sm"
                                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                                }`}
                            >
                                <History className="h-4 w-4" />
                                Riwayat Unit
                                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-700">
                                    {histories.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="pengajuan">
                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                                <FileCheck2 className="h-4 w-4 text-blue-600" />
                                <h2 className="text-sm font-bold text-gray-900">
                                    Pengajuan Servis Selesai
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-[960px] w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <TableHeader>Pengajuan / Unit</TableHeader>
                                            <TableHeader>Tanggal Selesai</TableHeader>
                                            <TableHeader>Diajukan Oleh</TableHeader>
                                            <TableHeader>Personel</TableHeader>
                                            <TableHeader>Sparepart</TableHeader>
                                            <TableHeader className="text-right">
                                                Total Biaya
                                            </TableHeader>
                                            <TableHeader className="text-right">
                                                Aksi
                                            </TableHeader>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {pengajuans.length === 0 ? (
                                            <EmptyRow
                                                colSpan={7}
                                                icon={ClipboardList}
                                                message="Belum ada pengajuan servis yang selesai."
                                            />
                                        ) : (
                                            pengajuans.map((p) => {
                                                const personels =
                                                    p.personels || [];
                                                const spareparts =
                                                    p.spareparts || [];

                                                return (
                                                    <tr
                                                        key={p.id}
                                                        className="align-top hover:bg-gray-50"
                                                    >
                                                        <td className="px-4 py-3 text-sm">
                                                            <div className="font-semibold text-gray-900">
                                                                {p.kode_pengajuan ||
                                                                    "-"}
                                                            </div>
                                                            <div className="mt-0.5 text-xs text-gray-500">
                                                                {p.armada?.plat_nomor ||
                                                                    "-"}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {p.armada?.kode_unit ||
                                                                    "-"}
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                                            <div className="flex items-center gap-1.5">
                                                                <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                                                {formatTanggal(
                                                                    p.tanggal_selesai,
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            <div className="flex items-center gap-1.5">
                                                                <User className="h-3.5 w-3.5 text-gray-400" />
                                                                {p.diajukan_oleh?.name ||
                                                                    "-"}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {personels.length ? (
                                                                personels
                                                                    .map(
                                                                        (x) =>
                                                                            x.nama_personel,
                                                                    )
                                                                    .filter(Boolean)
                                                                    .join(", ")
                                                            ) : (
                                                                <span className="text-gray-400">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {spareparts.length ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Package className="h-3.5 w-3.5 text-amber-500" />
                                                                    {
                                                                        spareparts.length
                                                                    }{" "}
                                                                    item
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400">
                                                                    Tidak ada
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900">
                                                            Rp {rupiah(p.total_biaya)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-end gap-2">
                                                                <Link
                                                                    href={route(
                                                                        "fleet.servis-armada.show",
                                                                        p.id,
                                                                    )}
                                                                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                    Detail
                                                                </Link>
                                                                <ActionButton
                                                                    icon={History}
                                                                    primary
                                                                    onClick={() =>
                                                                        openPengajuanTimeline(
                                                                            p,
                                                                        )
                                                                    }
                                                                >
                                                                    Timeline
                                                                </ActionButton>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="unit">
                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                                <History className="h-4 w-4 text-emerald-600" />
                                <h2 className="text-sm font-bold text-gray-900">
                                    Riwayat Servis Unit
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-[840px] w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <TableHeader>Unit</TableHeader>
                                            <TableHeader>Tanggal</TableHeader>
                                            <TableHeader>Jenis Servis</TableHeader>
                                            <TableHeader>Catatan</TableHeader>
                                            <TableHeader className="text-right">
                                                Biaya
                                            </TableHeader>
                                            <TableHeader className="text-right">
                                                Aksi
                                            </TableHeader>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {histories.length === 0 ? (
                                            <EmptyRow
                                                colSpan={6}
                                                icon={Wrench}
                                                message="Belum ada riwayat perawatan unit."
                                            />
                                        ) : (
                                            histories.map((h) => {
                                                const unit =
                                                    h.serviceable?.plat_nomor ||
                                                    h.serviceable?.nama ||
                                                    "-";

                                                return (
                                                    <tr
                                                        key={h.id}
                                                        className="align-top hover:bg-gray-50"
                                                    >
                                                        <td className="px-4 py-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Truck className="h-4 w-4 text-emerald-600" />
                                                                <span className="font-semibold text-gray-900">
                                                                    {unit}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                                            {formatTanggal(h.tanggal)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                                            {h.jenis_servis || "-"}
                                                        </td>
                                                        <td className="max-w-sm px-4 py-3 text-sm text-gray-600">
                                                            <span className="line-clamp-2">
                                                                {h.notes || "-"}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900">
                                                            <span className="inline-flex items-center gap-1">
                                                                <Receipt className="h-3.5 w-3.5 text-gray-400" />
                                                                Rp {rupiah(h.biaya)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-end">
                                                                <ActionButton
                                                                    icon={History}
                                                                    primary
                                                                    onClick={() =>
                                                                        openHistoryTimeline(
                                                                            h,
                                                                        )
                                                                    }
                                                                >
                                                                    Timeline
                                                                </ActionButton>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </TabsContent>
                </Tabs>
            </div>

            <TimelineModal modal={modal} onClose={() => setModal(null)} />
        </AuthenticatedLayout>
    );
}
