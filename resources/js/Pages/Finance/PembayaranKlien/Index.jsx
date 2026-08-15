import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, CreditCard, Plus } from "lucide-react";

export default function Index({ invoice, akunKasList }) {
    const [showingModal, setShowingModal] = useState(false);
    const [data, setData] = useState({
        invoice_id: invoice.id,
        tanggal: new Date().toISOString().slice(0, 10),
        jumlah: invoice.summary.sisa > 0 ? invoice.summary.sisa : "",
        metode: "transfer",
        akun_kas_bank_id: akunKasList.length > 0 ? akunKasList[0].id : "",
        catatan: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const getStatusBadge = (status) => {
        const colors = {
            lunas: "bg-green-200 text-green-800",
            lunas_sebagian: "bg-blue-200 text-blue-800",
            terkirim: "bg-amber-200 text-amber-800",
            jatuh_tempo: "bg-red-200 text-red-800",
        };
        return colors[status] || "bg-gray-200 text-gray-800";
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route("pembayaran-klien.store-invoice", invoice.id), data, {
            onSuccess: () => {
                setShowingModal(false);
                setErrors({});
                setProcessing(false);
            },
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Pembayaran ${invoice.kode_invoice}`} />

            <div className="mb-6">
                <Link
                    href={route("finance.invoice.show", invoice.id)}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Invoice
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Pembayaran Klien</h1>
                <p className="mt-1 text-sm text-gray-500">{invoice.kode_invoice} · {invoice.proyek}</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-gray-500">Total Invoice</p>
                    <p className="text-xl font-bold text-gray-900">Rp {Number(invoice.summary.total).toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-green-600">Total Dibayar</p>
                    <p className="text-xl font-bold text-gray-900">Rp {Number(invoice.summary.total_bayar).toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-sm text-amber-600">Sisa Piutang</p>
                    <p className="text-xl font-bold text-gray-900">Rp {Number(invoice.summary.sisa).toLocaleString("id-ID")}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Riwayat Pembayaran</h2>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                            {invoice.status?.replace(/_/g, " ")}
                        </span>
                        {invoice.summary.sisa > 0 && (
                            <button
                                onClick={() => setShowingModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                            >
                                <CreditCard className="w-4 h-4" />
                                Catat Pembayaran
                            </button>
                        )}
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">Jumlah</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Metode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Akun Kas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Catatan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoice.pembayarans.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                    Belum ada pembayaran untuk invoice ini.
                                </td>
                            </tr>
                        ) : (
                            invoice.pembayarans.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {new Date(p.tanggal).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                                        Rp {Number(p.jumlah).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{p.metode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.akun_kas}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.catatan || "-"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Catat Pembayaran */}
            {showingModal && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShowingModal(false)}>
                    <form
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Plus className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">Catat Pembayaran Klien</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={invoice.summary.sisa}
                                    value={data.jumlah}
                                    onChange={(e) => setData({ ...data, jumlah: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">Sisa piutang: Rp {Number(invoice.summary.sisa).toLocaleString("id-ID")}</p>
                                {errors.jumlah && <p className="text-red-600 text-sm mt-1">{errors.jumlah}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                                <input
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) => setData({ ...data, tanggal: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                                {errors.tanggal && <p className="text-red-600 text-sm mt-1">{errors.tanggal}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Metode *</label>
                                <select
                                    value={data.metode}
                                    onChange={(e) => setData({ ...data, metode: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="transfer">Transfer Bank</option>
                                    <option value="tunai">Tunai</option>
                                    <option value="cek_bg">Cek / Bilyet Giro</option>
                                </select>
                                {errors.metode && <p className="text-red-600 text-sm mt-1">{errors.metode}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Masuk ke Akun Kas/Bank *</label>
                                <select
                                    value={data.akun_kas_bank_id}
                                    onChange={(e) => setData({ ...data, akun_kas_bank_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">-- Pilih Akun --</option>
                                    {akunKasList.map((a) => (
                                        <option key={a.id} value={a.id}>{a.nama}</option>
                                    ))}
                                </select>
                                {errors.akun_kas_bank_id && <p className="text-red-600 text-sm mt-1">{errors.akun_kas_bank_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                                <input
                                    type="text"
                                    value={data.catatan}
                                    onChange={(e) => setData({ ...data, catatan: e.target.value })}
                                    placeholder="Nomor referensi transfer / catatan"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                                {errors.catatan && <p className="text-red-600 text-sm mt-1">{errors.catatan}</p>}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowingModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
                            >
                                {processing ? "Menyimpan..." : "Simpan Pembayaran"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}