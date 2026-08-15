import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Clock, LogOut, MapPin, ShieldCheck } from "lucide-react";

const getStatusBadge = (status) => {
    const colors = {
        valid: "bg-green-200 text-green-800",
        tidak_valid: "bg-red-200 text-red-800",
        luar_radius: "bg-yellow-200 text-yellow-800",
    };
    return colors[status] || "bg-gray-200 text-gray-800";
};

export default function Show({ presensi }) {
    const [checkout, setCheckout] = useState({ check_out_lat: "", check_out_lng: "" });
    const [review, setReview] = useState({ status_validasi: presensi.status_validasi, catatan_override: presensi.catatan_override || "" });
    const [processing, setProcessing] = useState(false);

    const doCheckout = () => {
        if (!navigator.geolocation) {
            alert("Geolocation tidak didukung.");
            return;
        }
        setProcessing(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                router.post(
                    route("attendance.presensi.check-out", presensi.id),
                    {
                        check_out_lat: pos.coords.latitude.toFixed(8),
                        check_out_lng: pos.coords.longitude.toFixed(8),
                    },
                    { preserveScroll: true, onFinish: () => setProcessing(false) }
                );
            },
            (err) => {
                alert("Gagal mendapatkan lokasi: " + err.message);
                setProcessing(false);
            }
        );
    };

    const doReview = (e) => {
        e.preventDefault();
        router.post(route("attendance.presensi.review", presensi.id), review, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Detail Presensi" />

            <div className="mb-6">
                <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Detail Presensi</h1>
                <p className="mt-1 text-sm text-gray-500">{presensi.karyawan?.nama}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Karyawan</p>
                            <p className="text-lg font-semibold text-gray-900">{presensi.karyawan?.nama}</p>
                            <p className="text-sm text-gray-600">{presensi.karyawan?.jabatan} · {presensi.karyawan?.tipe}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(presensi.status_validasi)}`}>
                            {presensi.status_validasi?.replace(/_/g, " ")}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Check-In</p>
                                <p className="text-sm text-gray-600">{new Date(presensi.check_in).toLocaleString("id-ID")}</p>
                                {presensi.check_in_lat && (
                                    <p className="text-xs text-gray-500">{presensi.check_in_lat}, {presensi.check_in_lng}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <LogOut className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Check-Out</p>
                                <p className="text-sm text-gray-600">
                                    {presensi.check_out ? new Date(presensi.check_out).toLocaleString("id-ID") : "Belum check-out"}
                                </p>
                                {presensi.check_out_lat && (
                                    <p className="text-xs text-gray-500">{presensi.check_out_lat}, {presensi.check_out_lng}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 border-t border-gray-100 pt-4">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Titik</p>
                            <p className="text-sm text-gray-600">{presensi.titik?.nama || "Tidak ada titik"}</p>
                        </div>
                    </div>

                    {presensi.catatan_override && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm text-amber-800"><strong>Catatan Override:</strong> {presensi.catatan_override}</p>
                        </div>
                    )}

                    {/* Formulir Lapangan */}
                    {presensi.formulir && (
                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-sm font-medium text-gray-900 mb-2">Formulir Lapangan</p>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p className="text-sm text-gray-700"><strong>Kondisi Area:</strong> {presensi.formulir.kondisi_area || "-"}</p>
                                <p className="text-sm text-gray-700"><strong>Aktivitas:</strong> {presensi.formulir.aktivitas_dilakukan}</p>
                                <p className="text-sm text-gray-700"><strong>Kendala:</strong> {presensi.formulir.kendala || "-"}</p>
                                {presensi.formulir.catatan_tambahan && (
                                    <p className="text-sm text-gray-700"><strong>Catatan:</strong> {presensi.formulir.catatan_tambahan}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Check-out */}
                    {!presensi.check_out && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <LogOut className="w-4 h-4 text-gray-400" />
                                Check-Out
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">Deteksi lokasi saat ini untuk mencatat waktu selesai.</p>
                            <button
                                onClick={doCheckout}
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md text-sm disabled:opacity-50"
                            >
                                {processing ? "Mendeteksi..." : "Catat Check-Out Sekarang"}
                            </button>
                        </div>
                    )}

                    {/* Review validasi */}
                    <form onSubmit={doReview} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-gray-400" />
                            Review Validasi
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={review.status_validasi}
                                    onChange={(e) => setReview({ ...review, status_validasi: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="valid">Valid</option>
                                    <option value="tidak_valid">Tidak Valid</option>
                                    <option value="luar_radius">Luar Radius</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Override</label>
                                <textarea
                                    value={review.catatan_override}
                                    onChange={(e) => setReview({ ...review, catatan_override: e.target.value })}
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md text-sm"
                            >
                                Simpan Review
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}