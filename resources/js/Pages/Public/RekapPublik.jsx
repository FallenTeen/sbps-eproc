import React, { useMemo, useState } from "react";
import { Head, router, usePage, Link } from "@inertiajs/react";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Download,
    Lock,
    Unlock,
} from "lucide-react";
import ApplicationLogo from "@/Components/ApplicationLogo";

function formatCurrency(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
}

const NAMA_BULAN = [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
];

export default function RekapPublik({
    locked = false,
    rekap = null,
    unitBisnisList = [],
    filters = {},
}) {
    const errors = usePage().props.errors || {};
    const [password, setPassword] = useState("");

    const handleFilterChange = (key, value) => {
        router.get(route("rekap-publik.index"), {
            ...filters,
            [key]: value,
        }, { preserveState: true });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        router.post(route("rekap-publik.unlock"), { password }, {
            preserveScroll: true,
            onSuccess: () => setPassword(""),
        });
    };

    const lock = () => {
        router.post(route("rekap-publik.lock"), {}, { preserveState: true });
    };

    const exportHref = useMemo(() => {
        if (locked || !rekap) return "#";
        const params = new URLSearchParams(
            Object.entries(filters).filter(([, v]) => v !== "" && v != null),
        ).toString();
        return `${route("rekap-publik.export")}${params ? `?${params}` : ""}`;
    }, [locked, rekap, filters]);

    const periodeLabel = useMemo(() => {
        if (filters.bulan && filters.tahun) {
            return `${NAMA_BULAN[parseInt(filters.bulan, 10)] || filters.bulan} ${filters.tahun}`;
        }
        if (filters.tahun) return `Tahun ${filters.tahun}`;
        return "Seluruh Periode";
    }, [filters]);

    return (
        <>
            <Head title="Rekapitulasi Pemasukan & Pengeluaran" />
            <div className="min-h-screen bg-gray-100">
                {/* Header Publik */}
                <header className="bg-white border-b border-gray-200">
                    <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <ApplicationLogo className="h-10 w-10 fill-current text-red-500" />
                            <div>
                                <div className="font-black text-gray-900 leading-tight">
                                    SBPS
                                </div>
                                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                                    Rekap Keuangan
                                </div>
                            </div>
                        </Link>
                        <div className="flex items-center gap-2">
                            {rekap && (
                                <a
                                    href={exportHref}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Excel
                                </a>
                            )}
                            {rekap && (
                                <button
                                    type="button"
                                    onClick={lock}
                                    className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                                >
                                    <Lock className="w-4 h-4" />
                                    Kunci
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                    {locked ? (
                        /* ===== Gate Password ===== */
                        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                                    <Unlock className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Rekapitulasi Pemasukan &amp; Pengeluaran
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Halaman ini dilindungi password. Masukkan
                                    password untuk melihat rekap keuangan.
                                </p>
                            </div>
                            <form onSubmit={submitPassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        autoFocus
                                        className="border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Buka Rekap
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* ===== Isi Rekap ===== */
                        <>
                            <div className="text-center">
                                <h1 className="text-2xl font-black text-indigo-700">
                                    Rekapitulasi Pemasukan &amp; Pengeluaran
                                </h1>
                                <p className="text-gray-600 font-semibold mt-1">
                                    {periodeLabel}
                                </p>
                            </div>

                            {rekap && (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                                            <div className="text-sm font-medium text-green-600 mb-1 flex items-center">
                                                <ArrowDownCircle className="w-4 h-4 mr-1" />
                                                Total Pemasukan
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(
                                                    rekap.total_masuk,
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                                            <div className="text-sm font-medium text-red-600 mb-1 flex items-center">
                                                <ArrowUpCircle className="w-4 h-4 mr-1" />
                                                Total Pengeluaran
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(
                                                    rekap.total_keluar,
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
                                            <div className="text-sm font-medium text-indigo-600 mb-1">
                                                Selisih
                                            </div>
                                            <div
                                                className={`text-2xl font-bold ${
                                                    (rekap.selisih || 0) < 0
                                                        ? "text-red-600"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                {formatCurrency(rekap.selisih)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filter */}
                                    <div className="bg-white p-5 rounded-lg shadow-sm flex flex-wrap items-end gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                Unit Bisnis
                                            </label>
                                            <select
                                                className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                value={
                                                    filters.unit_bisnis_id || ""
                                                }
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        "unit_bisnis_id",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Semua Unit Bisnis
                                                </option>
                                                {unitBisnisList.map((ub) => (
                                                    <option
                                                        key={ub.id}
                                                        value={ub.id}
                                                    >
                                                        {ub.nama}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                Bulan
                                            </label>
                                            <select
                                                className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                value={filters.bulan || ""}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        "bulan",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Semua Bulan
                                                </option>
                                                {NAMA_BULAN.map((n, i) =>
                                                    i > 0 ? (
                                                        <option
                                                            key={i}
                                                            value={String(
                                                                i,
                                                            ).padStart(2, "0")}
                                                        >
                                                            {n}
                                                        </option>
                                                    ) : null,
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                Tahun
                                            </label>
                                            <input
                                                type="number"
                                                min="2000"
                                                max="2100"
                                                placeholder="Semua"
                                                className="border-gray-300 rounded-md text-sm w-28 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={filters.tahun || ""}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        "tahun",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Ringkasan Bulanan */}
                                    {rekap.per_bulan.length > 0 && (
                                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                            <h2 className="font-semibold text-gray-800 mb-3">
                                                Ringkasan Bulanan
                                            </h2>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Periode
                                                            </th>
                                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Pemasukan
                                                            </th>
                                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Pengeluaran
                                                            </th>
                                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Selisih
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {rekap.per_bulan.map(
                                                            (b) => {
                                                                const [
                                                                    y,
                                                                    m,
                                                                ] = b.periode.split(
                                                                    "-",
                                                                );
                                                                return (
                                                                    <tr
                                                                        key={
                                                                            b.periode
                                                                        }
                                                                    >
                                                                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                                                            {
                                                                                NAMA_BULAN[
                                                                                    parseInt(
                                                                                        m,
                                                                                        10,
                                                                                    )
                                                                                ]
                                                                            }{" "}
                                                                            {
                                                                                y
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                                                                            {formatCurrency(
                                                                                b.pemasukan,
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                                                                            {formatCurrency(
                                                                                b.pengeluaran,
                                                                            )}
                                                                        </td>
                                                                        <td
                                                                            className={`px-4 py-3 text-sm text-right font-bold ${
                                                                                b.saldo <
                                                                                0
                                                                                    ? "text-red-600"
                                                                                    : "text-gray-900"
                                                                            }`}
                                                                        >
                                                                            {formatCurrency(
                                                                                b.saldo,
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            },
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Detail Transaksi */}
                                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                        <h2 className="font-semibold text-gray-800 mb-3">
                                            Detail Transaksi
                                        </h2>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                                            No
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Tanggal
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Unit Bisnis
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Kategori
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Jenis
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Jumlah
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Catatan
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {rekap.transaksi.length ===
                                                    0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan="7"
                                                                className="px-6 py-8 text-center text-gray-500"
                                                            >
                                                                Tidak ada
                                                                transaksi untuk
                                                                filter saat
                                                                ini.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        rekap.transaksi.map(
                                                            (row, idx) => (
                                                                <tr
                                                                    key={
                                                                        row.id
                                                                    }
                                                                    className="hover:bg-gray-50"
                                                                >
                                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                                        {idx +
                                                                            1}
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                                        {
                                                                            row.tanggal
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                                        {
                                                                            row.unit_bisnis
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                                        {
                                                                            row.kategori
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span
                                                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                                                row.tipe ===
                                                                                "masuk"
                                                                                    ? "bg-green-100 text-green-800"
                                                                                    : "bg-red-100 text-red-800"
                                                                            }`}
                                                                        >
                                                                            {row.tipe ===
                                                                            "masuk"
                                                                                ? "Pemasukan"
                                                                                : "Pengeluaran"}
                                                                        </span>
                                                                    </td>
                                                                    <td
                                                                        className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-right ${
                                                                            row.tipe ===
                                                                            "masuk"
                                                                                ? "text-green-600"
                                                                                : "text-red-600"
                                                                        }`}
                                                                    >
                                                                        {formatCurrency(
                                                                            row.jumlah,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                                                        {row.catatan ||
                                                                            "-"}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </main>

                <footer className="py-6 text-center text-xs text-gray-400">
                    PT Satria Buana Pamula Sakti - Rekapitulasi Keuangan
                </footer>
            </div>
        </>
    );
}
