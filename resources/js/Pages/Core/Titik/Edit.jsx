import React from "react";
import { useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import PilihLokasiDariLink from "@/Components/PilihLokasiDariLink";
import {
    ArrowLeft,
    MapPin,
    MapPinned,
    Info,
    LoaderCircle,
    Save,
} from "lucide-react";

export default function Edit({ titik, proyeks }) {
    const { data, setData, put, errors, processing } = useForm({
        nama: titik.nama || "",
        latitude: titik.latitude ?? "",
        longitude: titik.longitude ?? "",
        radius_presensi_meter: titik.radius_presensi_meter ?? 100,
        status: titik.status || "aktif",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("core.titik.update", titik.id));
    };

    const proyek =
        titik.proyek ||
        proyeks.find((p) => String(p.id) === String(titik.proyek_id));

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header Halaman */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Edit Titik: {titik.nama}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Perbarui informasi titik lokasi, koordinat, dan
                            pengaturan presensi.
                        </p>
                    </div>
                </div>

                {/* Form Edit */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {/* Informasi Titik */}
                        <div className="border-b border-gray-200 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                    <MapPin className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Informasi Titik
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Informasi proyek dan nama titik lokasi.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                                {/* Proyek */}
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Proyek
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            proyek
                                                ? `${proyek.kode_proyek} - ${proyek.nama}`
                                                : titik.proyek_id
                                        }
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-600 outline-none"
                                    />

                                    <p className="mt-1.5 text-xs text-gray-500">
                                        Proyek tidak dapat diubah dari halaman
                                        ini.
                                    </p>
                                </div>

                                {/* Nama Titik */}
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Nama Titik{" "}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        type="text"
                                        value={data.nama}
                                        onChange={(e) =>
                                            setData("nama", e.target.value)
                                        }
                                        placeholder="Contoh: Blok A - GCS 01"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    {errors.nama && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.nama}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lokasi dan Presensi */}
                        <div className="border-b border-gray-200 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                    <MapPinned className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Lokasi dan Presensi
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Perbarui koordinat dan radius presensi
                                        titik.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                                {/* Pilih Lokasi */}
                                <div className="md:col-span-2">
                                    <PilihLokasiDariLink
                                        initialLatitude={titik.latitude}
                                        initialLongitude={titik.longitude}
                                        onConfirm={({
                                            latitude,
                                            longitude,
                                        }) => {
                                            setData({
                                                ...data,
                                                latitude,
                                                longitude,
                                            });
                                        }}
                                    />

                                    {errors.latitude && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.latitude}
                                        </p>
                                    )}

                                    {errors.longitude && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.longitude}
                                        </p>
                                    )}
                                </div>

                                {/* Radius Presensi */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Radius Presensi (meter)
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        value={data.radius_presensi_meter}
                                        onChange={(e) =>
                                            setData(
                                                "radius_presensi_meter",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: 100"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <p className="mt-1.5 text-xs text-gray-500">
                                        Jarak maksimal dari titik lokasi untuk
                                        presensi.
                                    </p>

                                    {errors.radius_presensi_meter && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.radius_presensi_meter}
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
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="nonaktif">
                                            Nonaktif
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

                        {/* Informasi Tambahan */}
                        <div className="bg-blue-50/70 px-6 py-4">
                            <div className="flex items-start gap-3">
                                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                                <p className="text-sm text-blue-800">
                                    Perubahan akan diterapkan pada titik{" "}
                                    <span className="font-semibold">
                                        {titik.nama}
                                    </span>{" "}
                                    di proyek{" "}
                                    <span className="font-semibold">
                                        {proyek
                                            ? `${proyek.kode_proyek} - ${proyek.nama}`
                                            : titik.proyek_id}
                                    </span>
                                    .
                                </p>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex flex-col-reverse gap-3 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="ml-2 h-4 w-4" />
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
                    </div>
                </form>
            </div>
        </Layout>
    );
}
