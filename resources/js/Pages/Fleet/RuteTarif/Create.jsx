import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { DollarSign, MapPin, Save } from "lucide-react";

export default function Create({ unitBisnis }) {
    const { data, setData, post, errors, processing } = useForm({
        unit_bisnis_id: unitBisnis.length === 1 ? unitBisnis[0].id : "",
        lokasi_asal: "",
        lokasi_tujuan: "",
        jarak_km: "",
        tarif_per_rit: "",
        indeks_liter_solar_per_km: "",
        berlaku_dari: new Date().toISOString().split("T")[0],
        berlaku_sampai: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("fleet.rute-tarif.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Rute Tarif" />

            <div className="mx-auto max-w-4xl">
                {/* Header Halaman */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Tambah Rute Tarif
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Master tarif rute armada.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section: Informasi Rute */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                </span>
                                Informasi Rute
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Tentukan unit bisnis serta lokasi asal dan
                                tujuan perjalanan.
                            </p>
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
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">
                                        — Pilih Unit Bisnis —
                                    </option>
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
                                    placeholder="Contoh: Site A"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    placeholder="Contoh: Site B"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.jarak_km && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.jarak_km}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Section: Tarif & Operasional */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                                    <DollarSign className="h-5 w-5 text-emerald-600" />
                                </span>
                                Tarif & Operasional
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Atur tarif perjalanan, indeks konsumsi solar,
                                dan masa berlaku tarif.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Tarif per Rit */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tarif / Rit{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.tarif_per_rit}
                                        onChange={(e) =>
                                            setData(
                                                "tarif_per_rit",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="0"
                                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
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
                                    placeholder="Contoh: 0.350"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.berlaku_sampai && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.berlaku_sampai}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pb-6">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="rounded-lg border-2 border-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? "Menyimpan..." : "Simpan Rute"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
