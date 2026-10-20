import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeft,
    Save,
    Activity,
    FolderKanban,
    LoaderCircle,
} from "lucide-react";

export default function Edit({ session, mesins, produks, operator, titiks }) {
    const { data, setData, put, errors, processing } = useForm({
        mesin_id: session.mesin_id,
        titik_id: session.titik_id,
        produk_id: session.produk_id,
        operator_karyawan_id: session.operator_karyawan_id,
        catatan: session.catatan || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("production.sessions.update", session.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Sesi Produksi" />
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Edit Sesi Produksi
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Perbarui konfigurasi sesi produksi yang dipilih.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="max-w-5xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informasi Mesin */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Konfigurasi Sesi
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Sesuaikan mesin, produk, operator, dan
                                        lokasi produksi.
                                    </p>
                                </div>
                            </div>
                            {/* Card Content */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    {/* Mesin Produksi */}
                                    <div>
                                        <label
                                            htmlFor="mesin_id"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Mesin Produksi
                                            <span className="ml-1 text-red-600">
                                                *
                                            </span>
                                            <span className="ml-1 text-xs text-gray-400 font-normal">
                                                (Hanya mesin berstatus Aktif)
                                            </span>
                                        </label>

                                        <select
                                            id="mesin_id"
                                            value={data.mesin_id}
                                            onChange={(e) =>
                                                setData(
                                                    "mesin_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.mesin_id
                                                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500"
                                            }`}
                                        >
                                            <option value="">
                                                Pilih Mesin
                                            </option>

                                            {mesins.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.nama}
                                                </option>
                                            ))}
                                        </select>

                                        {errors.mesin_id && (
                                            <p className="mt-1.5 text-sm text-red-600">
                                                {errors.mesin_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Produk Output */}
                                    <div>
                                        <label
                                            htmlFor="produk_id"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Produk Output
                                            <span className="ml-1 text-red-600">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            id="produk_id"
                                            value={data.produk_id}
                                            onChange={(e) =>
                                                setData(
                                                    "produk_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.produk_id
                                                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500"
                                            }`}
                                        >
                                            <option value="">
                                                Pilih Produk
                                            </option>

                                            {produks.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama}
                                                </option>
                                            ))}
                                        </select>

                                        {errors.produk_id && (
                                            <p className="mt-1.5 text-sm text-red-600">
                                                {errors.produk_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Operator */}
                                    <div>
                                        <label
                                            htmlFor="operator_karyawan_id"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Operator
                                            <span className="ml-1 text-red-600">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            id="operator_karyawan_id"
                                            value={data.operator_karyawan_id}
                                            onChange={(e) =>
                                                setData(
                                                    "operator_karyawan_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.operator_karyawan_id
                                                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500"
                                            }`}
                                        >
                                            <option value="">
                                                Pilih Operator
                                            </option>

                                            {operator.map((o) => (
                                                <option key={o.id} value={o.id}>
                                                    {o.nama}
                                                </option>
                                            ))}
                                        </select>

                                        {errors.operator_karyawan_id && (
                                            <p className="mt-1.5 text-sm text-red-600">
                                                {errors.operator_karyawan_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Titik Lokasi */}
                                    <div>
                                        <label
                                            htmlFor="titik_id"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Titik Lokasi
                                            <span className="ml-1 text-red-600">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            id="titik_id"
                                            value={data.titik_id}
                                            onChange={(e) =>
                                                setData(
                                                    "titik_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.titik_id
                                                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500"
                                            }`}
                                        >
                                            <option value="">
                                                Pilih Titik Lokasi
                                            </option>

                                            {titiks.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.nama}
                                                </option>
                                            ))}
                                        </select>

                                        {errors.titik_id && (
                                            <p className="mt-1.5 text-sm text-red-600">
                                                {errors.titik_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Catatan */}
                                    <div className="md:col-span-2">
                                        <label
                                            htmlFor="catatan"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Catatan
                                        </label>

                                        <textarea
                                            id="catatan"
                                            value={data.catatan}
                                            onChange={(e) =>
                                                setData(
                                                    "catatan",
                                                    e.target.value,
                                                )
                                            }
                                            rows={4}
                                            placeholder="Tambahkan catatan jika diperlukan..."
                                            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:flex-row sm:justify-end">
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
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Simpan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
