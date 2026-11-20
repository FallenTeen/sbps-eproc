import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Show({ supplier, purchaseOrders, auth }) {
    const can = (permission) => (auth?.permissions || []).includes(permission);

    const totalPO = purchaseOrders.total || 0;

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

    const handleDelete = () => {
        if (window.confirm("Yakin hapus supplier ini?")) {
            router.delete(route("procurement.supplier.destroy", supplier.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Supplier ${supplier.nama}`} />

            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {supplier.nama}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Detail master data supplier
                        </p>
                    </div>
                </div>
                {can("manage procurement") && (
                    <div className="flex gap-2">
                        <Link
                            href={route("procurement.supplier.index")}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Kembali
                        </Link>
                        <Link
                            href={route(
                                "procurement.supplier.edit",
                                supplier.id,
                            )}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Informasi Supplier */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-sm font-semibold text-gray-800">
                            Informasi Supplier
                        </h3>
                        <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                supplier.aktif
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                            }`}
                        >
                            {supplier.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Kode */}
                        <div className="grid grid-cols-[100px_12px_minmax(0,1fr)] items-start gap-2">
                            <span className="text-sm text-gray-500">Kode</span>
                            <span className="text-sm text-gray-500">:</span>
                            <span className="text-sm font-semibold text-gray-900 break-words">
                                {supplier.kode || "-"}
                            </span>
                        </div>

                        {/* PIC */}
                        {supplier.kontak && (
                            <div className="grid grid-cols-[100px_12px_minmax(0,1fr)] items-start gap-2">
                                <span className="text-sm text-gray-500">
                                    PIC
                                </span>
                                <span className="text-sm text-gray-500">:</span>
                                <span className="text-sm text-gray-900 break-words">
                                    {supplier.kontak}
                                </span>
                            </div>
                        )}

                        {/* Telepon */}
                        {supplier.telepon && (
                            <div className="grid grid-cols-[100px_12px_minmax(0,1fr)] items-start gap-2">
                                <span className="text-sm text-gray-500">
                                    Telepon
                                </span>
                                <span className="text-sm text-gray-500">:</span>
                                <span className="text-sm text-gray-900 break-words">
                                    {supplier.telepon}
                                </span>
                            </div>
                        )}

                        {/* Alamat */}
                        {supplier.alamat && (
                            <div className="grid grid-cols-[100px_12px_minmax(0,1fr)] items-start gap-2">
                                <span className="text-sm text-gray-500">
                                    Alamat
                                </span>
                                <span className="text-sm text-gray-500">:</span>
                                <span className="text-sm text-gray-900 leading-relaxed break-words">
                                    {supplier.alamat}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ringkasan Pengadaan */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-3">
                        Ringkasan Pengadaan
                    </h3>

                    <div className="grid grid-cols-[160px_12px_minmax(0,1fr)] items-center gap-2">
                        <span className="text-sm text-gray-500">
                            Jumlah Purchase Order
                        </span>
                        <span className="text-3xl font-bold text-gray-900">
                            {totalPO}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                No. PO
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Proyek / Titik
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Tanggal Pesan
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {purchaseOrders.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Belum ada purchase order untuk supplier ini.
                                </td>
                            </tr>
                        ) : (
                            purchaseOrders.data.map((po) => (
                                <tr key={po.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {po.kode_po}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {po.proyek?.nama}
                                        {po.titik ? ` - ${po.titik.nama}` : ""}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {formatTanggal(po.tanggal_pesan)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                        Rp{" "}
                                        {Number(po.total || 0).toLocaleString(
                                            "id-ID",
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(po.status)}`}
                                        >
                                            {String(po.status || "")
                                                .replaceAll("_", " ")
                                                .toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {purchaseOrders.from || 0} -{" "}
                    {purchaseOrders.to || 0} dari {totalPO} data
                </div>
                <div className="flex gap-2">
                    {purchaseOrders.links &&
                        purchaseOrders.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 border rounded ${
                                    link.active
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "hover:bg-gray-100"
                                }`}
                                disabled={!link.url}
                            />
                        ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
