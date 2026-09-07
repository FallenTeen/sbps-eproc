import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Activity, AlertTriangle, ClipboardCheck, Truck } from "lucide-react";

const fmt = (d) => (d ? new Date(d).toLocaleDateString("id-ID") : "-");

export default function Monitoring({ kondisi_buruk, belum_checklist, stats }) {
    return (
        <AuthenticatedLayout>
            <Head title="Workshop — Monitoring Kondisi Alat" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Monitoring Kondisi Alat Produksi</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Bersumber dari data checklist harian (18.8/21.3) — armada &amp; mesin dengan kondisi tidak baik, dan unit belum di-check hari ini
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-red-100 text-red-700">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{stats.unit_bermasalah}</div>
                            <div className="text-xs text-gray-500">Unit kondisi tidak baik</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                            <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{stats.belum_checklist_hari_ini}</div>
                            <div className="text-xs text-gray-500">Armada belum checklist hari ini</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-gray-900 text-white">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{stats.total_armada}</div>
                            <div className="text-xs text-gray-500">Total armada aktif</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kondisi buruk */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <h2 className="font-semibold text-gray-900">Kondisi Tidak Baik (24 jam terakhir)</h2>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                        {kondisi_buruk.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">Semua unit dalam kondisi baik.</div>
                        ) : (
                            kondisi_buruk.map((k) => (
                                <div key={k.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {k.checkable?.plat_nomor || k.checkable?.nama || "-"}
                                        </span>
                                        <span className="text-xs text-gray-500">{fmt(k.tanggal)}</span>
                                    </div>
                                    {k.item_bermasalah && (
                                        <div className="mt-1 text-sm text-red-700">{k.item_bermasalah}</div>
                                    )}
                                    {k.dicatat_oleh?.nama && (
                                        <div className="mt-1 text-xs text-gray-400">
                                            Dicatat oleh: {k.dicatat_oleh.nama}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Belum checklist hari ini */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-600" />
                        <h2 className="font-semibold text-gray-900">Armada Belum Checklist Hari Ini</h2>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                        {belum_checklist.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">Semua armada sudah check hari ini.</div>
                        ) : (
                            belum_checklist.map((a) => (
                                <div key={a.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">{a.plat_nomor}</div>
                                        <div className="text-xs text-gray-500">{a.kode_unit}</div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                        Belum diisi
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}