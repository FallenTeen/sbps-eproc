import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Activity, Play, StopCircle } from "lucide-react";

function liveDurasi(mulai) {
    if (!mulai) return "-";
    const mins = Math.round((Date.now() - new Date(mulai)) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
}

export default function Active({ sessions }) {
    const [durations, setDurations] = useState(
        () => Object.fromEntries(sessions.map(s => [s.id, liveDurasi(s.mulai)]))
    );

    useEffect(() => {
        const t = setInterval(() => {
            setDurations(Object.fromEntries(sessions.map(s => [s.id, liveDurasi(s.mulai)])));
        }, 30000);
        return () => clearInterval(t);
    }, [sessions]);

    const handleEnd = (sessionId) => {
        router.get(route("production.sessions.show", sessionId));
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route("production.sessions.index")} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                        <h1 className="text-2xl font-bold text-gray-900">Sesi Produksi Aktif</h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{sessions.length} sesi sedang berjalan</p>
                </div>
            </div>

            {sessions.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                    <Activity className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Tidak ada sesi yang sedang berjalan.</p>
                    <Link href={route("production.sessions.create")}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                        <Play className="w-4 h-4" /> Mulai Sesi Baru
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sessions.map(s => (
                        <div key={s.id} className="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            {/* Top bar */}
                            <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-200 animate-pulse" />
                                    <span className="text-white text-xs font-semibold uppercase tracking-wide">Sedang Berjalan</span>
                                </div>
                                <span className="text-blue-100 text-xs font-mono">{durations[s.id]}</span>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="text-base font-bold text-gray-900 mb-1">{s.mesin?.nama}</h3>
                                <p className="text-sm text-blue-600 font-medium mb-4">{s.produk?.nama}</p>

                                <dl className="space-y-2">
                                    <Row label="Titik" value={s.titik?.nama || "-"} />
                                    <Row label="Operator" value={s.operator?.nama || "-"} />
                                    <Row label="Mulai" value={new Date(s.mulai).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} />
                                    {s.catatan && <Row label="Catatan" value={s.catatan} />}
                                </dl>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
                                <Link href={route("production.sessions.show", s.id)}
                                    className="flex-1 text-center text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 py-2 rounded-lg transition-colors font-medium">
                                    Detail
                                </Link>
                                <button onClick={() => handleEnd(s.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors font-semibold">
                                    <StopCircle className="w-4 h-4" /> Akhiri
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-800 text-right max-w-[60%]">{value}</dd>
        </div>
    );
}
