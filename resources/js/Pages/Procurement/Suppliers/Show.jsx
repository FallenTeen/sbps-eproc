import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Edit, Trash2, Building2, User, Phone, MapPin, FileText } from "lucide-react";

export default function Show({ supplier, purchaseOrders, auth }) {
    const can = (permission) => (auth?.permissions || []).includes(permission);

    const totalPO = purchaseOrders.total || 0;

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
                    <Link
                        href={route("procurement.supplier.index")}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{supplier.nama}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Detail master data supplier
                        </p>
                    </div>
                </div>
                {can("manage procurement") && (
                    <div className="flex gap-2">
                        <Link
                            href={route("procurement.supplier.edit", supplier.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                        Informasi Supplier
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Building2 className="w-4 h-4 mt-0.5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Kode</p>
                                <p className="text-sm font-semibold text-gray-900">{supplier.kode}</p>
                            </div>
                        </div>
                        {supplier.kontak && (
                            <div className="flex items-start gap-3">
                                <User className="w-4 h-4 mt-0.5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">PIC</p>
                                    <p className="text-sm text-gray-900">{supplier.kontak}</p>
                                </div>
                            </div>
                        )}
                        {supplier.telepon && (
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 mt-0.5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Telepon</p>
                                    <p className="text-sm text-gray-900">{supplier.telepon}</p>
                                </div>
                            </div>
                        )}
                        {supplier.alamat && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Alamat</p>
                                    <p className="text-sm text-gray-900">{supplier.alamat}</p>
                                </div>
                            </div>
                        )}
                        <div className="pt-2">
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    supplier.aktif ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                                }`}
                            >
                                {supplier.aktif ? "Aktif" : "Nonaktif"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                        Ringkasan Pengadaan
                    </h3>
                    <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 mt-0.5 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-500">Jumlah Purchase Order</p>
                            <p className="text-3xl font-bold text-gray-900">{totalPO}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">No. PO</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Proyek / Titik</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tanggal Pesan</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {purchaseOrders.data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
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
                                        {po.proyek?.nama}{po.titik ? ` - ${po.titik.nama}` : ""}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {po.tanggal_pesan}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                        Rp {Number(po.total || 0).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                            {String(po.status || "").replaceAll("_", " ").toUpperCase()}
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
                    Menampilkan {purchaseOrders.from || 0} - {purchaseOrders.to || 0} dari {totalPO} data
                </div>
                <div className="flex gap-2">
                    {purchaseOrders.links &&
                        purchaseOrders.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 border rounded ${
                                    link.active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100"
                                }`}
                                disabled={!link.url}
                            />
                        ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}