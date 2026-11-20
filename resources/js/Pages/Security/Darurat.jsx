import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import Pagination from "@/Components/Pagination";
import { formatTanggal } from "@/utils/date";
import {
    ShieldAlert,
    CheckCircle2,
    X,
    Filter,
    MapPin,
    User,
    Calendar,
    FileText,
    SearchX,
} from "lucide-react";

const tingkatBadge = (t) => {
    switch (t) {
        case "kritis":
        case "darurat":
            return "bg-red-100 text-red-700 border-red-200";
        case "siaga":
            return "bg-orange-100 text-orange-700 border-orange-200";
        case "tinggi":
            return "bg-amber-100 text-amber-700 border-amber-200";
        case "sedang":
            return "bg-green-100 text-green-700 border-green-200";
        case "rendah":
            return "bg-yellow-100 text-yellow-700 border-yellow-200";
        default:
            return "bg-gray-100 text-gray-700 border-gray-200";
    }
};

const statusBadge = (s) => {
    switch (s) {
        case "selesai":
            return "bg-emerald-100 text-emerald-800 border-emerald-200";
        case "ditangani":
            return "bg-blue-100 text-blue-800 border-blue-200";
        default:
            return "bg-amber-100 text-amber-800 border-amber-200";
    }
};

const getBorderColor = (t) => {
    if (["kritis", "darurat"].includes(t)) return "border-l-red-500";
    if (t === "siaga") return "border-l-orange-500";
    if (t === "tinggi") return "border-l-amber-500";
    if (t === "sedang") return "border-l-green-500";
    if (t === "rendah") return "border-l-yellow-500";
    return "border-l-gray-500";
};

