import React from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, FolderKanban, Save, Wrench } from "lucide-react";

export default function Create({ unitBisnis, titiks, produks }) {
    const { data, setData, post, processing, errors } = useForm({
        unit_bisnis_id: "",
        titik_id: "",
        produk_id: "",
        nama: "",
        jenis: "",
        kapasitas: "",
        status: "aktif",
        biaya_per_jam: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("production.mesin.store"));
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Tambah Mesin Produksi
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Tambahkan data mesin produksi beserta informasi
                            operasionalnya.
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informasi Mesin */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <FolderKanban className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Informasi Mesin
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Lengkapi identitas, jenis, dan lokasi
                                        mesin produksi.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    {/* Nama Mesin */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Nama Mesin{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nama}
                                            onChange={(e) =>
                                                setData("nama", e.target.value)
                                            }
                                            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.nama
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                            placeholder="Misal: Batching Plant 1"
                                        />
                                        {errors.nama && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.nama}
                                            </p>
                                        )}
                                    </div>

                                    {/* Jenis Mesin */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Jenis Mesin{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.jenis}
                                            onChange={(e) =>
                                                setData("jenis", e.target.value)
                                            }
                                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.jenis
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">
                                                -- Pilih Jenis Mesin --
                                            </option>
                                            <option value="crusher">
                                                Crusher (Stone Crusher)
                                            </option>
                                            <option value="mixer_aspal">
                                                Mixer Aspal (AMP)
                                            </option>
                                            <option value="mixer_beton">
                                                Mixer Beton (Batching Plant)
                                            </option>
                                        </select>
                                        {errors.jenis && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.jenis}
                                            </p>
                                        )}
                                    </div>

                                    {/* Unit Bisnis */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Unit Bisnis{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.unit_bisnis_id}
                                            onChange={(e) =>
                                                setData(
                                                    "unit_bisnis_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.unit_bisnis_id
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">
                                                -- Pilih Unit Bisnis --
                                            </option>
                                            {unitBisnis.map((ub) => (
                                                <option
                                                    key={ub.id}
                                                    value={ub.id}
                                                >
                                                    {ub.nama}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.unit_bisnis_id && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.unit_bisnis_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Titik Lokasi */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Titik (Lokasi)
                                        </label>
                                        <select
                                            value={data.titik_id}
                                            onChange={(e) =>
                                                setData(
                                                    "titik_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.titik_id
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">
                                                -- Pilih Titik Lokasi --
                                            </option>
                                            {titiks.map((titik) => (
                                                <option
                                                    key={titik.id}
                                                    value={titik.id}
                                                >
                                                    {titik.nama}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.titik_id && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.titik_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Produk Default */}
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Produk Default (Output)
                                        </label>
                                        <select
                                            value={data.produk_id}
                                            onChange={(e) =>
                                                setData(
                                                    "produk_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.produk_id
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">
                                                -- Pilih Produk Output --
                                            </option>
                                            {produks.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.produk_id && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.produk_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Informasi Operasional */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <Wrench className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Informasi Mesin
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Lengkapi identitas, jenis, dan lokasi
                                        mesin produksi.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 pt-0">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    {/* Kapasitas */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Kapasitas Produksi
                                        </label>
                                        <input
                                            type="text"
                                            value={data.kapasitas}
                                            onChange={(e) =>
                                                setData(
                                                    "kapasitas",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="Misal: 60 m³/jam"
                                        />
                                    </div>

                                    {/* Biaya Per Jam */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Biaya Per Jam (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.biaya_per_jam}
                                            onChange={(e) =>
                                                setData(
                                                    "biaya_per_jam",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="Misal: 150000"
                                        />
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Status{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={(e) =>
                                                setData(
                                                    "status",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.status
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="aktif">Aktif</option>
                                            <option value="servis">
                                                Servis
                                            </option>
                                            <option value="nonaktif">
                                                Nonaktif
                                            </option>
                                        </select>
                                        {errors.status && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.status}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
            </div>
        </Layout>
    );
}
