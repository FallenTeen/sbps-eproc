import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Clock, LocateFixed, Save } from "lucide-react";
import TitikSelectorWithMap from "@/Components/TitikSelectorWithMap";

export default function Create({ karyawan, titiks }) {
    const [data, setData] = useState({
        karyawan_id: "",
        titik_id: "",
        check_in: new Date().toISOString().slice(0, 16),
        check_in_lat: "",
        check_in_lng: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [locating, setLocating] = useState(false);

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation tidak didukung browser ini.");
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setData({
                    ...data,
                    check_in_lat: pos.coords.latitude.toFixed(8),
                    check_in_lng: pos.coords.longitude.toFixed(8),
                });
                setLocating(false);
            },
            (err) => {
                alert("Gagal mendapatkan lokasi: " + err.message);
                setLocating(false);
            }
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route("attendance.presensi.store"), data, {
            onSuccess: () => setProcessing(false),
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
<AuthenticatedLayout>
    <Head title="Catat Presensi" />

    <div className="mx-auto max-w-5xl">
        {/* Header Halaman */}
        <div className="mb-6 flex items-start justify-between">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    Catat Presensi
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Check-in karyawan secara manual dengan validasi lokasi titik.
                </p>
            </div>
        </div>

        {/* Form Container Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 border-b border-slate-100 pb-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </span>
                        Formulir Check-In Presensi
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                        Isi detail karyawan, titik penugasan, waktu, serta koordinat lokasi check-in.
                    </p>
                </div>

                <div className="space-y-5">
                    {/* Pilih Karyawan */}
                    <div>
                        <label htmlFor="karyawan_id" className="mb-2 block text-sm font-medium text-gray-700">
                            Karyawan <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="karyawan_id"
                            value={data.karyawan_id}
                            onChange={(e) => setData({ ...data, karyawan_id: e.target.value })}
                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                errors.karyawan_id
                                    ? "border-red-500 focus:ring-red-100"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                            }`}
                        >
                            <option value="">-- Pilih Karyawan --</option>
                            {karyawan.map((k) => (
                                <option key={k.id} value={k.id}>
                                    {k.nama} ({k.jabatan})
                                </option>
                            ))}
                        </select>
                        {errors.karyawan_id && (
                            <p className="mt-1.5 text-xs text-red-600">{errors.karyawan_id}</p>
                        )}
                    </div>

                    {/* Titik Selector */}
                    <div>
                        <TitikSelectorWithMap
                            titiks={titiks}
                            value={data.titik_id}
                            onChange={(val) => setData({ ...data, titik_id: val })}
                            error={errors.titik_id}
                            label="Titik Lokasi"
                            placeholder="-- Pilih Titik (opsional) --"
                            optionFormatter={(t) => t.nama}
                            mapHeight="260px"
                        />
                    </div>

                    {/* Waktu Check-In */}
                    <div>
                        <label htmlFor="check_in" className="mb-2 block text-sm font-medium text-gray-700">
                            Waktu Check-In <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="check_in"
                            value={data.check_in}
                            onChange={(e) => setData({ ...data, check_in: e.target.value })}
                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                errors.check_in
                                    ? "border-red-500 focus:ring-red-100"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                            }`}
                        />
                        {errors.check_in && (
                            <p className="mt-1.5 text-xs text-red-600">{errors.check_in}</p>
                        )}
                    </div>

                    {/* Koordinat Lokasi Check-In */}
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <label className="text-sm font-medium text-gray-700">
                                Lokasi Check-In (Koordinat GPS) <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={getLocation}
                                disabled={locating}
                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                                <LocateFixed className="h-4 w-4" />
                                {locating ? "Mendeteksi Lokasi..." : "Deteksi Lokasi Saya"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <input
                                    type="number"
                                    step="any"
                                    value={data.check_in_lat}
                                    onChange={(e) => setData({ ...data, check_in_lat: e.target.value })}
                                    placeholder="Latitude (contoh: -7.4243)"
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.check_in_lat
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                {errors.check_in_lat && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.check_in_lat}</p>
                                )}
                            </div>
                            <div>
                                <input
                                    type="number"
                                    step="any"
                                    value={data.check_in_lng}
                                    onChange={(e) => setData({ ...data, check_in_lng: e.target.value })}
                                    placeholder="Longitude (contoh: 109.2392)"
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.check_in_lng
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                />
                                {errors.check_in_lng && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.check_in_lng}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tombol Aksi */}
                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Batal
                    </button>

                    <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </section>
        </form>
    </div>
</AuthenticatedLayout>
    );
}