import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, DollarSign, MapPin, Save } from "lucide-react";

export default function Edit({ ruteTarif, unitBisnis }) {
    const { data, setData, put, errors, processing } = useForm({
        unit_bisnis_id: ruteTarif.unit_bisnis_id,
        lokasi_asal: ruteTarif.lokasi_asal,
        lokasi_tujuan: ruteTarif.lokasi_tujuan,
        jarak_km: ruteTarif.jarak_km,
        tarif_per_rit: ruteTarif.tarif_per_rit,
        indeks_liter_solar_per_km: ruteTarif.indeks_liter_solar_per_km || "",
        berlaku_dari: ruteTarif.berlaku_dari,
        berlaku_sampai: ruteTarif.berlaku_sampai || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("fleet.rute-tarif.update", ruteTarif.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Rute Tarif" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Edit Rute Tarif
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {ruteTarif.lokasi_asal} → {ruteTarif.lokasi_tujuan}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card Informasi Rute */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <MapPin className="h-5 w-5 text-blue-600" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Informasi Rute
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Atur unit bisnis dan lokasi perjalanan.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Unit Bisnis */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Pilih Unit Bisnis</option>
                                    {unitBisnis.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.nama}
                                        </option>
                                    ))}
                                </select>

                                {errors.unit_bisnis_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.unit_bisnis_id}
                                    </p>
                                )}
                            </div>

                            {/* Lokasi Asal */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Lokasi Asal{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    value={data.lokasi_asal}
                                    onChange={(e) =>
                                        setData("lokasi_asal", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />

                                {errors.lokasi_asal && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.lokasi_asal}
                                    </p>
                                )}
                            </div>

                            {/* Lokasi Tujuan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Lokasi Tujuan{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    value={data.lokasi_tujuan}
                                    onChange={(e) =>
                                        setData("lokasi_tujuan", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />

                                {errors.lokasi_tujuan && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.lokasi_tujuan}
                                    </p>
                                )}
                            </div>

                            {/* Jarak */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Jarak (km){" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.jarak_km}
                                    onChange={(e) =>
                                        setData("jarak_km", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />

                                {errors.jarak_km && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.jarak_km}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Card Tarif dan Operasional */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Tarif & Operasional
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Atur biaya perjalanan, indeks solar, dan
                                    masa berlaku tarif.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Tarif per Rit */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tarif / Rit{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.tarif_per_rit}
                                    onChange={(e) =>
                                        setData("tarif_per_rit", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />

                                {errors.tarif_per_rit && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.tarif_per_rit}
                                    </p>
                                )}
                            </div>

                            {/* Indeks Solar */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Indeks Liter Solar / km
                                </label>

                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={data.indeks_liter_solar_per_km}
                                    onChange={(e) =>
                                        setData(
                                            "indeks_liter_solar_per_km",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            {/* Berlaku Dari */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Berlaku Dari{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="date"
                                    value={data.berlaku_dari}
                                    onChange={(e) =>
                                        setData("berlaku_dari", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />

                                {errors.berlaku_dari && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.berlaku_dari}
                                    </p>
                                )}
                            </div>

                            {/* Berlaku Sampai */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Berlaku Sampai
                                </label>

                                <input
                                    type="date"
                                    value={data.berlaku_sampai}
                                    onChange={(e) =>
                                        setData(
                                            "berlaku_sampai",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />

                                {errors.berlaku_sampai && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.berlaku_sampai}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
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
        </AuthenticatedLayout>
    );
}
