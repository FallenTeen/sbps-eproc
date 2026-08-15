import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, LocateFixed, Save } from "lucide-react";

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

            <div className="mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Catat Presensi</h1>
                <p className="mt-1 text-sm text-gray-500">Check-in karyawan dengan validasi lokasi</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Karyawan *</label>
                    <select
                        value={data.karyawan_id}
                        onChange={(e) => setData({ ...data, karyawan_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    >
                        <option value="">Pilih Karyawan</option>
                        {karyawan.map((k) => (
                            <option key={k.id} value={k.id}>{k.nama} ({k.jabatan})</option>
                        ))}
                    </select>
                    {errors.karyawan_id && <p className="text-red-600 text-sm mt-1">{errors.karyawan_id}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titik</label>
                    <select
                        value={data.titik_id}
                        onChange={(e) => setData({ ...data, titik_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    >
                        <option value="">-- Pilih Titik (opsional) --</option>
                        {titiks.map((t) => (
                            <option key={t.id} value={t.id}>{t.nama}</option>
                        ))}
                    </select>
                    {errors.titik_id && <p className="text-red-600 text-sm mt-1">{errors.titik_id}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Check-In *</label>
                    <input
                        type="datetime-local"
                        value={data.check_in}
                        onChange={(e) => setData({ ...data, check_in: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                    {errors.check_in && <p className="text-red-600 text-sm mt-1">{errors.check_in}</p>}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Lokasi Check-In *</label>
                        <button
                            type="button"
                            onClick={getLocation}
                            disabled={locating}
                            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                            <LocateFixed className="w-4 h-4" />
                            {locating ? "Mendeteksi..." : "Deteksi Lokasi Saya"}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <input
                                type="number"
                                step="any"
                                value={data.check_in_lat}
                                onChange={(e) => setData({ ...data, check_in_lat: e.target.value })}
                                placeholder="Latitude"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                            />
                            {errors.check_in_lat && <p className="text-red-600 text-sm mt-1">{errors.check_in_lat}</p>}
                        </div>
                        <div>
                            <input
                                type="number"
                                step="any"
                                value={data.check_in_lng}
                                onChange={(e) => setData({ ...data, check_in_lng: e.target.value })}
                                placeholder="Longitude"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                            />
                            {errors.check_in_lng && <p className="text-red-600 text-sm mt-1">{errors.check_in_lng}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {processing ? "Menyimpan..." : "Simpan Presensi"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}