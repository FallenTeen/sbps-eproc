import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    Save,
    Plus,
    X,
    Trash2,
    CheckCircle2,
    Clock,
    ShieldCheck,
    ListChecks,
    Calendar,
    ArrowLeft,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

const emptyForm = {
    nama: "",
    periode: "harian",
    jam_mulai: "",
    jam_selesai: "",
    aktif: true,
    itemsText: "",
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
                        <ListChecks className="w-5 h-5 text-blue-600" /> {title}
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

export default function ChecklistTemplates({ templates = [], runs = [] }) {
    const { flash } = usePage().props;
    const [form, setForm] = useState(emptyForm);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const items = form.itemsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((teks) => ({ teks }));

        router.post(
            route("security.checklist-template.store"),
            {
                nama: form.nama,
                periode: form.periode,
                jam_mulai: form.jam_mulai || null,
                jam_selesai: form.jam_selesai || null,
                aktif: form.aktif,
                items,
            },
            {
                onSuccess: () => {
                    setForm(emptyForm);
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false),
            },
        );
    };

    const hapus = (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus template ini?")) {
            router.delete(route("security.checklist-template.destroy", id));
        }
    };

    const toggleAktif = (t) => {
        router.put(
            route("security.checklist-template.update", t.id),
            {
                nama: t.nama,
                periode: t.periode,
                jam_mulai: t.jam_mulai,
                jam_selesai: t.jam_selesai,
                aktif: !t.aktif,
                items: (t.items ?? []).map((i) => ({ teks: i.teks })),
            },
            { preserveScroll: true },
        );
    };

    const getPeriodeBadge = (periode) => {
        switch (periode) {
            case "harian":
            case "custom":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "malam":
                return "bg-purple-100 text-purple-700 border-purple-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <Layout title="Checklist Kantor">
            <div className="space-y-6">
                {/* Header Page */}
                <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-blue-600" />
                            Template Checklist Security
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Kelola template checklist dan pantau hasil inspeksi
                            area kantor dari tim security.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" /> Tambah Template
                    </button>
                </div>

                {/* Flash Message */}
                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium flex items-center gap-2 shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        {flash.success}
                    </div>
                )}

                {/* Modal Form Tambah Template */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Tambah Template Checklist"
                    maxWidth="max-w-2xl"
                >
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Nama Template{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Checklist Patroli Malam Pos Utama"
                                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                    value={form.nama}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            nama: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Periode
                                </label>
                                <select
                                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                    value={form.periode}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            periode: e.target.value,
                                        })
                                    }
                                >
                                    <option value="harian">Harian</option>
                                    <option value="malam">Malam</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Jam Mulai
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                        value={form.jam_mulai}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                jam_mulai: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Jam Selesai
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                        value={form.jam_selesai}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                jam_selesai: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Item Checklist (Satu per Baris)
                                </label>
                                <textarea
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none bg-gray-50/50 focus:bg-white"
                                    value={form.itemsText}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            itemsText: e.target.value,
                                        })
                                    }
                                    placeholder={
                                        "Pintu utama terkunci\nCCTV berfungsi normal\nLampu koridor menyala"
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                    checked={form.aktif}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            aktif: e.target.checked,
                                        })
                                    }
                                />
                                Status Aktif
                            </label>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>

                {/* Grid Template Cards */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-gray-600" /> Daftar
                        Template Active
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((t) => (
                            <div
                                key={t.id}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 flex flex-col justify-between transition hover:shadow-md"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-base capitalize">
                                                {t.nama}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${getPeriodeBadge(
                                                        t.periode,
                                                    )}`}
                                                >
                                                    {t.periode}
                                                </span>

                                                {t.jam_mulai && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                        <Clock className="w-3 h-3 text-amber-400" />
                                                        {t.jam_mulai} –{" "}
                                                        {t.jam_selesai ?? "?"}
                                                    </span>
                                                )}

                                                {!t.aktif && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => toggleAktif(t)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                                    t.aktif
                                                        ? "border-red-200 text-red-700 hover:bg-red-100"
                                                        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                                }`}
                                            >
                                                {t.aktif
                                                    ? "Nonaktifkan"
                                                    : "Aktifkan"}
                                            </button>
                                            <button
                                                onClick={() => hapus(t.id)}
                                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                                                title="Hapus Template"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Item List */}
                                    <div className="border-t border-gray-100 pt-3 mt-3">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            Item Pengecekan (
                                            {t.items?.length ?? 0}):
                                        </p>
                                        <ul className="space-y-1.5 text-xs text-gray-600">
                                            {(t.items ?? []).map((i) => (
                                                <li
                                                    key={i.id}
                                                    className="flex items-start gap-2"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                                                    <span>{i.teks}</span>
                                                </li>
                                            ))}
                                            {(t.items ?? []).length === 0 && (
                                                <li className="text-gray-400 italic">
                                                    Belum ada item ditambahkan.
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {templates.length === 0 && (
                            <div className="md:col-span-2 bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
                                <p className="text-sm text-gray-500 font-medium">
                                    Belum ada template checklist yang dibuat.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Run Terbaru Mobile */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-600" /> Run
                            Terbaru (Mobile App)
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50/70 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-5 py-3.5">Tanggal</th>
                                    <th className="px-5 py-3.5">Periode</th>
                                    <th className="px-5 py-3.5">
                                        Petugas Security
                                    </th>
                                    <th className="px-5 py-3.5 text-right">
                                        Jumlah Item
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {runs.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="hover:bg-gray-50/50 transition"
                                    >
                                        <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                                            {formatTanggal(r.tanggal)}
                                        </td>
                                        <td className="px-5 py-3.5 capitalize font-semibold text-gray-700">
                                            {r.periode}
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-700">
                                            {r.security?.name ?? "-"}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                                            {Array.isArray(r.items)
                                                ? r.items.length
                                                : 0}{" "}
                                            Item
                                        </td>
                                    </tr>
                                ))}
                                {runs.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-8 text-center text-gray-500 font-medium"
                                        >
                                            Belum ada data run checklist dari
                                            mobile.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
