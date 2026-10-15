import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeft,
    Save,
    Wrench,
    Calendar,
    User,
    DollarSign,
    FileText,
} from "lucide-react";

function Field({ label, error, required, help, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {help && <p className="text-xs text-slate-400 mt-1">{help}</p>}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

const inputClass =
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
const selectClass = inputClass;

export default function SewaAlatCreate({
    auth,
    armadaList = [],
    proyekList = [],
}) {
    const { data, setData, post, processing, errors } = useForm({
        armada_id: "",
        proyek_id: "",
        nama_pelanggan: "",
        tanggal_mulai: new Date().toISOString().slice(0, 10),
        tanggal_selesai: "",
        hm_awal: "",
        hm_akhir: "",
        tarif_per_jam: "",
        uang_muka: "",
        catatan: "",
    });

    const totalHm =
        data.hm_akhir && data.hm_awal
            ? Math.max(0, Number(data.hm_akhir) - Number(data.hm_awal))
            : 0;
    const estimasiPendapatan = totalHm * Number(data.tarif_per_jam || 0);

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.sewa-alat.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("fleet.sewa-alat.index")}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Catat Sewa Alat Berat
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Input HM awal & akhir, hitung pendapatan otomatis
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Catat Sewa Alat" />

            <form onSubmit={submit} className="max-w-4xl mx-auto space-y-6">
                {/* Alat & Pelanggan */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Wrench className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800">
                            Alat & Pelanggan
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field
                            label="Armada / Alat Berat"
                            error={errors.armada_id}
                            required
                        >
                            <select
                                value={data.armada_id}
                                onChange={(e) =>
                                    setData("armada_id", e.target.value)
                                }
                                className={selectClass}
                                required
                            >
                                <option value="">— Pilih Alat —</option>
                                {armadaList.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.jenis} / {a.plat_nomor}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            label="Nama Pelanggan / Proyek Klien"
                            error={errors.nama_pelanggan}
                            required
                        >
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={data.nama_pelanggan}
                                    onChange={(e) =>
                                        setData(
                                            "nama_pelanggan",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Nama klien / proyek"
                                    className={`${inputClass} pl-9`}
                                    required
                                />
                            </div>
                        </Field>

                        <Field
                            label="Proyek (internal)"
                            error={errors.proyek_id}
                        >
                            <select
                                value={data.proyek_id}
                                onChange={(e) =>
                                    setData("proyek_id", e.target.value)
                                }
                                className={selectClass}
                            >
                                <option value="">
                                    — Pilih Proyek Internal (opsional) —
                                </option>
                                {proyekList.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            label="Tipe Sewa"
                            error={errors.tipe_sewa}
                            required
                        >
                            <select
                                value={data.tipe_sewa}
                                onChange={(e) =>
                                    setData("tipe_sewa", e.target.value)
                                }
                                className={selectClass}
                                required
                            >
                                <option value="">— Pilih Tipe Sewa —</option>
                                <option value="internal">Internal</option>
                                <option value="eksternal">Eksternal</option>
                            </select>
                        </Field>
                    </div>
                </div>

                {/* Periode */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800">
                            Periode Sewa
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field
                            label="Tanggal Mulai"
                            error={errors.tanggal_mulai}
                            required
                        >
                            <input
                                type="date"
                                value={data.tanggal_mulai}
                                onChange={(e) =>
                                    setData("tanggal_mulai", e.target.value)
                                }
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field
                            label="Tanggal Selesai"
                            error={errors.tanggal_selesai}
                            help="Kosongkan jika sewa masih berjalan"
                        >
                            <input
                                type="date"
                                value={data.tanggal_selesai}
                                onChange={(e) =>
                                    setData("tanggal_selesai", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </div>

                {/* HM & Tarif */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                            </span>
                            HM & Tarif
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Informasi jam mesin, tarif sewa, dan uang muka.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {/* HM Awal - Kiri */}
                        <Field
                            label="HM Awal (Jam Mesin Mulai)"
                            error={errors.hm_awal}
                            required
                        >
                            <input
                                type="number"
                                min="0"
                                value={data.hm_awal}
                                onChange={(e) =>
                                    setData("hm_awal", e.target.value)
                                }
                                placeholder="0"
                                className={inputClass}
                                required
                            />
                        </Field>

                        {/* HM Akhir - Kanan */}
                        <Field
                            label="HM Akhir (Jam Mesin Selesai)"
                            error={errors.hm_akhir}
                            help="Isi saat sewa selesai"
                        >
                            <input
                                type="number"
                                min="0"
                                value={data.hm_akhir}
                                onChange={(e) =>
                                    setData("hm_akhir", e.target.value)
                                }
                                placeholder="0"
                                className={inputClass}
                            />
                        </Field>

                        {/* Tarif per HM - Kiri bawah HM Awal */}
                        <Field
                            label="Tarif per HM (Rp)"
                            error={errors.tarif_per_jam}
                            required
                        >
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                    Rp
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.tarif_per_jam}
                                    onChange={(e) =>
                                        setData("tarif_per_jam", e.target.value)
                                    }
                                    placeholder="0"
                                    className={`${inputClass} pl-9`}
                                    required
                                />
                            </div>
                        </Field>

                        {/* Uang Muka - Kanan bawah HM Akhir */}
                        <Field
                            label="Uang Muka (Rp)"
                            error={errors.uang_muka}
                            help="Opsional"
                        >
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                    Rp
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.uang_muka}
                                    onChange={(e) =>
                                        setData("uang_muka", e.target.value)
                                    }
                                    placeholder="0"
                                    className={`${inputClass} pl-9`}
                                />
                            </div>
                        </Field>
                    </div>

                    {/* Estimasi Pendapatan */}
                    {estimasiPendapatan > 0 && (
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                                <p className="mb-1 text-xs text-slate-500">
                                    Total HM
                                </p>
                                <p className="text-xl font-bold text-slate-800">
                                    {totalHm} HM
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                                <p className="mb-1 text-xs text-slate-500">
                                    Tarif / HM
                                </p>
                                <p className="text-xl font-bold text-slate-800">
                                    Rp{" "}
                                    {Number(
                                        data.tarif_per_jam || 0,
                                    ).toLocaleString("id-ID")}
                                </p>
                            </div>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                                <p className="mb-1 text-xs font-semibold text-emerald-600">
                                    Estimasi Pendapatan
                                </p>
                                <p className="text-xl font-bold text-emerald-700">
                                    Rp{" "}
                                    {estimasiPendapatan.toLocaleString("id-ID")}
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Section: Catatan */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                                <FileText className="h-5 w-5 text-amber-600" />
                            </span>
                            Catatan
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Tambahkan keterangan terkait penyewaan alat.
                        </p>
                    </div>

                    <Field label="Catatan Tambahan" error={errors.catatan}>
                        <textarea
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            rows={3}
                            placeholder="Contoh: kondisi alat, operator, atau keterangan lainnya."
                            className={inputClass}
                        />
                    </Field>
                </section>
                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pb-6">
                    <Link
                        href={route("fleet.sewa-alat.index")}
                        className="rounded-lg border-2 border-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {processing ? "Menyimpan..." : "Simpan Sewa Alat"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
