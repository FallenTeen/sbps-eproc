import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { AlertTriangle } from "lucide-react";

export default function Anomaly({ anomalies }) {
    return (
        <AuthenticatedLayout>
            <Head title="Anomali BBM" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Anomali Konsumsi BBM</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Deteksi pemakaian BBM di atas estimasi rute / rata-rata historis
                </p>
            </div>

            {anomalies.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                    <p className="text-gray-500">Tidak ada anomali terdeteksi.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {anomalies.map((a, i) => (
                        <div key={i} className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <span className="font-semibold text-gray-900">
                                        {a.bbm_log?.serviceable?.kode_unit || a.bbm_log?.serviceable?.nama || "Unit"}
                                    </span>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                    {a.metode === "estimasi_rute" ? "Estimasi Rute" : "Rata-rata Historis"}
                                </span>
                            </div>

                            <p className="text-xs text-gray-500 mb-2">
                                {a.bbm_log?.tanggal
                                    ? new Date(a.bbm_log.tanggal).toLocaleDateString("id-ID")
                                    : "-"}{" "}
                                · {Number(a.bbm_log?.liter || 0).toLocaleString("id-ID")} liter
                            </p>

                            {a.metode === "estimasi_rute" ? (
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Aktual</p>
                                        <p className="font-semibold text-gray-900">{Number(a.liter_aktual).toLocaleString("id-ID")} L</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Estimasi</p>
                                        <p className="font-semibold text-gray-900">{Number(a.estimasi_liter).toLocaleString("id-ID")} L</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Threshold</p>
                                        <p className="font-semibold text-red-600">{Number(a.threshold).toLocaleString("id-ID")} L</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Jarak</p>
                                        <p className="font-semibold text-gray-900">{Number(a.total_jarak_km).toLocaleString("id-ID")} km</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Liter / Jam</p>
                                        <p className="font-semibold text-gray-900">{Number(a.liter_per_jam).toLocaleString("id-ID")}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Rata-rata Normal</p>
                                        <p className="font-semibold text-gray-900">{Number(a.rata_rata_normal).toLocaleString("id-ID")}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Threshold</p>
                                        <p className="font-semibold text-red-600">{Number(a.threshold).toLocaleString("id-ID")}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}