import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft,
    Activity,
    Play,
    StopCircle,
    Package,
    Eye,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

function liveDurasi(mulai) {
    if (!mulai) return "-";
    const mins = Math.round((Date.now() - new Date(mulai)) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
}

export default function Active({ sessions }) {
    const [durations, setDurations] = useState(() =>
        Object.fromEntries(sessions.map((s) => [s.id, liveDurasi(s.mulai)])),
    );

    useEffect(() => {
        const t = setInterval(() => {
            setDurations(
                Object.fromEntries(
                    sessions.map((s) => [s.id, liveDurasi(s.mulai)]),
                ),
            );
        }, 30000);
        return () => clearInterval(t);
    }, [sessions]);

    const handleEnd = (sessionId) => {
        router.get(route("production.sessions.show", sessionId));
    };

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Sesi Produksi Aktif
                            </h1>
                            <p className="mt-0.5 text-sm text-red-600">
                                {sessions.length} <span className="text-gray-600">Sesi Sedang Berjalan</span>
                            </p>
                        </div>
                    </div>
                </div>

                <Link
                    href={route("production.sessions.index")}
                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Link>
            </div>

            {/* Empty State */}
            {sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <Activity className="h-8 w-8 text-gray-400" />
                    </div>

                    <h3 className="text-base font-semibold text-gray-900">
                        Tidak Ada Sesi Produksi Aktif
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Belum ada sesi produksi yang sedang berjalan saat ini.
                    </p>

                    <Link
                        href={route("production.sessions.create")}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                        <Play className="h-4 w-4" />
                        Mulai Sesi Baru
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {sessions.map((s) => (
                        <div
                            key={s.id}
                            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                        >
                            {/* Card Header */}
                            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white px-5 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                                            <Activity className="h-5 w-5 animate-pulse text-blue-600" />
                                        </div>

                                        <div className="min-w-0">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                                Sedang Berjalan
                                            </span>

                                            <p className="mt-1.5 truncate text-xs text-gray-500">
                                                Sesi #{s.id}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 rounded-lg border border-blue-100 bg-white px-3 py-2 text-right shadow-sm">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-900">
                                            Durasi
                                        </p>
                                        <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-blue-700">
                                            {durations[s.id] ?? "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-5">
                                <div className="mb-5">
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                                        Mesin Produksi
                                    </p>

                                    <h3 className="text-lg font-bold leading-snug text-gray-900">
                                        {s.mesin?.nama || "-"}
                                    </h3>

                                    <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                                        <Package className="h-4 w-4 shrink-0" />
                                        <span className="truncate">
                                            {s.produk?.nama || "-"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                                    <Row
                                        label="Titik"
                                        value={s.titik?.nama || "-"}
                                    />

                                    <Row
                                        label="Operator"
                                        value={s.operator?.nama || "-"}
                                    />

                                    <Row
                                        label="Mulai"
                                        value={formatTanggal(s.mulai ?? "-")}
                                    />

                                    {s.catatan && (
                                        <Row
                                            label="Catatan"
                                            value={s.catatan}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="flex gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                                <Link
                                    href={route(
                                        "production.sessions.show",
                                        s.id,
                                    )}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-500 bg-white px-4 py-2.5 text-sm font-semibold text-amber-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <Eye className="h-4 w-4" />
                                    Detail
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => handleEnd(s.id)}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                    <StopCircle className="h-4 w-4" />
                                    Akhiri
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
            <dd className="font-medium text-gray-800 text-right max-w-[60%]">
                {value}
            </dd>
        </div>
    );
}