// Modal Component Reusable
function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
            <div
                className={`w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all border border-gray-100`}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-emerald-600" />{" "}
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export default function Darurat({ rows, filters }) {
    console.log(rows.data);
    const { flash } = usePage().props;
    const [status, setStatus] = useState(filters?.status ?? "");
    const [selectedItem, setSelectedItem] = useState(null);
    const [form, setForm] = useState({
        status: "ditangani",
        catatan_penanganan: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitFilter = (e) => {
        e.preventDefault();
        router.get(
            route("security.darurat.index"),
            { status },
            { preserveState: true },
        );
    };

    const openTindakLanjutModal = (d) => {
        setSelectedItem(d);
        setForm({
            status: d.status === "baru" ? "ditangani" : d.status,
            catatan_penanganan: d.catatan_penanganan ?? "",
        });
    };

    const tangani = (e) => {
        e.preventDefault();
        if (!selectedItem) return;
        setIsSubmitting(true);
        router.post(route("security.darurat.tangani", selectedItem.id), form, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedItem(null);
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    const clear = () => {
        setStatus("");
        router.get(route("darurat.index"));
    };

    return (
        <Layout title="Laporan Darurat">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                            <ShieldAlert className="w-6 h-6 text-red-600" />
                            Laporan Darurat (Security)
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Pantau dan tindak lanjuti setiap sinyal serta
                            laporan keadaan darurat di area kerja.
                        </p>
                    </div>
                </div>

                {/* Flash Success Message */}
                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium flex items-center gap-2 shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        {flash.success}
                    </div>
                )}

                {/* Filter Bar */}
                <form
                    onSubmit={submitFilter}
                    className="flex items-center gap-3"
                >
                    <div className="relative w-full max-w-xs">
                        <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            className="w-full rounded-xl border border-gray-300 pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-white shadow-sm font-medium text-gray-700"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Semua status</option>
                            <option value="baru">Baru</option>
                            <option value="ditangani">Ditangani</option>
                            <option value="selesai">Selesai</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm active:scale-[0.98]"
                    >
                        Filter
                    </button>
                    {filters?.status && (
                        <button
                            onClick={clear}
                            title="Reset Filter"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                        >
                            <SearchX className="w-5 h-5" />
                        </button>
                    )}
                </form>

                {/* Cards List */}
                <div className="space-y-4">
                    {(rows?.data ?? []).map((d) => (
                        <div
                            key={d.id}
                            className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 border-l-4 ${getBorderColor(
                                d.tingkat,
                            )} transition hover:shadow-md`}
                        >
                            <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                                <div className="space-y-2.5 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-gray-900 text-base">
                                            {d.judul}
                                        </h3>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${tingkatBadge(
                                                d.tingkat,
                                            )}`}
                                        >
                                            {d.tingkat}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize border ${statusBadge(
                                                d.status,
                                            )}`}
                                        >
                                            {d.status}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {d.deskripsi}
                                    </p>

                                    {/* Metadata Info */}
                                    <div className="flex items-center gap-y-1.5 gap-x-4 text-xs text-gray-500 flex-wrap pt-1 border-t border-gray-100">
                                        <span className="inline-flex items-center gap-1 font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md">
                                            <FileText className="w-3.5 h-3.5 text-gray-400" />
                                            {d.kategori}
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                            {d.lokasi_ruangan}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                            Pelapor:{" "}
                                            <strong className="text-gray-700">
                                                {d.pelapor?.name ?? "-"}
                                            </strong>
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {formatTanggal(d.created_at)}
                                        </span>
                                    </div>

                                    {/* Catatan Penanganan */}
                                    {d.catatan_penanganan && (
                                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold">
                                                    Penanganan:{" "}
                                                </span>
                                                {d.catatan_penanganan}
                                                <span className="text-emerald-600 font-medium ml-1">
                                                    ({d.penangan?.name ?? "-"})
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                {d.status !== "selesai" && (
                                    <button
                                        onClick={() => openTindakLanjutModal(d)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-sm active:scale-[0.98] shrink-0"
                                    >
                                        <ShieldAlert className="w-4 h-4" />{" "}
                                        Tindak Lanjut
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {(rows?.data ?? []).length === 0 && (
                        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
                            <p className="text-sm text-gray-500 font-medium">
                                Tidak ada laporan darurat ditemukan.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <Pagination
                    paginator={rows}
                    onPageUrl={(url) =>
                        router.get(url, {}, { preserveState: true })
                    }
                    onPerPageChange={(n) =>
                        router.get(
                            route("security.darurat.index"),
                            { per_page: n },
                            { preserveState: true },
                        )
                    }
                />
            </div>

            {/* Modal Form Tindak Lanjut */}
            <Modal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={`Tindak Lanjut Laporan - ${selectedItem?.judul ?? ""}`}
                maxWidth="max-w-xl"
            >
                {selectedItem && (
                    <form onSubmit={tangani} className="space-y-4">
                        {/* Info Ringkas Laporan */}
                        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs space-y-1 mb-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-semibold">
                                    Pelapor:
                                </span>
                                <span className="font-bold text-gray-800">
                                    {selectedItem.pelapor?.name ?? "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-semibold">
                                    Lokasi:
                                </span>
                                <span className="font-bold text-gray-800">
                                    {selectedItem.lokasi_ruangan}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-semibold">
                                    Tingkat Darurat:
                                </span>
                                <span className="font-bold text-red-600 capitalize">
                                    {selectedItem.tingkat}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                Status Penanganan *
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-gray-50/50 focus:bg-white font-medium"
                                value={form.status}
                                onChange={(e) =>
                                    setForm({ ...form, status: e.target.value })
                                }
                            >
                                <option value="ditangani">Ditangani</option>
                                <option value="selesai">Selesai</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                Catatan Penanganan
                            </label>
                            <textarea
                                rows="3"
                                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                placeholder="Masukkan rincian penanganan atau tindakan yang telah diambil..."
                                value={form.catatan_penanganan}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        catatan_penanganan: e.target.value,
                                    })
                                }
                            />
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shadow-sm active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting
                                    ? "Menyimpan..."
                                    : "Simpan Penanganan"}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </Layout>
    );
}
