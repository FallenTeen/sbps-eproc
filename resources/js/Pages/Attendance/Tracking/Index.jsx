import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TrackingTimelineMap from "@/Components/TrackingTimelineMap";
import { Search, MapPin, Clock, Satellite, Navigation, User, RefreshCw } from "lucide-react";

const STALE_MINUTES = 10;

function freshness(lastSeen) {
    if (!lastSeen) {
        return { label: "Tanpa GPS", className: "bg-gray-100 text-gray-600 border border-gray-200" };
    }
    const diffMinutes = (Date.now() - new Date(lastSeen).getTime()) / 60000;
    if (diffMinutes <= STALE_MINUTES) {
        return { label: "Segar", className: "bg-green-100 text-green-700 border border-green-200" };
    }
    return { label: "Stale", className: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
}

function formatJam(value, withDate = false) {
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        ...(withDate ? { day: "2-digit", month: "short" } : {}),
    });
}

export default function Index({ rows = [], selected = null, karyawan = [], filters = {} }) {
    const [tanggal, setTanggal] = useState(filters.tanggal || "");
    const [karyawanId, setKaryawanId] = useState(filters.karyawan_id || "");

    const apply = (overrides = {}) => {
        const params = {
            tanggal: overrides.tanggal ?? tanggal,
            karyawan_id: overrides.karyawanId ?? karyawanId,
            presensi_id: overrides.presensiId ?? "",
        };
        router.get(route("attendance.tracking.index"), params, { preserveScroll: true });
    };

    const openPresensi = (id) => {
        apply({ presensiId: id });
    };

    const selectedTracking = selected?.tracking || null;
    const terpilih = selected?.id && selected.id === filters.presensi_id;

    return (
        <AuthenticatedLayout>
            <Head title="Tracking Linimasa" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tracking Linimasa</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Linimasa lokasi GPS karyawan per hari (khusus Owner). Titik disampling tiap 30 menit untuk tampilan.
                    </p>
                </div>
                <button
                    onClick={() => apply()}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    <RefreshCw className="w-4 h-4" />
                    Muat Ulang
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Karyawan</label>
                        <select
                            value={karyawanId}
                            onChange={(e) => {
                                setKaryawanId(e.target.value);
                                apply({ karyawanId: e.target.value, presensiId: "" });
                            }}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Semua</option>
                            {karyawan.map((k) => (
                                <option key={k.id} value={k.id}>{k.nama}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => apply({ presensiId: "" })}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        <Search className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Daftar presensi hari itu */}
                <div className="xl:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-900">Presensi Hari Ini</h2>
                        <span className="text-xs text-gray-500">{rows.length} karyawan</span>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[620px] overflow-y-auto">
                        {rows.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-gray-500 text-center">
                                Tidak ada presensi pada tanggal ini.
                            </p>
                        ) : (
                            rows.map((r) => {
                                const fresh = freshness(r.last_seen);
                                const isActive = r.id === filters.presensi_id;
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => openPresensi(r.id)}
                                        className={`w-full text-left px-4 py-3 transition ${
                                            isActive ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-900"}`}>
                                                {r.nama}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                isActive ? "bg-white/20 text-white" : fresh.className
                                            }`}>
                                                <Satellite className="w-3 h-3" />
                                                {fresh.label}
                                            </span>
                                        </div>
                                        <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs ${isActive ? "text-gray-300" : "text-gray-500"}`}>
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {r.titik || "Tanpa titik"}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatJam(r.check_in)} – {r.check_out ? formatJam(r.check_out) : "aktif"}
                                            </span>
                                        </div>
                                        <div className={`mt-1 text-xs ${isActive ? "text-gray-300" : "text-gray-500"}`}>
                                            GPS terakhir: {formatJam(r.last_seen, true)} • {r.point_count} titik
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Linimasa terpilih */}
                <div className="xl:col-span-2">
                    {selected && terpilih ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        {selected.nama}
                                    </h2>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {selected.titik?.nama || "Tanpa titik"}
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                    <Navigation className="w-3.5 h-3.5" />
                                    {selectedTracking?.raw_count ?? 0} titik GPS mentah
                                </span>
                            </div>
                            <TrackingTimelineMap tracking={selectedTracking} titik={selected.titik} />
                        </div>
                    ) : (
                        <div className="h-full min-h-[460px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                            <Navigation className="w-10 h-10 mb-3" />
                            <p className="text-sm">Pilih karyawan di kiri untuk menampilkan linimasa lokasinya.</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
