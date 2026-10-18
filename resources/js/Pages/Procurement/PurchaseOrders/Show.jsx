import React, { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft,
    Check,
    X,
    Truck,
    DollarSign,
    FolderKanban,
    ClipboardList,
    DollarSignIcon,
} from "lucide-react";
import { formatTanggal, formatTanggalWaktu } from "@/utils/date";

export default function Show({
    po,
    canApprove,
    canReject,
    canReceive,
    canPay,
    can,
}) {
    const { auth } = usePage().props;

    // State untuk Modal Penolakan
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [catatanPenolakan, setCatatanPenolakan] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAction = (action, payload = {}) => {
        if (action === "reject") {
            setIsRejectModalOpen(true);
            return;
        }

        if (window.confirm(`Yakin ${action} PO ini?`)) {
            router.post(route(`procurement.purchase-orders.${action}`, po.id), payload);
        }
    };

    const handleConfirmReject = (e) => {
        e.preventDefault();
        if (!catatanPenolakan.trim()) {
            alert("Harap masukkan alasan penolakan!");
            return;
        }

        setIsSubmitting(true);
        router.post(
            route(`procurement.purchase-orders.reject`, po.id),
            { catatan: catatanPenolakan },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setIsRejectModalOpen(false);
                    setCatatanPenolakan("");
                },
            }
        );
    };

    const getStatusBadge = (status) => {
        const colors = {
            draft: "bg-gray-200 text-gray-800",
            diajukan: "bg-yellow-200 text-yellow-800",
            menunggu_approval_finance: "bg-blue-200 text-blue-800",
            menunggu_approval_owner: "bg-purple-200 text-purple-800",
            disetujui: "bg-green-200 text-green-800",
            diterima: "bg-indigo-200 text-indigo-800",
            dibayar_sebagian: "bg-orange-200 text-orange-800",
            lunas: "bg-emerald-200 text-emerald-800",
            ditolak: "bg-red-200 text-red-800",
        };
        return colors[status] || "bg-gray-200 text-gray-800";
    };

    const isApprovalStatus = [
        "diajukan",
        "menunggu_approval_finance",
        "menunggu_approval_owner",
    ].includes(po.status);
    const canApproveAction = isApprovalStatus && (can?.approve ?? canApprove);
    const canRejectAction =
        isApprovalStatus && (can?.reject ?? canReject ?? canApprove);
    const canReceiveAction =
        po.status === "disetujui" && (can?.receive ?? canReceive);
    const canPayAction =
        ["diterima", "dibayar_sebagian"].includes(po.status) &&
        (can?.pay ?? canPay);
    const canEditAction = po.status === "draft" && (can?.update ?? true);

    return (
        <Layout>
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header Navigation & Badge Status */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                    Detail PO: {po.kode_po}
                                </h1>
                                <span
                                    className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusBadge(po.status)}`}
                                >
                                    {po.status.replace(/_/g, " ")}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Informasi rincian, daftar item, serta riwayat
                                approval & pembayaran
                            </p>
                        </div>
                    </div>

                    <div>
                        <Link
                            href={route("procurement.purchase-orders.index")}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            kembali
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Sisi Kiri: Detail Ringkasan & Tabel Item */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Informasi Purchase Order */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <FolderKanban className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Ringkasan Informasi PO
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Rincian entitas supplier, proyek, dan
                                        tanggal
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                                <div>
                                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Supplier
                                    </span>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {po.supplier?.nama || "-"}
                                    </p>
                                </div>

                                <div>
                                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Proyek
                                    </span>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {po.proyek?.nama || "-"}
                                    </p>
                                </div>

                                <div>
                                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Titik Lokasi
                                    </span>
                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {po.titik?.nama || "-"}
                                    </p>
                                </div>

                                <div>
                                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Biaya
                                    </span>
                                    <p className="mt-1 text-sm font-bold text-red-600">
                                        Rp{" "}
                                        {Number(po.total).toLocaleString(
                                            "id-ID",
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tanggal Pesan
                                    </span>
                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {formatTanggal(po.tanggal_pesan)}
                                    </p>
                                </div>

                                <div>
                                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tanggal Diperlukan
                                    </span>
                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {formatTanggal(po.tanggal_diperlukan)}
                                    </p>
                                </div>

                                {po.catatan && (
                                    <div className="sm:col-span-2 rounded-lg bg-amber-50/60 p-3.5 border border-amber-200/60">
                                        <span className="block text-xs font-semibold text-amber-800 uppercase tracking-wider">
                                            Catatan
                                        </span>
                                        <p className="mt-0.5 text-sm text-amber-900">
                                            {po.catatan}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabel Item PO */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                        <ClipboardList className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900">
                                            Daftar Item Purchase Order
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            Item bahan baku yang dipesan beserta
                                            kuantitasnya
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                                    {po.items.length} Item
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3.5 font-medium"
                                            >
                                                Bahan Baku
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3.5 text-right font-medium"
                                            >
                                                Jumlah
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3.5 text-right font-medium"
                                            >
                                                Harga Satuan
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3.5 text-right font-medium"
                                            >
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {po.items.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50/50 transition"
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {item.bahan_baku?.nama ||
                                                        "-"}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {item.jumlah}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    Rp{" "}
                                                    {Number(
                                                        item.harga_satuan_snapshot,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                                                    Rp{" "}
                                                    {Number(
                                                        item.subtotal,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t border-gray-200 bg-gray-50/50 font-bold text-gray-900">
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-6 py-3.5 text-right"
                                            >
                                                Total Keseluruhan
                                            </td>
                                            <td className="px-6 py-3.5 text-right text-red-600 whitespace-nowrap">
                                                Rp{" "}
                                                {Number(
                                                    po.total,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sisi Kanan: Panel Aksi & Timeline Riwayat */}
                    <div className="space-y-6">
                        {/* Panel Aksi */}
                        {po.status !== "lunas" &&
                            (canEditAction ||
                                canApproveAction ||
                                canRejectAction ||
                                canReceiveAction ||
                                canPayAction) && (
                                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 font-semibold text-gray-900">
                                        Aksi Tersedia
                                    </h3>

                                    <div className="space-y-2.5">
                                        {canEditAction && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction("submit")}
                                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                                >
                                                    Ajukan PO
                                                </button>
                                                <Link
                                                    href={route(
                                                        "procurement.purchase-orders.edit",
                                                        po.id,
                                                    )}
                                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                                                >
                                                    Edit PO
                                                </Link>
                                            </>
                                        )}

                                        {canApproveAction && (
                                            <button
                                                type="button"
                                                onClick={() => handleAction("approve")}
                                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                            >
                                                <Check className="h-4 w-4" />
                                                Setujui
                                            </button>
                                        )}

                                        {canRejectAction && (
                                            <button
                                                type="button"
                                                onClick={() => handleAction("reject")}
                                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                            >
                                                <X className="h-4 w-4" />
                                                Tolak
                                            </button>
                                        )}

                                        {canReceiveAction && (
                                            <button
                                                type="button"
                                                onClick={() => handleAction("receive")}
                                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                            >
                                                <Truck className="h-4 w-4" />
                                                Terima Barang
                                            </button>
                                        )}

                                        {canPayAction && (
                                            <Link
                                                href={route(
                                                    "procurement.purchase-orders.payment",
                                                    po.id,
                                                )}
                                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
                                            >
                                                <DollarSign className="h-4 w-4" />
                                                Bayar
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Timeline Approval */}
                        {po.approvals.length > 0 && (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 font-semibold text-gray-900">
                                    Riwayat Approval
                                </h3>
                                <div className="relative border-l-2 border-gray-200 pl-4 space-y-4">
                                    {po.approvals.map((approval) => (
                                        <div
                                            key={approval.id}
                                            className="relative text-sm"
                                        >
                                            <span
                                                className={`absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white ${
                                                    approval.status ===
                                                    "disetujui"
                                                        ? "bg-emerald-500"
                                                        : "bg-red-500"
                                                }`}
                                            >
                                                {approval.status === "disetujui"
                                                    ? "✓"
                                                    : "✕"}
                                            </span>
                                            <div className="font-semibold text-gray-900 capitalize">
                                                {approval.status}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Oleh:{" "}
                                                <span className="font-medium text-gray-800">
                                                    {approval.approver?.name ||
                                                        "-"}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">
                                                {formatTanggalWaktu(
                                                    approval.created_at,
                                                )}
                                            </div>
                                            {approval.catatan && (
                                                <p className="mt-1 text-xs text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100">
                                                    "{approval.catatan}"
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timeline Pembayaran */}
                        {po.pembayarans.length > 0 && (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 font-semibold text-gray-900">
                                    Riwayat Pembayaran
                                </h3>
                                <div className="relative border-l-2 border-emerald-200 pl-4 space-y-4">
                                    {po.pembayarans.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="relative text-sm"
                                        >
                                            <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                                                <DollarSignIcon className="h-3 w-3" />
                                            </span>
                                            <div className="font-bold text-emerald-700">
                                                Rp{" "}
                                                {Number(
                                                    payment.jumlah,
                                                ).toLocaleString("id-ID")}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Metode:{" "}
                                                <span className="font-medium text-gray-800">
                                                    {payment.metode}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">
                                                {formatTanggal(payment.tanggal)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Penolakan PO */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="border-b border-gray-100 bg-red-50/50 px-6 py-4">
                            <h3 className="text-lg font-bold text-red-700">
                                Tolak Purchase Order
                            </h3>
                            <p className="text-xs text-red-600/80">
                                Masukkan alasan penolakan PO ini
                            </p>
                        </div>
                        <form onSubmit={handleConfirmReject} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alasan Penolakan <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows="4"
                                        required
                                        value={catatanPenolakan}
                                        onChange={(e) => setCatatanPenolakan(e.target.value)}
                                        placeholder="Contoh: Harga bahan baku terlalu tinggi / stok tidak sesuai..."
                                        className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-red-500 focus:ring-red-500"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRejectModalOpen(false);
                                        setCatatanPenolakan("");
                                    }}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {isSubmitting ? "Memproses..." : "Konfirmasi Tolak"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}