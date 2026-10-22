import React from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    Truck,
    ArrowLeft,
    Calendar,
    User,
    MapPin,
    Sparkles,
    Tractor,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Create({ sessions, armadas, drivers }) {
    console.log(armadas);
    const { data, setData, post, processing, errors } = useForm({
        production_session_id: "",
        armada_id: "",
        driver_karyawan_id: "",
        tujuan_alamat: "",
        waktu_muat: new Date().toISOString().slice(0, 16),
        catatan: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("production.pengiriman.store"));
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Jadwalkan Pengiriman
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Buat jadwal pengiriman baru untuk hasil
                                produksi.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Container */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Tractor className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Informasi Pengiriman
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Rincian jadwal dan tujuan pengiriman.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 p-5 sm:p-6">
                            {/* Sesi Produksi */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Sesi Produksi (Selesai){" "}
                                    <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={data.production_session_id}
                                    onChange={(e) =>
                                        setData(
                                            "production_session_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300"
                                >
                                    <option value="">-- Pilih Sesi --</option>
                                    {sessions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            #{s.id} - {formatTanggal(s.selesai)}{" "}
                                            | {s.produk?.nama} ({s.hasil_output}{" "}
                                            {s.produk?.satuan_output}) |{" "}
                                            {s.mesin?.nama}
                                        </option>
                                    ))}
                                </select>
                                {errors.production_session_id && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.production_session_id}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Pilih sesi produksi yang sudah selesai dan
                                    menghasilkan output.
                                </p>
                            </div>

                            {/* Armada & Driver */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Truck className="h-4 w-4 text-gray-400" />{" "}
                                        Armada Kendaraan
                                    </label>
                                    <select
                                        value={data.armada_id}
                                        onChange={(e) =>
                                            setData("armada_id", e.target.value)
                                        }
                                        className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300"
                                    >
                                        <option value="">
                                            -- Pilih Armada (Opsional) --
                                        </option>
                                        {armadas.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.plat_nomor} - {a.jenis}{" "}
                                                (Kapasitas: {a.kapasitas}T)
                                            </option>
                                        ))}
                                    </select>
                                    {errors.armada_id && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.armada_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <User className="h-4 w-4 text-gray-400" />{" "}
                                        Supir / Driver
                                    </label>
                                    <select
                                        value={data.driver_karyawan_id}
                                        onChange={(e) =>
                                            setData(
                                                "driver_karyawan_id",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300"
                                    >
                                        <option value="">
                                            -- Pilih Supir (Opsional) --
                                        </option>
                                        {drivers.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.nama} ({d.jabatan})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.driver_karyawan_id && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.driver_karyawan_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Tujuan & Waktu Muat */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <MapPin className="h-4 w-4 text-gray-400" />{" "}
                                        Tujuan Pengiriman{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.tujuan_alamat}
                                        onChange={(e) =>
                                            setData(
                                                "tujuan_alamat",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        placeholder="Misal: Proyek Gedung A Lt. 3"
                                        className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300"
                                    />
                                    {errors.tujuan_alamat && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.tujuan_alamat}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Calendar className="h-4 w-4 text-gray-400" />{" "}
                                        Waktu Muat{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={data.waktu_muat}
                                        onChange={(e) =>
                                            setData(
                                                "waktu_muat",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300"
                                    />
                                    {errors.waktu_muat && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.waktu_muat}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Catatan Tambahan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Catatan Tambahan
                                </label>
                                <textarea
                                    value={data.catatan}
                                    onChange={(e) =>
                                        setData("catatan", e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Instruksi jalan, rute khusus, dsb..."
                                    className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300"
                                />
                            </div>

                            {/* Submit Actions */}
                            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                                <Link
                                    href={route("production.pengiriman.index")}
                                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                                >
                                    <ArrowLeft className="w-4 h-4"/>
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Truck className="h-4 w-4"/>
                                    {processing
                                        ? "Menyimpan..."
                                        : "Jadwalkan Pengiriman"}
                                </button>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </Layout>
    );
}
