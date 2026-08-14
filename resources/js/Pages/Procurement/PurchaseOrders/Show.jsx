import React from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Check, X, Truck, DollarSign } from "lucide-react";

export default function Show({
    po,
    canApprove,
    canReject,
    canReceive,
    canPay,
    can,
}) {
    const { auth } = usePage().props;

    const handleAction = (action) => {
        if (window.confirm(`Yakin ${action} PO ini?`)) {
            router.post(route(`procurement.purchase-orders.${action}`, po.id));
        }
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
    const canRejectAction = isApprovalStatus && (can?.reject ?? canReject ?? canApprove);
    const canReceiveAction = po.status === "disetujui" && (can?.receive ?? canReceive);
    const canPayAction =
        ["diterima", "dibayar_sebagian"].includes(po.status) &&
        (can?.pay ?? canPay);
    const canEditAction = po.status === "draft" && (can?.update ?? true);

    return (
        <Layout>
            <div className="mb-6 flex items-center gap-4">
                <Link
                    href={route("procurement.purchase-orders.index")}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Detail PO: {po.kode_po}</h1>
                <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(po.status)}`}
                >
                    {po.status.replace(/_/g, " ")}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info PO */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <strong>Supplier:</strong> {po.supplier?.nama}
                        </div>
                        <div>
                            <strong>Proyek:</strong> {po.proyek?.nama}
                        </div>
                        <div>
                            <strong>Titik:</strong> {po.titik?.nama || "-"}
                        </div>
                        <div>
                            <strong>Total:</strong> Rp{" "}
                            {Number(po.total).toLocaleString("id-ID")}
                        </div>
                        <div>
                            <strong>Tanggal Pesan:</strong>{" "}
                            {new Date(po.tanggal_pesan).toLocaleDateString(
                                "id-ID",
                            )}
                        </div>
                        <div>
                            <strong>Tanggal Diperlukan:</strong>{" "}
                            {po.tanggal_diperlukan
                                ? new Date(
                                      po.tanggal_diperlukan,
                                  ).toLocaleDateString("id-ID")
                                : "-"}
                        </div>
                    </div>
                    {po.catatan && (
                        <div className="mt-4">
                            <strong>Catatan:</strong> {po.catatan}
                        </div>
                    )}

                    {/* Items */}
                    <div className="mt-6">
                        <h3 className="font-semibold mb-3">Item PO</h3>
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm">
                                        Bahan Baku
                                    </th>
                                    <th className="px-4 py-2 text-right text-sm">
                                        Jumlah
                                    </th>
                                    <th className="px-4 py-2 text-right text-sm">
                                        Harga
                                    </th>
                                    <th className="px-4 py-2 text-right text-sm">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {po.items.map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="px-4 py-2">
                                            {item.bahan_baku?.nama}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {item.jumlah}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            Rp{" "}
                                            {Number(
                                                item.harga_satuan_snapshot,
                                            ).toLocaleString("id-ID")}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            Rp{" "}
                                            {Number(
                                                item.subtotal,
                                            ).toLocaleString("id-ID")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold">
                                    <td
                                        colSpan="3"
                                        className="px-4 py-2 text-right"
                                    >
                                        Total
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        Rp{" "}
                                        {Number(po.total).toLocaleString(
                                            "id-ID",
                                        )}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Actions & Timeline */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold mb-4">Aksi</h3>

                    <div className="space-y-2">
                        {canEditAction && (
                            <>
                                <button
                                    onClick={() => handleAction("submit")}
                                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md"
                                >
                                    Ajukan PO
                                </button>
                                <Link
                                    href={route(
                                        "procurement.purchase-orders.edit",
                                        po.id,
                                    )}
                                    className="w-full inline-block text-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                                >
                                    Edit PO
                                </Link>
                            </>
                        )}

                        {canApproveAction && (
                            <button
                                onClick={() => handleAction("approve")}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Setujui
                            </button>
                        )}

                        {canRejectAction && (
                            <button
                                onClick={() => handleAction("reject")}
                                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Tolak
                            </button>
                        )}

                        {canReceiveAction && (
                            <button
                                onClick={() => handleAction("receive")}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                            >
                                <Truck className="w-4 h-4" />
                                Terima Barang
                            </button>
                        )}

                        {canPayAction && (
                            <Link
                                href={route(
                                    "procurement.purchase-orders.payment",
                                    po.id,
                                )}
                                className="w-full inline-block text-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                            >
                                <DollarSign className="w-4 h-4" />
                                Bayar
                            </Link>
                        )}
                    </div>

                    {/* Approval Timeline */}
                    {po.approvals.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-medium mb-2">
                                Riwayat Approval
                            </h4>
                            <div className="space-y-2">
                                {po.approvals.map((approval) => (
                                    <div
                                        key={approval.id}
                                        className="text-sm border-l-2 pl-3 border-gray-300"
                                    >
                                        <div className="font-medium">
                                            {approval.status === "disetujui"
                                                ? "✅"
                                                : "❌"}{" "}
                                            {approval.status}
                                        </div>
                                        <div className="text-gray-600">
                                            Oleh: {approval.approver?.name}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                            {new Date(
                                                approval.created_at,
                                            ).toLocaleString("id-ID")}
                                        </div>
                                        {approval.catatan && (
                                            <div className="text-gray-600 mt-1">
                                                Catatan: {approval.catatan}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pembayaran */}
                    {po.pembayarans.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-medium mb-2">
                                Riwayat Pembayaran
                            </h4>
                            <div className="space-y-2">
                                {po.pembayarans.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="text-sm border-l-2 pl-3 border-green-300"
                                    >
                                        <div>
                                            💰 Rp{" "}
                                            {Number(
                                                payment.jumlah,
                                            ).toLocaleString("id-ID")}
                                        </div>
                                        <div className="text-gray-600">
                                            Metode: {payment.metode}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                            {new Date(
                                                payment.tanggal,
                                            ).toLocaleDateString("id-ID")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
