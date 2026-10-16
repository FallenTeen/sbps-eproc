import React from "react";
import { useForm, Link, Head } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, ClipboardList, MapPin, Save, Truck } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Create({ unitBisnis, titiks, drivers }) {
    const { data, setData, post, errors, processing } = useForm({
        unit_bisnis_id: "",
        plat_nomor: "",
        kode_unit: "",
        jenis: "dump_truck",
        tipe_unit: "armada_jalan",
        model_tarif: "ritase",
        tahun: "",
        kapasitas: "",
        titik_id: "",
        tanggal_mulai_pakai: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Armada Baru" />

            <div className="mx-auto max-w-4xl">
                {/* Header Halaman */}
                <div className="mb-6 flex items-start gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Tambah Armada Baru
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Master data armada.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Kategori 1: Informasi Unit */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                </span>
                                Informasi Unit
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Informasi dasar dan klasifikasi armada.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                                    {unitBisnis.map((ub) => (
                                        <option key={ub.id} value={ub.id}>
                                            {ub.nama}
                                        </option>
                                    ))}
                                </select>
                                {errors.unit_bisnis_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.unit_bisnis_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Kode Unit{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.kode_unit}
                                    onChange={(e) =>
                                        setData("kode_unit", e.target.value)
                                    }
                                    placeholder="Contoh: GCS-DT-01"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.kode_unit && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.kode_unit}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Jenis{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.jenis}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            jenis: e.target.value,
                                            tipe_unit:
                                                e.target.value === "alat_berat"
                                                    ? "alat_berat"
                                                    : "armada_jalan",
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="dump_truck">
                                        Dump Truck
                                    </option>
                                    <option value="dump_truck_tronton">
                                        Dump Truck Tronton
                                    </option>
                                    <option value="self_loader">
                                        Self Loader
                                    </option>
                                    <option value="alat_berat">
                                        Alat Berat
                                    </option>
                                    <option value="truck_molen">
                                        Truck Molen
                                    </option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                                {errors.jenis && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.jenis}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tipe Unit{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.tipe_unit}
                                    onChange={(e) =>
                                        setData("tipe_unit", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="armada_jalan">
                                        Armada Jalan
                                    </option>
                                    <option value="alat_berat">
                                        Alat Berat
                                    </option>
                                </select>
                                {errors.tipe_unit && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.tipe_unit}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Kategori 2: Identitas & Spesifikasi */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                                    <ClipboardList className="h-5 w-5 text-emerald-600" />
                                </span>
                                Identitas & Spesifikasi
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Data identitas, tahun, dan kapasitas unit.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Plat Nomor
                                    <span className="ml-1 font-normal text-slate-400">
                                        (Opsional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={data.plat_nomor}
                                    onChange={(e) =>
                                        setData("plat_nomor", e.target.value)
                                    }
                                    placeholder="Contoh: B 1234 XYZ"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.plat_nomor && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.plat_nomor}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tahun
                                </label>
                                <input
                                    type="number"
                                    value={data.tahun}
                                    onChange={(e) =>
                                        setData("tahun", e.target.value)
                                    }
                                    placeholder="Contoh: 2020"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.tahun && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.tahun}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Kapasitas
                                </label>
                                <input
                                    type="text"
                                    value={data.kapasitas}
                                    onChange={(e) =>
                                        setData("kapasitas", e.target.value)
                                    }
                                    placeholder="Contoh: 8 m³ / 5 ton"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.kapasitas && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.kapasitas}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Kategori 3: Informasi Operasional */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                                    <ClipboardList className="h-5 w-5 text-amber-600" />
                                </span>
                                Informasi Operasional
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Pengaturan tarif dan lokasi operasional unit.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Model Tarif{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.model_tarif}
                                    onChange={(e) =>
                                        setData("model_tarif", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="ritase">Ritase</option>
                                    <option value="sewa_jam">Sewa / Jam</option>
                                    <option value="internal">Internal</option>
                                </select>
                                {errors.model_tarif && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.model_tarif}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Titik (Basecamp)
                                </label>
                                <select
                                    value={data.titik_id}
                                    onChange={(e) =>
                                        setData("titik_id", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">— Pilih Titik —</option>
                                    {titiks.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.nama}
                                        </option>
                                    ))}
                                </select>
                                {errors.titik_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.titik_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tanggal Mulai Pakai
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_mulai_pakai}
                                    onChange={(e) =>
                                        setData(
                                            "tanggal_mulai_pakai",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                {errors.tanggal_mulai_pakai && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.tanggal_mulai_pakai}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Link
                            href={route("fleet.armada.index")}
                            className="rounded-lg border-2 border-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Batal
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? "Menyimpan..." : "Simpan Armada"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
