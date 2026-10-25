import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import {
    BarChart3,
    PieChart,
    DollarSign,
    TrendingUp,
    Calendar,
    Building2,
    ArrowRight,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

export default function Index({ auth, unitBisnisList = [], filters = {} }) {
    const handleFilterChange = (key, value) => {
        router.get(
            route("finance.laporan-keuangan.index"),
            {
                ...filters,
                [key]: value,
            },
            { preserveState: true },
        );
    };

    const months = [
        { value: "01", label: "Januari" },
        { value: "02", label: "Februari" },
        { value: "03", label: "Maret" },
        { value: "04", label: "April" },
        { value: "05", label: "Mei" },
        { value: "06", label: "Juni" },
        { value: "07", label: "Juli" },
        { value: "08", label: "Agustus" },
        { value: "09", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) =>
        (currentYear - 2 + i).toString(),
    );

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Keuangan" />

            <div className="mx-auto  space-y-6">
                {/* Header Halaman */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Pusat Laporan Keuangan
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Pilih filter periode dan unit bisnis untuk mengakses
                            laporan performa keuangan.
                        </p>
                    </div>
                </div>

                {/* Card Filter Periode & Unit Bisnis */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {/* Unit Bisnis */}
                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <Building2 className="h-4 w-4 text-gray-500" />
                                Unit Bisnis
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                value={filters.unit_bisnis_id || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "unit_bisnis_id",
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">Semua Unit Bisnis</option>
                                {unitBisnisList.map((ub) => (
                                    <option key={ub.id} value={ub.id}>
                                        {ub.nama}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Bulan */}
                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                Bulan
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                value={filters.bulan || "01"}
                                onChange={(e) =>
                                    handleFilterChange("bulan", e.target.value)
                                }
                            >
                                {months.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tahun */}
                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                Tahun
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                value={filters.tahun || currentYear.toString()}
                                onChange={(e) =>
                                    handleFilterChange("tahun", e.target.value)
                                }
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Report Cards Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* RAB vs Realisasi Card */}
                    <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                        <div className="space-y-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Laporan RAB vs Realisasi
                                </h3>
                                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                    Perbandingan anggaran Rencana Anggaran Biaya
                                    (RAB) dengan realisasi pengeluaran fisik per
                                    proyek dan per titik lokasi operasional.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-100 pt-5 flex justify-end">
                            <Link
                                href={route(
                                    "finance.laporan-keuangan.rab-realisasi",
                                    { unit_bisnis_id: filters.unit_bisnis_id },
                                )}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                Buka Laporan
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Laba Rugi Card */}
                    <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                        <div className="space-y-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Laporan Laba Rugi Unit Bisnis
                                </h3>
                                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                    Konsolidasi pendapatan dari invoice terbit
                                    dan rincian beban pengeluaran (Material,
                                    Ritase, Produksi, Gaji) per unit bisnis.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-100 pt-5 flex justify-end">
                            <Link
                                href={route(
                                    "finance.laporan-keuangan.laba-rugi",
                                    {
                                        unit_bisnis_id: filters.unit_bisnis_id,
                                        bulan: filters.bulan,
                                        tahun: filters.tahun,
                                    },
                                )}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                                Buka Laporan
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
