import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import Pagination from "@/Components/Pagination";
import { formatTanggal } from "@/utils/date";
import {
    Search,
    X,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Scale,
    SearchX,
    ArrowLeft,
    Save,
} from "lucide-react";

const statusBadge = (status) =>
    status === "terverifikasi" ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Menunggu
        </span>
    );

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
                        <Scale className="w-5 h-5 text-emerald-600" /> {title}
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

export default function RitaseVerifikasi({ rows, filters }) {
    const { flash } = usePage().props;
    const [cari, setCari] = useState(filters?.cari ?? "");
    const [selectedItem, setSelectedItem] = useState(null);
    const [form, setForm] = useState({
        jumlah_verifikasi: "",
        berat_kosong_kg: "",
        berat_isi_kg: "",
        berat_netto_kg: "",
        tara_sumber: "master",
        nomor_tiket: "",
        catatan: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitFilter = (e) => {
        e.preventDefault();
        router.get(
            route("logistik.ritase-verifikasi.index"),
            { cari },
            { preserveState: true },
        );
    };

    const openVerifikasiModal = (r) => {
        setSelectedItem(r);
        const beratKosong =
            r.timbang?.berat_kosong_kg ?? r.armada?.tara_master_kg ?? "";
        const beratIsi = r.timbang?.berat_isi_kg ?? "";
        const beratNetto =
            r.timbang?.berat_netto_kg ??
            (beratIsi && beratKosong
                ? parseFloat(beratIsi) - parseFloat(beratKosong)
                : "");

        setForm({
            jumlah_verifikasi:
                r.verifikasi_logistik?.jumlah_verifikasi ??
                r.muatan?.jumlah_driver ??
                r.jumlah_rit ??
                "",
            berat_kosong_kg: beratKosong,
            berat_isi_kg: beratIsi,
            berat_netto_kg: beratNetto,
            tara_sumber: "master",
            nomor_tiket: r.timbang?.nomor_tiket ?? "",
            catatan: "",
        });
    };

    const handleBeratChange = (field, value) => {
        const nextForm = { ...form, [field]: value };

        // Kalkulasi otomatis Netto jika Berat Isi dan Kosong terisi
        if (field === "berat_isi_kg" || field === "berat_kosong_kg") {
            const isi = parseFloat(
                field === "berat_isi_kg" ? value : nextForm.berat_isi_kg,
            );
            const kosong = parseFloat(
                field === "berat_kosong_kg" ? value : nextForm.berat_kosong_kg,
            );
            if (!isNaN(isi) && !isNaN(kosong)) {
                nextForm.berat_netto_kg = (isi - kosong).toFixed(2);
            }
        }

        setForm(nextForm);
    };

    const submitVerifikasi = (e) => {
        e.preventDefault();
        if (!selectedItem) return;
        setIsSubmitting(true);
        router.post(
            route("logistik.ritase-verifikasi.verifikasi", selectedItem.id),
            form,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedItem(null);
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false),
            },
        );
    };

    const clear = () => {
        setCari("");
        router.get(route("logistik.ritase-verifikasi.index"));
    };

    return (
        <Layout title="Antrean Verifikasi Ritase">
            <div className="space-y-6">
                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium flex items-center gap-2 shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        {flash.success}
                    </div>
                )}

                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                Antrean Verifikasi Ritase (Logistik)
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Verifikasi data ritase muatan dan penimbangan
                                armada logistik.
                            </p>
                        </div>
                    </div>
                    {/* Filter Form */}
                    <form
                        onSubmit={submitFilter}
                        className="flex w-full items-center gap-3 md:w-auto"
                    >
                        <div className="relative w-full max-w-sm">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                className="w-full rounded-xl border border-gray-300 pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-white shadow-sm"
                                placeholder="Cari plat / kategori / material..."
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                            />
                        </div>
                        <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm active:scale-[0.98]">
                            Cari
                        </button>
                        {filters?.cari && (
                            <button
                                onClick={clear}
                                title="Reset Filter"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                            >
                                <SearchX className="w-5 h-5" />
                            </button>
                        )}
                    </form>
                </div>
                {/* Table Data */}
                <div className="overflow-x-auto rounded-2xl bg-white shadow-sm border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50/70 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-5 py-3.5">Tanggal</th>
                                <th className="px-5 py-3.5">Armada</th>
                                <th className="px-5 py-3.5">Driver</th>
                                <th className="px-5 py-3.5">Muatan (Driver)</th>
                                <th className="px-5 py-3.5">Wajib Timbang</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(rows?.data ?? []).map((r) => (
                                <tr
                                    key={r.id}
                                    className="hover:bg-gray-50/60 transition"
                                >
                                    <td className="px-5 py-4 whitespace-nowrap text-gray-900 font-medium">
                                        {formatTanggal(r.tanggal) ?? "-"}
                                    </td>
                                    <td className="px-5 py-4 font-bold text-gray-900">
                                        {r.armada?.plat_nomor ?? "-"}
                                    </td>
                                    <td className="px-5 py-4 text-gray-700">
                                        {r.driver?.nama ?? "-"}
                                    </td>
                                    <td className="px-5 py-4 text-gray-800 font-medium">
                                        {r.muatan?.jumlah_driver ??
                                            r.jumlah_rit}{" "}
                                        {r.muatan?.satuan ??
                                            r.satuan_volume ??
                                            ""}
                                        {r.ada_selisih && (
                                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                                                <AlertTriangle className="w-3 h-3" />{" "}
                                                Selisih
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 font-medium">
                                        {r.wajib_jembatan_timbang ? (
                                            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                                Ya
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">
                                                Tidak
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        {statusBadge(
                                            r.verifikasi_logistik?.status ??
                                                "menunggu",
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() =>
                                                openVerifikasiModal(r)
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-sm active:scale-[0.98]"
                                        >
                                            <Scale className="w-3.5 h-3.5" />{" "}
                                            Verifikasi
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(rows?.data ?? []).length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-12 text-center text-gray-500 font-medium"
                                    >
                                        Tidak ada antrean verifikasi ritase.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    paginator={rows}
                    onPageUrl={(url) =>
                        router.get(url, {}, { preserveState: true })
                    }
                    onPerPageChange={(n) =>
                        router.get(
                            route("logistik.ritase-verifikasi.index"),
                            { per_page: n },
                            { preserveState: true },
                        )
                    }
                />
            </div>

            {/* Modal Form Verifikasi */}
            <Modal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={`Verifikasi Ritase - ${selectedItem?.armada?.plat_nomor ?? ""}`}
                maxWidth="max-w-2xl"
            >
                {selectedItem && (
                    <form onSubmit={submitVerifikasi} className="space-y-4">
                        {/* Info Ringkas Unit */}
                        <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs mb-2">
                            <div>
                                <span className="text-gray-400 block font-semibold">
                                    Driver
                                </span>
                                <span className="font-bold text-gray-800">
                                    {selectedItem.driver?.nama ?? "-"}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 block font-semibold">
                                    Tanggal
                                </span>
                                <span className="font-bold text-gray-800">
                                    {formatTanggal(selectedItem.tanggal) ?? "-"}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 block font-semibold">
                                    Muatan Driver
                                </span>
                                <span className="font-bold text-gray-800">
                                    {selectedItem.muatan?.jumlah_driver ??
                                        selectedItem.jumlah_rit}{" "}
                                    {selectedItem.muatan?.satuan ??
                                        selectedItem.satuan_volume ??
                                        ""}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Jumlah Verifikasi{" "}
                                    <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                    value={form.jumlah_verifikasi}
                                    onChange={(e) =>
                                        handleBeratChange(
                                            "jumlah_verifikasi",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    No. Tiket Timbang
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                    value={form.nomor_tiket}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            nomor_tiket: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Berat Kosong / Tara (kg){" "}
                                    <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                    value={form.berat_kosong_kg}
                                    onChange={(e) =>
                                        handleBeratChange(
                                            "berat_kosong_kg",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Berat Isi / Bruto (kg){" "}
                                    <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                    value={form.berat_isi_kg}
                                    onChange={(e) =>
                                        handleBeratChange(
                                            "berat_isi_kg",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Berat Netto (kg){" "}
                                    <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-emerald-50/30 focus:bg-white font-semibold text-emerald-900"
                                    value={form.berat_netto_kg}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            berat_netto_kg: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Tara Sumber
                                </label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                    value={form.tara_sumber}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            tara_sumber: e.target.value,
                                        })
                                    }
                                >
                                    <option value="master">
                                        Master (Standard)
                                    </option>
                                    <option value="timbang_ulang">
                                        Timbang Ulang
                                    </option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Catatan
                                </label>
                                <textarea
                                    rows="2"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                    value={form.catatan}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            catatan: e.target.value,
                                        })
                                    }
                                    placeholder="Catatan verifikasi logistik..."
                                />
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl items-center gap-2 flex bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm active:scale-[0.98] disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </Layout>
    );
}
