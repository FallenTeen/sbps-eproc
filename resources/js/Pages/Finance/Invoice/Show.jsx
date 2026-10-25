import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    CreditCard,
    DollarSign,
    CheckCircle2,
    Clock,
    Calendar,
    FileText,
    Save,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import Modal from "@/Components/Modal";
import { formatTanggal } from "@/utils/date";

export default function Show({ auth, invoice, akunKasList = [] }) {
    const [showingPaymentModal, setShowingPaymentModal] = useState(false);

    const paymentForm = useForm({
        invoice_id: invoice.id,
        tanggal: new Date().toISOString().split("T")[0],
        jumlah: invoice.summary.sisa > 0 ? invoice.summary.sisa : "",
        metode: "transfer",
        akun_kas_bank_id: akunKasList.length > 0 ? akunKasList[0].id : "",
        catatan: "",
    });

    const submitPayment = (e) => {
        e.preventDefault();
        paymentForm.post(route("pembayaran-klien.store-invoice", invoice.id), {
            onSuccess: () => {
                setShowingPaymentModal(false);
                paymentForm.reset("catatan");
            },
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "lunas":
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        LUNAS
                    </span>
                );
            case "lunas_sebagian":
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        LUNAS SEBAGIAN
                    </span>
                );
            case "terkirim":
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        TERKIRIM
                    </span>
                );
            case "jatuh_tempo":
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        JATUH TEMPO
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                        DRAFT
                    </span>
                );
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Invoice - ${invoice?.kode_invoice ?? "-"}`} />

            <div className="mx-auto space-y-6">
                {/* Top Header Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Detail Invoice: {invoice?.kode_invoice ?? "-"}
                            </h1>
                            {invoice?.status && getStatusBadge(invoice.status)}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            Rincian tagihan, status pembayaran, dan riwayat
                            transaksi klien.
                        </p>
                    </div>

                    <Link
                        href={route("finance.invoice.index")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Link>
                </div>

                {/* Header Summary Cards */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {/* Total Nilai Invoice */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">
                                Total Nilai Invoice
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                            Rp{" "}
                            {Number(
                                invoice?.summary?.total ?? 0,
                            ).toLocaleString("id-ID")}
                        </div>
                    </div>

                    {/* Total Telah Dibayar */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-600">
                                Total Telah Dibayar
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                            Rp{" "}
                            {Number(
                                invoice?.summary?.total_bayar ?? 0,
                            ).toLocaleString("id-ID")}
                        </div>
                    </div>

                    {/* Sisa Piutang Tagihan */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-amber-600">
                                Sisa Piutang Tagihan
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                            Rp{" "}
                            {Number(invoice?.summary?.sisa ?? 0).toLocaleString(
                                "id-ID",
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Info */}
                <div className="space-y-6">
                    {/* Section 1: Informasi Utama */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                            <h2 className="font-semibold text-gray-900">
                                Informasi Pelanggan & Tagihan
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                            <div>
                                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400">
                                    Unit Bisnis
                                </span>
                                <span className="mt-1 block text-sm font-semibold text-gray-800">
                                    {invoice?.unit_bisnis ?? "-"}
                                </span>
                            </div>

                            <div>
                                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400">
                                    Proyek / Klien
                                </span>
                                <span className="mt-1 block text-sm font-semibold text-gray-800">
                                    {invoice?.proyek ?? "-"}
                                </span>
                            </div>

                            <div>
                                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400">
                                    Tanggal Jatuh Tempo
                                </span>
                                <span className="mt-1 block text-sm font-semibold text-gray-800">
                                    {invoice?.tanggal_jatuh_tempo
                                        ? formatTanggal(
                                              invoice.tanggal_jatuh_tempo,
                                          )
                                        : "-"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Rincian Item Tagihan */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                            <h2 className="font-semibold text-gray-900">
                                Rincian Item Tagihan
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Deskripsi Item
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Jumlah
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Harga Satuan (Rp)
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Subtotal (Rp)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {invoice?.items?.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {item.deskripsi}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    {item.jumlah}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    Rp{" "}
                                                    {Number(
                                                        item.harga_satuan,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Rp{" "}
                                                    {Number(
                                                        item.subtotal,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 font-bold">
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-6 py-4 text-right text-sm uppercase tracking-wider text-gray-700"
                                            >
                                                Total Invoice:
                                            </td>
                                            <td className="px-6 py-4 text-right text-base font-bold text-red-600">
                                                Rp{" "}
                                                {Number(
                                                    invoice?.summary?.total ??
                                                        0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Riwayat Pembayaran */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Riwayat Pembayaran Klien
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Daftar pembayaran yang telah diterima untuk
                                    invoice ini.
                                </p>
                            </div>

                            {(invoice?.summary?.sisa ?? 0) > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowingPaymentModal(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    Catat Pembayaran
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Tanggal
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Jumlah (Rp)
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Metode
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Akun Kas Tujuan
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Catatan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {invoice?.pembayarans?.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                                >
                                                    Belum ada pembayaran yang
                                                    dicatat untuk invoice ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            invoice?.pembayarans?.map((p) => (
                                                <tr
                                                    key={p.id}
                                                    className="transition hover:bg-gray-50"
                                                >
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                        {p.tanggal
                                                            ? formatTanggal(
                                                                  p.tanggal,
                                                              )
                                                            : "-"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-emerald-600">
                                                        Rp{" "}
                                                        {Number(
                                                            p.jumlah,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-700">
                                                        {p.metode}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                        {p.akun_kas}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {p.catatan || "-"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Form Catat Pembayaran */}
                <Modal
                    show={showingPaymentModal}
                    onClose={() => setShowingPaymentModal(false)}
                    maxWidth="md"
                >
                    <form onSubmit={submitPayment} className="p-6">
                        <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Catat Pembayaran Klien
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Masukkan nominal dan informasi akun
                                    penerimaan pembayaran.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Jumlah Pembayaran */}
                            <div>
                                <label
                                    htmlFor="jumlah_bayar"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Jumlah Pembayaran (Rp){" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="jumlah_bayar"
                                    type="number"
                                    min="1"
                                    max={invoice?.summary?.sisa ?? 0}
                                    value={paymentForm.data.jumlah}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "jumlah",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        paymentForm.errors.jumlah
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                <p className="mt-1.5 text-xs text-gray-500">
                                    Sisa Piutang:{" "}
                                    <span className="font-semibold text-gray-700">
                                        Rp{" "}
                                        {Number(
                                            invoice?.summary?.sisa ?? 0,
                                        ).toLocaleString("id-ID")}
                                    </span>
                                </p>
                                {paymentForm.errors.jumlah && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {paymentForm.errors.jumlah}
                                    </p>
                                )}
                            </div>

                            {/* Akun Kas/Bank */}
                            <div>
                                <label
                                    htmlFor="akun_kas_bank_id"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Masuk ke Akun Kas/Bank{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="akun_kas_bank_id"
                                    value={paymentForm.data.akun_kas_bank_id}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "akun_kas_bank_id",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        paymentForm.errors.akun_kas_bank_id
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                >
                                    <option value="">
                                        -- Pilih Akun Kas/Bank --
                                    </option>
                                    {akunKasList.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.nama}
                                        </option>
                                    ))}
                                </select>
                                {paymentForm.errors.akun_kas_bank_id && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {paymentForm.errors.akun_kas_bank_id}
                                    </p>
                                )}
                            </div>

                            {/* Tanggal Pembayaran */}
                            <div>
                                <label
                                    htmlFor="tanggal_bayar"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Tanggal Pembayaran{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="tanggal_bayar"
                                    type="date"
                                    value={paymentForm.data.tanggal}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "tanggal",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        paymentForm.errors.tanggal
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                {paymentForm.errors.tanggal && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {paymentForm.errors.tanggal}
                                    </p>
                                )}
                            </div>

                            {/* Metode Pembayaran */}
                            <div>
                                <label
                                    htmlFor="metode"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Metode Pembayaran{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="metode"
                                    value={paymentForm.data.metode}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "metode",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        paymentForm.errors.metode
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                >
                                    <option value="transfer">
                                        Transfer Bank
                                    </option>
                                    <option value="tunai">Tunai</option>
                                    <option value="cek_bg">
                                        Cek / Bilyet Giro
                                    </option>
                                </select>
                                {paymentForm.errors.metode && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {paymentForm.errors.metode}
                                    </p>
                                )}
                            </div>

                            {/* Catatan */}
                            <div>
                                <label
                                    htmlFor="catatan_bayar"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Catatan (Opsional)
                                </label>
                                <input
                                    id="catatan_bayar"
                                    type="text"
                                    value={paymentForm.data.catatan}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "catatan",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Nomor referensi transfer / catatan"
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        paymentForm.errors.catatan
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                {paymentForm.errors.catatan && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {paymentForm.errors.catatan}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowingPaymentModal(false)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={paymentForm.processing}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {paymentForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan Pembayaran"}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
