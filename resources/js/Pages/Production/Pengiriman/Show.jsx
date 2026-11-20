import React from "react";
import { Link, useForm, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft,
    Truck,
    Play,
    CheckCircle2,
    Clock,
    MapPin,
    XCircle,
    AlertTriangle,
    Edit,
    Package,
    Navigation,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Show({ pengiriman }) {
    const isScheduled = pengiriman.status === "dijadwalkan";
    const isTraveling = pengiriman.status === "dalam_perjalanan";
    const isCompleted = pengiriman.status === "selesai";
    const isCancelled = pengiriman.status === "dibatalkan";

    const getStatusStyle = () => {
        if (isScheduled) return "bg-yellow-100 text-yellow-800";
        if (isTraveling) return "bg-blue-100 text-blue-800 animate-pulse";
        if (isCompleted) return "bg-emerald-100 text-emerald-800";
        return "bg-gray-100 text-gray-800";
    };

    function getStatusColor(status) {
        switch (status) {
            case "dijadwalkan":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "dalam_perjalanan":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "selesai":
                return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "dibatalkan":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }

    const handleStart = () => {
        if (confirm("Mulai perjalanan pengiriman ini?")) {
            router.post(route("production.pengiriman.start", pengiriman.id));
        }
    };

    const handleCancel = () => {
        if (confirm("Batalkan pengiriman ini?")) {
            router.post(route("production.pengiriman.cancel", pengiriman.id));
        }
    };

    return (
        <Layout>
            {/* Header / Top Action Bar */}
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex w-full items-start justify-between gap-4 sm:w-auto sm:flex-1">
                    <div className="min-w-0">
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900">
                            Detail Pengiriman
                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getStatusColor(pengiriman.status)}`}
                            >
                                {pengiriman.status.replaceAll("_", " ")}
                            </span>
                        </h1>
                        <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-gray-500">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                            {pengiriman.tujuan_alamat}
                        </p>
                    </div>
                    <Link
                        href={route("production.pengiriman.index")}
                        className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Kembali
                    </Link>
                </div>

                {isScheduled && (
                    <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                        <Link
                            href={route(
                                "production.pengiriman.edit",
                                pengiriman.id,
                            )}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                        >
                            <Edit className="h-4 w-4" /> Ubah
                        </Link>

                        <button
                            onClick={handleCancel}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                        >
                            <XCircle className="h-4 w-4" /> Batalkan
                        </button>

                        <button
                            onClick={handleStart}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
                        >
                            <Play className="h-4 w-4" /> Mulai Perjalanan
                        </button>
                    </div>
                )}
            </div>

            {/* Content Cards Grid */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Informasi Produk & Sesi */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4 text-base font-bold text-gray-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <Package className="h-5 w-5" />
                        </span>
                        Informasi Produk & Sesi
                    </h3>

                    <div className="space-y-3">
                        <div className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <span className="text-sm text-gray-500">
                                ID Sesi
                            </span>
                            <Link
                                href={route(
                                    "production.sessions.show",
                                    pengiriman.production_session_id,
                                )}
                                className="text-sm font-semibold text-blue-600 hover:underline"
                            >
                                #{pengiriman.production_session_id}
                            </Link>
                        </div>

                        <div className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <span className="text-sm text-gray-500">
                                Produk
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                                {pengiriman.session?.produk?.nama}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <span className="text-sm text-gray-500">
                                Volume Output Sesi
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                                {pengiriman.session?.hasil_output}{" "}
                                {pengiriman.session?.produk?.satuan_output}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <span className="text-sm text-gray-500">
                                Mesin Produksi
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                                {pengiriman.session?.mesin?.nama}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Logistik & Tujuan */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4 text-base font-bold text-gray-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <Navigation className="h-5 w-5" />
                        </span>
                        Logistik & Tujuan
                    </h3>

                    <div className="space-y-3">
                        <div className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <MapPin className="h-4 w-4" /> Tujuan
                            </span>
                            <span className="max-w-[60%] text-right text-sm font-medium text-gray-900">
                                {pengiriman.tujuan_alamat}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Truck className="h-4 w-4" /> Armada
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                                {pengiriman.armada?.plat_nomor}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Truck className="h-4 w-4" /> Supir
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                                {pengiriman.driver?.nama ?? "-"}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Clock className="h-4 w-4" /> Waktu Muat
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                                {formatTanggal(pengiriman.waktu_muat)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conditional Completion Panels */}
            {isTraveling && <CompleteDeliveryPanel pengiriman={pengiriman} />}

            {isCompleted && (
                <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-3 text-emerald-700">
                        <CheckCircle2 className="h-6 w-6" />
                        <h3 className="text-lg font-bold">
                            Pengiriman Selesai
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <p className="mb-1 text-sm text-gray-500">
                                Waktu Tiba di Tujuan
                            </p>
                            <p className="font-semibold text-gray-900">
                                {formatTanggal(pengiriman.waktu_tiba_tujuan)}
                            </p>
                        </div>

                        <div>
                            <p className="mb-1 text-sm text-gray-500">
                                Waktu Selesai Tuang
                            </p>
                            <p className="font-semibold text-gray-900">
                                {formatTanggal(pengiriman.waktu_selesai_tuang)}
                            </p>
                        </div>
                    </div>

                    {pengiriman.catatan && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <p className="mb-1 text-sm text-gray-500">
                                Catatan Penyelesaian
                            </p>
                            <p className="text-sm text-gray-800">
                                {pengiriman.catatan}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
}

function CompleteDeliveryPanel({ pengiriman }) {
    const { data, setData, post, processing, errors } = useForm({
        waktu_tiba_tujuan: "",
        waktu_selesai_tuang: "",
        catatan: "",
    });

    let warning = null;

    if (data.waktu_selesai_tuang && pengiriman.waktu_muat) {
        const diffMins = Math.round(
            (new Date(data.waktu_selesai_tuang) -
                new Date(pengiriman.waktu_muat)) /
                60000,
        );

        if (diffMins > 120) {
            warning = `Durasi dari muat hingga selesai tuang mencapai ${diffMins} menit (Batas aman: 120 menit). Mutu beton mungkin terpengaruh.`;
        } else if (diffMins < 0) {
            warning = "Waktu selesai tuang tidak boleh mendahului waktu muat.";
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("production.pengiriman.complete", pengiriman.id));
    };

    return (
        <div className="mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50 px-5 py-4 sm:px-6">
                <Truck className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-blue-900">
                    Selesaikan Pengiriman
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Waktu Tiba di Tujuan (Opsional)
                        </label>
                        <input
                            type="datetime-local"
                            value={data.waktu_tiba_tujuan}
                            onChange={(e) =>
                                setData("waktu_tiba_tujuan", e.target.value)
                            }
                            className="w-full rounded-xl border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-300"
                        />
                        {errors.waktu_tiba_tujuan && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.waktu_tiba_tujuan}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Waktu Selesai Tuang
                        </label>
                        <input
                            type="datetime-local"
                            value={data.waktu_selesai_tuang}
                            onChange={(e) =>
                                setData("waktu_selesai_tuang", e.target.value)
                            }
                            required
                            className={`w-full rounded-xl border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-300 ${
                                warning && warning.includes("Batas aman")
                                    ? "border-orange-400 bg-orange-50"
                                    : ""
                            }`}
                        />
                        {errors.waktu_selesai_tuang && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.waktu_selesai_tuang}
                            </p>
                        )}
                        {warning && (
                            <div className="mt-2 flex items-start gap-1.5 rounded border border-orange-200 bg-orange-50 p-2 text-xs text-orange-700">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{warning}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Catatan Penyelesaian
                    </label>
                    <textarea
                        value={data.catatan}
                        onChange={(e) => setData("catatan", e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-300"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-5 w-5" /> Konfirmasi Selesai
                    </button>
                </div>
            </form>
        </div>
    );
}
