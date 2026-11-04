import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    Download,
    ExternalLink,
    Eye,
    EyeOff,
    Lock,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

const emptyForm = {
    id: null,
    akun_kas_bank_id: "",
    kategori: "",
    jumlah: "",
    tanggal: new Date().toISOString().slice(0, 10),
    catatan: "",
};

const PERIODE_LABEL = {
    semua: "Seluruh Periode",
    hari_ini: "Hari Ini",
    "7_hari": "7 Hari Terakhir",
    minggu_ini: "Minggu Ini",
    bulan_ini: "Bulan Ini",
    bulan_lalu: "Bulan Lalu",
    kuartal: "Kuartal Ini",
    tahun_ini: "Tahun Ini",
    kustom: "Rentang Kustom",
};

function formatCurrency(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
}

export default function Index({
    transaksi = [],
    summary = {},
    unitBisnisList = [],
    akunKasList = [],
    kategoriList = [],
    filters = {},
    periode_preset = [],
    periode_label = "",
    publik = {},
}) {
    const { flash, auth } = usePage().props;
    const canChangePassword = (auth?.permissions || []).includes(
        "manage rekap pengeluaran",
    );

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleFilterChange = (key, value) => {
        router.get(
            route("finance.rekap-pengeluaran.index"),
            { ...filters, [key]: value },
            { preserveState: true },
        );
    };

    const openCreate = () => {
        setForm({ ...emptyForm, tanggal: new Date().toISOString().slice(0, 10) });
        setErrors({});
        setModalOpen(true);
    };

    const openEdit = (row) => {
        setForm({
            id: row.id,
            akun_kas_bank_id: row.akun_kas_bank_id || "",
            kategori: row.kategori,
            jumlah: row.jumlah,
            tanggal: row.tanggal,
            catatan: row.catatan || "",
        });
        setErrors({});
        setModalOpen(true);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (form.id) {
            router.post(
                route("finance.rekap-pengeluaran.update", form.id),
                { ...form, _method: "PUT" },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setModalOpen(false);
                        setErrors({});
                    },
                    onError: (err) => setErrors(err),
                },
            );
        } else {
            router.post(route("finance.rekap-pengeluaran.store"), form, {
                preserveScroll: true,
                onSuccess: () => {
                    setModalOpen(false);
                    setErrors({});
                },
                onError: (err) => setErrors(err),
            });
        }
    };

    const deleteRow = (row) => {
        if (!confirm("Hapus pengeluaran ini?")) return;
        router.delete(route("finance.rekap-pengeluaran.destroy", row.id), {
            preserveScroll: true,
        });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        router.post(
            route("finance.rekap-pengeluaran.password"),
            { password, _method: "PUT" },
            {
                preserveScroll: true,
                onSuccess: () => setPassword(""),
                onError: (err) => setErrors((prev) => ({ ...prev, ...err })),
            },
        );
    };

    const exportHref = useMemo(() => {
        const params = new URLSearchParams(
            Object.entries(filters).filter(([, v]) => v !== "" && v != null),
        ).toString();
        return `${route("finance.rekap-pengeluaran.export")}${
            params ? `?${params}` : ""
        }`;
    }, [filters]);

    const isKustom = filters.periode === "kustom";

    return (
        <AuthenticatedLayout>
            <Head title="Rekap Pengeluaran" />
            <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Rekapitulasi Pengeluaran
                </h2>
                <div className="flex items-center gap-2">
                    <a
                        href={exportHref}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </a>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Pengeluaran
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">
                {flash?.success && (
                    <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <p className="text-sm text-gray-600">
                        Periode:{" "}
                        <strong className="text-gray-900">
                            {periode_label || "Seluruh Periode"}
                        </strong>
                        <span className="text-gray-400">
                            {" "}
                            ({PERIODE_LABEL[filters.periode] || filters.periode})
                        </span>
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Periode
                            </label>
                            <select
                                className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                value={filters.periode || "semua"}
                                onChange={(e) =>
                                    handleFilterChange("periode", e.target.value)
                                }
                            >
                                {periode_preset.map((p) => (
                                    <option key={p} value={p}>
                                        {PERIODE_LABEL[p] || p}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {isKustom && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Dari Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={filters.tanggal_mulai || ""}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "tanggal_mulai",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Sampai Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={filters.tanggal_sampai || ""}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "tanggal_sampai",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Unit Bisnis
                            </label>
                            <select
                                className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Kategori
                            </label>
                            <select
                                className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                value={filters.kategori || ""}
                                onChange={(e) =>
                                    handleFilterChange("kategori", e.target.value)
                                }
                            >
                                <option value="">Semua Kategori</option>
                                {kategoriList.map((k) => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Akun Kas
                            </label>
                            <select
                                className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                value={filters.akun_kas_id || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "akun_kas_id",
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">Semua Akun Kas</option>
                                {akunKasList.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.nama}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabel Pengeluaran */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
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
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jumlah
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Catatan
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transaksi.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-8 text-center text-gray-500"
                                        >
                                            Tidak ada pengeluaran untuk filter
                                            saat ini.
                                        </td>
                                    </tr>
                                ) : (
                                    transaksi.map((row, idx) => (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {formatTanggal(row.tanggal, {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {row.unit_bisnis}
                                                <span className="block text-xs text-gray-400">
                                                    {row.akun_kas}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                {row.kategori}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-right text-red-600">
                                                {"-\u00a0"}
                                                {formatCurrency(row.jumlah)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                                {row.catatan || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-medium whitespace-nowrap">
                                                {row.is_manual && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(row)
                                                            }
                                                            className="text-blue-600 hover:text-blue-800 mr-2"
                                                        >
                                                            <Pencil className="w-4 h-4 inline" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteRow(row)
                                                            }
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="w-4 h-4 inline" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Halaman Publik & Password (dipindah dari Rekap Kas - TD-D4) */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Akses Publik
                    </h3>
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center gap-1">
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                <a
                                    href={publik.url || "/rekap-pengeluaran-publik"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 hover:underline"
                                >
                                    {publik.url || "/rekap-pengeluaran-publik"}
                                </a>
                            </p>
                            <p className="flex flex-wrap items-center gap-2">
                                Password:{" "}
                                {publik.requires_password ? (
                                    <span className="inline-flex items-center gap-2">
                                        {publik.revealable ? (
                                            <span className="font-mono text-base tracking-widest">
                                                {showPassword
                                                    ? publik.password || ""
                                                    : "\u2022".repeat(
                                                          Math.max(
                                                              publik.password_length ||
                                                                  6,
                                                              0,
                                                          ),
                                                      )}
                                            </span>
                                        ) : (
                                            <span className="font-mono text-base tracking-widest">
                                                {"\u2022".repeat(6)}
                                                <span className="ml-2 font-sans text-xs text-amber-600">
                                                    (password lama tidak bisa
                                                    ditampilkan, silakan ganti)
                                                </span>
                                            </span>
                                        )}
                                        {publik.revealable && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword((s) => !s)
                                                }
                                                className="text-gray-500 hover:text-gray-800"
                                                title={
                                                    showPassword
                                                        ? "Sembunyikan password"
                                                        : "Tampilkan password"
                                                }
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </span>
                                ) : (
                                    <strong className="font-sans">
                                        belum diatur password
                                    </strong>
                                )}
                            </p>
                        </div>
                        {canChangePassword && (
                            <form
                                onSubmit={submitPassword}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    required
                                    minLength={6}
                                    placeholder="Password publik baru (min 6 karakter)"
                                    className="border-gray-300 rounded-md text-sm w-72 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                                >
                                    Ganti Password
                                </button>
                            </form>
                        )}
                    </div>
                    {errors.password && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.password}
                        </p>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="font-semibold text-gray-800">
                                {form.id
                                    ? "Edit Pengeluaran"
                                    : "Tambah Pengeluaran"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitForm} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Tanggal *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        className="border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        value={form.tanggal}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                tanggal: e.target.value,
                                            })
                                        }
                                    />
                                    {errors.tanggal && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors.tanggal}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Akun Kas/Bank *
                                    </label>
                                    <select
                                        required
                                        className="border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        value={form.akun_kas_bank_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                akun_kas_bank_id:
                                                    e.target.value,
                                            })
                                        }
                                    >
                                        <option value="">Pilih akun...</option>
                                        {akunKasList.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.nama}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.akun_kas_bank_id && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors.akun_kas_bank_id}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Kategori *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={255}
                                        placeholder="mis. Pembayaran Material, Operasional"
                                        className="border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        value={form.kategori}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                kategori: e.target.value,
                                            })
                                        }
                                    />
                                    {errors.kategori && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors.kategori}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Jumlah (Rp) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        className="border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        value={form.jumlah}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                jumlah: e.target.value,
                                            })
                                        }
                                    />
                                    {errors.jumlah && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors.jumlah}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Catatan
                                </label>
                                <textarea
                                    rows={2}
                                    maxLength={500}
                                    className="border-gray-300 rounded-md text-sm w-full focus:ring-indigo-500 focus:border-indigo-500"
                                    value={form.catatan}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            catatan: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <p className="text-xs text-gray-400">
                                Pengeluaran ini ditulis ke buku kas & akan
                                memengaruhi saldo modul Kas & Bank.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
