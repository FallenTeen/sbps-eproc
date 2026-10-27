import React, { useState } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeft,
    Plus,
    Trash2,
    FileText,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";

export default function Review({ auth, periode, netto }) {
    const [showingAddModal, setShowingAddModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        jenis: "tunjangan",
        jumlah: "",
        keterangan: "",
    });

    const getBulanName = (bulanNumber) => {
        const date = new Date();
        date.setMonth(bulanNumber - 1);
        return date.toLocaleString("id-ID", { month: "long" });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "-";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    };

    const submitAddKomponen = (e) => {
        e.preventDefault();
        post(route("hr.payroll.add-komponen", periode.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowingAddModal(false);
                reset();
            },
        });
    };

    const deleteKomponen = (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus komponen ini?")) {
            router.delete(route("hr.payroll.delete-komponen", id), {
                preserveScroll: true,
            });
        }
    };

    const penerimaan = periode.komponen.filter((k) => k.jenis !== "potongan");
    const potongan = periode.komponen.filter((k) => k.jenis === "potongan");

    return (
        <AuthenticatedLayout>
            <Head title={`Review Gaji - ${periode?.karyawan?.nama ?? ""}`} />

            <div className="mx-auto  space-y-6">
                {/* Header Halaman & Navigasi */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Review Gaji: {periode?.karyawan?.nama}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 capitalize">
                            {periode?.karyawan?.tipe?.replace("_", " ")} &bull;{" "}
                            {getBulanName(periode?.periode_bulan)}{" "}
                            {periode?.periode_tahun}
                        </p>
                    </div>

                    <Link
                        href={route("hr.payroll.show", {
                            bulan: periode.periode_bulan,
                            tahun: periode.periode_tahun,
                        })}
                    >
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Daftar
                        </button>
                    </Link>
                </div>

                {/* Card Header Info & Summary Finansial */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {periode?.karyawan?.nama}
                                </h2>
                                <span
                                    className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        periode?.status === "draft"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-emerald-100 text-emerald-800"
                                    }`}
                                >
                                    Status: {periode?.status?.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {periode?.status === "draft" && (
                            <button
                                type="button"
                                onClick={() => setShowingAddModal(true)}
                                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Komponen Manual
                            </button>
                        )}
                    </div>

                    {/* Grid Ringkasan THP */}
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                Total Penerimaan
                            </div>
                            <div className="mt-2 text-2xl font-bold text-slate-800">
                                {formatCurrency(
                                    penerimaan.reduce(
                                        (sum, k) =>
                                            sum + parseFloat(k.jumlah || 0),
                                        0,
                                    ),
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                Total Potongan
                            </div>
                            <div className="mt-2 text-2xl font-bold text-slate-800">
                                {formatCurrency(
                                    potongan.reduce(
                                        (sum, k) =>
                                            sum + parseFloat(k.jumlah || 0),
                                        0,
                                    ),
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800">
                                <Wallet className="h-4 w-4 text-blue-600" />
                                THP (Take Home Pay)
                            </div>
                            <div className="mt-2 text-2xl font-black text-blue-900">
                                {formatCurrency(netto)}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Grid Rincian Komponen */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Card Rincian Penerimaan */}
                    <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/50 rounded-t-xl">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                Rincian Penerimaan
                            </h3>
                        </div>

                        <ul className="divide-y divide-slate-100 flex-1">
                            {penerimaan.map((k) => (
                                <li
                                    key={k.id}
                                    className="flex items-center justify-between p-4 transition hover:bg-slate-50"
                                >
                                    <div>
                                        <div className="text-sm font-semibold capitalize text-slate-800">
                                            {k.jenis?.replace("_", " ")}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                            {k.keterangan || "-"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-slate-800">
                                            {formatCurrency(k.jumlah)}
                                        </span>
                                        {periode?.status === "draft" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deleteKomponen(k.id)
                                                }
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {penerimaan.length === 0 && (
                                <li className="p-8 text-center text-xs italic text-slate-400">
                                    Tidak ada komponen penerimaan
                                </li>
                            )}
                        </ul>
                    </section>

                    {/* Card Rincian Potongan */}
                    <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/50 rounded-t-xl">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                Rincian Potongan
                            </h3>
                        </div>

                        <ul className="divide-y divide-slate-100 flex-1">
                            {potongan.map((k) => (
                                <li
                                    key={k.id}
                                    className="flex items-center justify-between p-4 transition hover:bg-slate-50"
                                >
                                    <div>
                                        <div className="text-sm font-semibold capitalize text-slate-800">
                                            {k.jenis?.replace("_", " ")}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                            {k.keterangan || "-"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-red-600">
                                            ({formatCurrency(k.jumlah)})
                                        </span>
                                        {periode?.status === "draft" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deleteKomponen(k.id)
                                                }
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {potongan.length === 0 && (
                                <li className="p-8 text-center text-xs italic text-slate-400">
                                    Tidak ada komponen potongan
                                </li>
                            )}
                        </ul>
                    </section>
                </div>

                {/* Modal Tambah Komponen Gaji */}
                <Modal
                    show={showingAddModal}
                    onClose={() => setShowingAddModal(false)}
                >
                    <form onSubmit={submitAddKomponen} className="p-6">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 border-b border-slate-100 pb-4 mb-5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                <Plus className="h-4 w-4 text-blue-600" />
                            </span>
                            Tambah Komponen Gaji
                        </h2>

                        <div className="space-y-4">
                            {/* Jenis Komponen */}
                            <div>
                                <label
                                    htmlFor="jenis"
                                    className="mb-1.5 block text-xs font-medium text-gray-700"
                                >
                                    Jenis Komponen{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="jenis"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    value={data.jenis}
                                    onChange={(e) =>
                                        setData("jenis", e.target.value)
                                    }
                                    required
                                >
                                    <option value="tunjangan">
                                        Penerimaan Lainnya (Tunjangan / Bonus)
                                    </option>
                                    <option value="potongan">
                                        Potongan (Kasbon / Denda / BPJS)
                                    </option>
                                </select>
                                <InputError
                                    message={errors.jenis}
                                    className="mt-1 text-xs text-red-600"
                                />
                            </div>

                            {/* Keterangan */}
                            <div>
                                <label
                                    htmlFor="keterangan"
                                    className="mb-1.5 block text-xs font-medium text-gray-700"
                                >
                                    Keterangan / Nama Komponen{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="keterangan"
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    value={data.keterangan}
                                    onChange={(e) =>
                                        setData("keterangan", e.target.value)
                                    }
                                    placeholder="Contoh: Bonus Tahunan / Potongan Kasbon"
                                    required
                                />
                                <InputError
                                    message={errors.keterangan}
                                    className="mt-1 text-xs text-red-600"
                                />
                            </div>

                            {/* Jumlah (Rp) */}
                            <div>
                                <label
                                    htmlFor="jumlah"
                                    className="mb-1.5 block text-xs font-medium text-gray-700"
                                >
                                    Jumlah (Rp){" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text.sm text-gray-500">
                                        Rp
                                    </div>
                                    <input
                                        id="jumlah"
                                        type="number"
                                        min="0"
                                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        value={data.jumlah}
                                        onChange={(e) =>
                                            setData("jumlah", e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <InputError
                                    message={errors.jumlah}
                                    className="mt-1 text-xs text-red-600"
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <SecondaryButton
                                type="button"
                                onClick={() => setShowingAddModal(false)}
                            >
                                Batal
                            </SecondaryButton>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing
                                    ? "Menyimpan..."
                                    : "Simpan Komponen"}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
