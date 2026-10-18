import React from "react";
import { useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import PilihLokasiDariLink from "@/Components/PilihLokasiDariLink";
import {
    ArrowLeft,
    Save,
    FolderKanban,
    MapPin,
    CalendarDays,
    ClipboardList,
} from "lucide-react";

export default function Edit({ proyek, unitBisnis }) {
    const { data, setData, put, processing, errors } = useForm({
        kode_proyek: proyek.kode_proyek ?? "",
        nama: proyek.nama ?? "",
        unit_bisnis_id: String(proyek.unit_bisnis_id ?? ""),
        tipe_proyek: proyek.tipe_proyek ?? "internal",
        client: proyek.client ?? "",
        lokasi: proyek.lokasi ?? "",

        // Tanggal harus berformat YYYY-MM-DD untuk input type="date"
        tanggal_mulai: proyek.tanggal_mulai
            ? String(proyek.tanggal_mulai).substring(0, 10)
            : "",

        tanggal_selesai_rencana: proyek.tanggal_selesai_rencana
            ? String(proyek.tanggal_selesai_rencana).substring(0, 10)
            : "",

        tanggal_selesai_aktual: proyek.tanggal_selesai_aktual
            ? String(proyek.tanggal_selesai_aktual).substring(0, 10)
            : "",

        status: proyek.status ?? "draft",
        catatan: proyek.catatan ?? "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (processing) return;

        put(route("core.proyek.update", proyek.id), {
            preserveScroll: true,
        });
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Edit Proyek
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Perbarui informasi proyek {proyek.kode_proyek}.
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
                                    required
                                    placeholder="PRY-GCS-2026-001"
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    required
                                    placeholder="Masukkan nama proyek"
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                        required
                                        placeholder="Masukkan nama klien"
                                        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    Perbarui alamat atau titik lokasi proyek
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
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    Periode pelaksanaan dan status proyek
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

                            {/* Selesai Rencana */}
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

                            {/* Selesai Aktual */}
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
                                    Keterangan tambahan mengenai proyek
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
                    <div className="flex flex-col-reverse gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
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
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
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
