import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    FolderKanban,
    CalendarDays,
    ClipboardList,
    MapPin,
    Plus,
    Trash2,
    Edit,
    ArrowLeft,
} from "lucide-react";
import PetaTitikProyek from "@/Components/PetaTitikProyek";
import { formatTanggal } from "@/utils/date";

export default function Show({ proyek, rabRealisasi, stats }) {
    const [activeTab, setActiveTab] = useState("info");
    const [selectedTitikId, setSelectedTitikId] = useState(null);

    const getStatusBadge = (status) => {
        const colors = {
            draft: "bg-gray-200 text-gray-800",
            diajukan: "bg-yellow-200 text-yellow-800",
            menunggu_approval_finance: "bg-blue-200 text-blue-800",
            menunggu_approval_owner: "bg-purple-200 text-purple-800",
            disetujui: "bg-green-200 text-green-800",
            diterima: "bg-indigo-200 text-indigo-800",
            dibayar_sebagian: "bg-orange-200 text-orange-800",
            lunas: "bg-emerald-200 text-emerald-800",
            ditolak: "bg-red-200 text-red-800",
            aktif: "bg-green-200 text-green-800",
            selesai: "bg-blue-200 text-blue-800",
            dihentikan: "bg-red-200 text-red-800",
        };
        return colors[status] || "bg-gray-200 text-gray-800";
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const handleDelete = () => {
        if (window.confirm("Yakin hapus proyek ini?")) {
            router.delete(route("core.proyek.destroy", proyek.id));
        }
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold">{proyek.nama}</h1>
                <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(proyek.status)}`}
                >
                    {proyek.status.charAt(0).toUpperCase() +
                        proyek.status.slice(1)}
                </span>
                <div className="ml-auto flex gap-2">
                    <Link
                        href={route("core.proyek.index")}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink-secondary text-white bg-gray-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        kembali
                    </Link>
                    <Link
                        href={route("core.proyek.edit", proyek.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink-secondary text-white bg-yellow-600 transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink-secondary text-white bg-red-600 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                    </button>
                    <Link
                        href={route("core.rab.create", {
                            proyek_id: proyek.id,
                        })}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink-secondary text-white bg-blue-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah RAB
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Titik</div>
                    <div className="text-2xl font-bold">
                        {stats.total_titik}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total RAB</div>
                    <div className="text-2xl font-bold">
                        {formatCurrency(stats.total_rab)}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total PO</div>
                    <div className="text-2xl font-bold">{stats.total_po}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Nominal PO</div>
                    <div className="text-2xl font-bold">
                        {formatCurrency(stats.total_po_nominal)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab("info")}
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === "info"
                                    ? "border-b-2 border-blue-500 text-blue-600"
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Informasi
                        </button>
                        <button
                            onClick={() => setActiveTab("rab")}
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === "rab"
                                    ? "border-b-2 border-blue-500 text-blue-600"
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            RAB & Realisasi
                        </button>
                        <button
                            onClick={() => setActiveTab("titik")}
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === "titik"
                                    ? "border-b-2 border-blue-500 text-blue-600"
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Titik ({proyek.titik.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("po")}
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === "po"
                                    ? "border-b-2 border-blue-500 text-blue-600"
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Purchase Order ({proyek.purchase_orders.length})
                        </button>
                    </nav>
                </div>

                <div className="p-5 sm:p-6">
                    {/* Tab: Informasi */}
                    {activeTab === "info" && (
                        <div className="space-y-6">
                            {/* Identitas Proyek */}
                            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                        <FolderKanban className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Informasi Proyek
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Identitas dan detail proyek
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Kode Proyek
                                        </p>
                                        <p className="mt-2 break-words font-semibold text-gray-900">
                                            {proyek.kode_proyek || "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Unit Bisnis
                                        </p>
                                        <p className="mt-2 font-semibold text-gray-900">
                                            {proyek.unit_bisnis?.nama || "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Tipe Proyek
                                        </p>
                                        <p className="mt-2 font-semibold text-gray-900">
                                            {proyek.tipe_proyek === "internal"
                                                ? "Internal"
                                                : "Kontrak Klien"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Client
                                        </p>
                                        <p className="mt-2 break-words font-semibold text-gray-900">
                                            {proyek.client || "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-4 sm:col-span-2">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Lokasi Proyek
                                        </p>
                                        <p className="mt-2 break-words font-medium text-gray-900">
                                            {proyek.lokasi || "-"}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Jadwal dan Status */}
                            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                        <CalendarDays className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Jadwal dan Status
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Periode pelaksanaan proyek
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-lg border border-gray-100 p-4">
                                        <p className="text-xs font-medium text-gray-500">
                                            Tanggal Mulai
                                        </p>
                                        <p className="mt-2 font-semibold text-gray-900">
                                            {formatTanggal(
                                                proyek.tanggal_mulai,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-gray-100 p-4">
                                        <p className="text-xs font-medium text-gray-500">
                                            Selesai Rencana
                                        </p>
                                        <p className="mt-2 font-semibold text-gray-900">
                                            {proyek.tanggal_selesai_rencana
                                                ? formatTanggal(
                                                      proyek.tanggal_selesai_rencana,
                                                  )
                                                : "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-gray-100 p-4">
                                        <p className="text-xs font-medium text-gray-500">
                                            Selesai Aktual
                                        </p>
                                        <p className="mt-2 font-semibold text-gray-900">
                                            {proyek.tanggal_selesai_aktual
                                                ? formatTanggal(
                                                      proyek.tanggal_selesai_aktual,
                                                  )
                                                : "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-gray-100 p-4">
                                        <p className="text-xs font-medium text-gray-500">
                                            Status Proyek
                                        </p>
                                        <div className="mt-2">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    proyek.status === "aktif"
                                                        ? "bg-green-100 text-green-700"
                                                        : proyek.status ===
                                                            "selesai"
                                                          ? "bg-blue-100 text-blue-700"
                                                          : proyek.status ===
                                                              "dihentikan"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                {proyek.status
                                                    ? proyek.status
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                      proyek.status.slice(1)
                                                    : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Catatan */}
                            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                        <ClipboardList className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Catatan Proyek
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Keterangan tambahan
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                                        {proyek.catatan ||
                                            "Tidak ada catatan untuk proyek ini."}
                                    </p>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Tab: RAB & Realisasi */}
                    {activeTab === "rab" && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        RAB dan Realisasi
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Perbandingan anggaran rencana dengan
                                        pengeluaran aktual
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {rabRealisasi.length} kategori
                                </span>
                            </div>

                            {rabRealisasi.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
                                    <ClipboardList className="mx-auto h-10 w-10 text-gray-400" />
                                    <p className="mt-3 font-medium text-gray-900">
                                        Belum ada RAB
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Belum ada RAB untuk proyek ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[720px] text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-5 py-3 text-left font-semibold text-gray-600">
                                                        Kategori
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-semibold text-gray-600">
                                                        Rencana
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-semibold text-gray-600">
                                                        Realisasi
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-semibold text-gray-600">
                                                        Selisih
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-semibold text-gray-600">
                                                        Persentase
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {rabRealisasi.map((item) => {
                                                    const selisih =
                                                        item.rab.rencana -
                                                        item.realisasi;

                                                    const persen =
                                                        item.rab.rencana > 0
                                                            ? (item.realisasi /
                                                                  item.rab
                                                                      .rencana) *
                                                              100
                                                            : 0;

                                                    return (
                                                        <tr
                                                            key={item.rab.id}
                                                            className="transition hover:bg-gray-50"
                                                        >
                                                            <td className="px-5 py-4 font-medium text-gray-900">
                                                                {item.rab.kategori
                                                                    .replace(
                                                                        /_/g,
                                                                        " ",
                                                                    )
                                                                    .toUpperCase()}
                                                            </td>
                                                            <td className="whitespace-nowrap px-5 py-4 text-right text-gray-700">
                                                                {formatCurrency(
                                                                    item.rab
                                                                        .rencana,
                                                                )}
                                                            </td>
                                                            <td className="whitespace-nowrap px-5 py-4 text-right text-gray-700">
                                                                {formatCurrency(
                                                                    item.realisasi,
                                                                )}
                                                            </td>
                                                            <td
                                                                className={`whitespace-nowrap px-5 py-4 text-right font-medium ${
                                                                    selisih >= 0
                                                                        ? "text-green-600"
                                                                        : "text-red-600"
                                                                }`}
                                                            >
                                                                {formatCurrency(
                                                                    selisih,
                                                                )}
                                                            </td>
                                                            <td className="whitespace-nowrap px-5 py-4 text-right">
                                                                <span
                                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                        persen >
                                                                        100
                                                                            ? "bg-red-100 text-red-700"
                                                                            : "bg-blue-50 text-blue-700"
                                                                    }`}
                                                                >
                                                                    {persen.toFixed(
                                                                        1,
                                                                    )}
                                                                    %
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Titik */}
                    {activeTab === "titik" && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        Titik Proyek
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Kelola lokasi dan titik presensi proyek
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={route(
                                            "core.titik.index",
                                            proyek.id,
                                        )}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                                    >
                                        Kelola Titik
                                    </Link>

                                    <Link
                                        href={route("core.titik.create", {
                                            proyek_id: proyek.id,
                                        })}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambah Titik
                                    </Link>
                                </div>
                            </div>

                            {proyek.titik.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
                                    <MapPin className="mx-auto h-10 w-10 text-gray-400" />
                                    <p className="mt-3 font-medium text-gray-900">
                                        Belum ada titik proyek
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Tambahkan titik untuk menampilkan lokasi
                                        pada peta.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Peta */}
                                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">
                                                    Peta Sebaran Titik
                                                </h4>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Pilih penanda peta atau
                                                    kartu titik untuk melihat
                                                    lokasi
                                                </p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                {proyek.titik.length} titik
                                            </span>
                                        </div>

                                        <div className="p-3 sm:p-4">
                                            <PetaTitikProyek
                                                titiks={proyek.titik}
                                                selectedTitikId={
                                                    selectedTitikId
                                                }
                                                onMarkerClick={(id) =>
                                                    setSelectedTitikId(id)
                                                }
                                                height="360px"
                                            />
                                        </div>
                                    </section>

                                    {/* Daftar titik */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {proyek.titik.map((titik) => {
                                            const isSelected =
                                                String(titik.id) ===
                                                String(selectedTitikId);

                                            return (
                                                <button
                                                    type="button"
                                                    key={titik.id}
                                                    onClick={() =>
                                                        setSelectedTitikId(
                                                            titik.id,
                                                        )
                                                    }
                                                    aria-pressed={isSelected}
                                                    className={`w-full rounded-xl border p-5 text-left transition ${
                                                        isSelected
                                                            ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100"
                                                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 items-start gap-3">
                                                            <div
                                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                                                    isSelected
                                                                        ? "bg-blue-100 text-blue-600"
                                                                        : "bg-gray-100 text-gray-500"
                                                                }`}
                                                            >
                                                                <MapPin className="h-5 w-5" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="break-words font-semibold text-gray-900">
                                                                    {titik.nama}
                                                                </p>
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Titik
                                                                    presensi
                                                                    proyek
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span
                                                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                titik.status ===
                                                                "aktif"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-gray-100 text-gray-600"
                                                            }`}
                                                        >
                                                            {titik.status}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500">
                                                                Koordinat
                                                            </p>
                                                            <p className="mt-1 break-all font-mono text-sm text-gray-700">
                                                                {titik.latitude}
                                                                ,{" "}
                                                                {
                                                                    titik.longitude
                                                                }
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className="text-sm text-gray-500">
                                                                Radius Presensi
                                                            </span>
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {
                                                                    titik.radius_presensi_meter
                                                                }{" "}
                                                                m
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-700">
                                                            <icon
                                                                name="check-circle"
                                                                size="xs"
                                                            />
                                                            Titik dipilih pada
                                                            peta
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Tab: Purchase Order */}
                    {activeTab === "po" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Purchase Order
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Daftar pesanan pembelian untuk proyek ini
                                </p>
                            </div>

                            {proyek.purchase_orders.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
                                    <ClipboardList className="mx-auto h-10 w-10 text-gray-400" />
                                    <p className="mt-3 font-medium text-gray-900">
                                        Belum ada Purchase Order
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Purchase Order untuk proyek ini akan
                                        ditampilkan di sini.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[700px] text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-5 py-3 text-left font-semibold text-gray-600">
                                                        Kode PO
                                                    </th>
                                                    <th className="px-5 py-3 text-left font-semibold text-gray-600">
                                                        Supplier
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-semibold text-gray-600">
                                                        Total
                                                    </th>
                                                    <th Pesan className="px-5 py-3 text-left font-semibold text-gray-600">
                                                        Status
                                                    </th>
                                                    <th className="px-5 py-3 text-left font-semibold text-gray-600">
                                                        Tanggal Pesan
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {proyek.purchase_orders.map(
                                                    (po) => (
                                                        <tr
                                                            key={po.id}
                                                            className="transition hover:bg-gray-50"
                                                        >
                                                            <td className="whitespace-nowrap px-5 py-4">
                                                                <Link
                                                                    href={route(
                                                                        "procurement.purchase-orders.show",
                                                                        po.id,
                                                                    )}
                                                                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                                                >
                                                                    {po.kode_po}
                                                                </Link>
                                                            </td>

                                                            <td className="px-5 py-4 text-gray-700">
                                                                {po.supplier
                                                                    ?.nama ||
                                                                    "-"}
                                                            </td>

                                                            <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-gray-900">
                                                                {formatCurrency(
                                                                    po.total,
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <span
                                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(po.status)}`}
                                                                >
                                                                    {po.status}
                                                                </span>
                                                            </td>

                                                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                                {po.tanggal_pesan
                                                                    ? formatTanggal(
                                                                          po.tanggal_pesan,
                                                                      )
                                                                    : "-"}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
