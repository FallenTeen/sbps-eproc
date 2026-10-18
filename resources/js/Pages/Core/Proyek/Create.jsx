import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import PilihLokasiDariLink from "@/Components/PilihLokasiDariLink";
import {
    ArrowLeft,
    CalendarDays,
    ClipboardList,
    FolderKanban,
    MapPin,
    Save,
} from "lucide-react";

export default function Create({ unitBisnis }) {
    const { data, setData, post, errors, processing } = useForm({
        unit_bisnis_id: "",
        kode_proyek: "",
        nama: "",
        tipe_proyek: "internal",
        client: "",
        lokasi: "",
        tanggal_mulai: new Date().toISOString().split("T")[0],
        tanggal_selesai_rencana: "",
        tanggal_selesai_aktual: "",
        status: "aktif",
        catatan: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("core.proyek.store"));
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Tambah Proyek
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Lengkapi informasi proyek untuk menambahkan proyek
                            baru.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informasi Proyek */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FolderKanban className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Informasi Proyek
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Identitas dan klasifikasi proyek
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                            {/* Kode Proyek */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Kode Proyek{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.kode_proyek}
                                    onChange={(e) =>
                                        setData("kode_proyek", e.target.value)
                                    }
                                    placeholder="Contoh: PRY-GCS-2026-001"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.kode_proyek && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.kode_proyek}
                                    </p>
                                )}
                            </div>

                            {/* Nama Proyek */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Nama Proyek{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) =>
                                        setData("nama", e.target.value)
                                    }
                                    placeholder="Masukkan nama proyek"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.nama && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.nama}
                                    </p>
                                )}
                            </div>

                            {/* Unit Bisnis */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Unit Bisnis{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.unit_bisnis_id}
                                    onChange={(e) =>
                                        setData(
                                            "unit_bisnis_id",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Pilih Unit Bisnis</option>
                                    {unitBisnis.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.nama}
                                        </option>
                                    ))}
                                </select>
                                {errors.unit_bisnis_id && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.unit_bisnis_id}
                                    </p>
                                )}
                            </div>

                            {/* Tipe Proyek */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Tipe Proyek{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.tipe_proyek}
                                    onChange={(e) =>
                                        setData("tipe_proyek", e.target.value)
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="internal">Internal</option>
                                    <option value="kontrak_klien">
                                        Kontrak Klien
                                    </option>
                                </select>
                                {errors.tipe_proyek && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.tipe_proyek}
                                    </p>
                                )}
                            </div>

                            {/* Client */}
                            {data.tipe_proyek === "kontrak_klien" && (
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Nama Klien{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.client}
                                        onChange={(e) =>
                                            setData("client", e.target.value)
                                        }
                                        placeholder="Masukkan nama klien"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                    {errors.client && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.client}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lokasi Proyek */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Lokasi Proyek
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Tentukan alamat atau titik lokasi proyek
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5 p-6">
                            <PilihLokasiDariLink
                                onConfirm={({ latitude, longitude, alamat }) =>
                                    setData(
                                        "lokasi",
                                        alamat || `${latitude}, ${longitude}`,
                                    )
                                }
                            />

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Alamat / Lokasi
                                </label>
                                <input
                                    type="text"
                                    value={data.lokasi}
                                    onChange={(e) =>
                                        setData("lokasi", e.target.value)
                                    }
                                    placeholder="Masukkan alamat atau koordinat lokasi"
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.lokasi && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.lokasi}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Jadwal Proyek */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Jadwal Proyek
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Atur waktu mulai dan penyelesaian proyek
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                            {/* Tanggal Mulai */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Tanggal Mulai{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_mulai}
                                    onChange={(e) =>
                                        setData("tanggal_mulai", e.target.value)
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.tanggal_mulai && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.tanggal_mulai}
                                    </p>
                                )}
                            </div>

                            {/* Tanggal Selesai Rencana */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Tanggal Selesai Rencana
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_selesai_rencana}
                                    onChange={(e) =>
                                        setData(
                                            "tanggal_selesai_rencana",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.tanggal_selesai_rencana && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.tanggal_selesai_rencana}
                                    </p>
                                )}
                            </div>

                            {/* Tanggal Selesai Aktual */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Tanggal Selesai Aktual
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_selesai_aktual}
                                    onChange={(e) =>
                                        setData(
                                            "tanggal_selesai_aktual",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.tanggal_selesai_aktual && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.tanggal_selesai_aktual}
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Status{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) =>
                                        setData("status", e.target.value)
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="aktif">Aktif</option>
                                    <option value="selesai">Selesai</option>
                                    <option value="dihentikan">
                                        Dihentikan
                                    </option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.status}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Catatan Proyek */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Catatan Proyek
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Informasi tambahan terkait proyek
                                </p>
                            </div>
                        </div>

                        <div className="p-6">
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Catatan
                            </label>
                            <textarea
                                value={data.catatan}
                                onChange={(e) =>
                                    setData("catatan", e.target.value)
                                }
                                rows={4}
                                placeholder="Tambahkan catatan atau keterangan mengenai proyek..."
                                className="w-full resize-y rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            {errors.catatan && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.catatan}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col-reverse gap-3  shadow-sm sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
