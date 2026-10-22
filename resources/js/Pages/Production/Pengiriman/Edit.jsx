import React from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Truck, ArrowLeft, Calendar, User, MapPin, Save } from "lucide-react";

export default function Edit({ pengiriman, armadas, drivers }) {
    const { data, setData, put, processing, errors } = useForm({
        armada_id: pengiriman.armada_id || "",
        driver_karyawan_id: pengiriman.driver_karyawan_id || "",
        tujuan_alamat: pengiriman.tujuan_alamat,
        waktu_muat: pengiriman.waktu_muat
            ? new Date(pengiriman.waktu_muat).toISOString().slice(0, 16)
            : "",
        catatan: pengiriman.catatan || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("production.pengiriman.update", pengiriman.id));
    };

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Ubah Pengiriman
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Ubah jadwal pengiriman #{pengiriman.id} —{" "}
                                {pengiriman.session?.produk?.nama}.
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
                                    <Truck className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Informasi Pengiriman
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Perbarui penugasan logistik dan tujuan
                                        pengiriman.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 p-5 sm:p-6">
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
                                        className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300 focus:border-blue-500"
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
                                        className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300 focus:border-blue-500"
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
                                        className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300 focus:border-blue-500"
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
                                        className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300 focus:border-blue-500"
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
                                    className="w-full rounded-lg border-gray-300 text-sm focus:ring-blue-300 focus:border-blue-500"
                                />
                            </div>

                            {/* Submit Actions */}
                            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                                <Link
                                    href={route(
                                        "production.pengiriman.show",
                                        pengiriman.id,
                                    )}
                                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing
                                        ? "Memperbarui..."
                                        : "Simpan Perubahan"}
                                </button>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </Layout>
    );
}
