import React, { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/DataTable";
import {
    SearchX,
    CalendarClock,
    X,
    Save,
    ArrowLeft,
    BellRing,
    Eye,
    Search,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ExternalLink,
    Filter,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

const JENIS_LABEL = {
    pajak_tahunan: "Pajak Tahunan",
    stnk_5_tahunan: "STNK 5 Tahunan",
    kir: "KIR",
};

const STATUS_META = {
    lewat: {
        label: "Lewat Jatuh Tempo",
        cls: "bg-red-50 text-red-700 border border-red-200",
        icon: AlertTriangle,
    },
    akan_jatuh_tempo: {
        label: "Akan Jatuh Tempo",
        cls: "bg-amber-50 text-amber-700 border border-amber-200",
        icon: Clock,
    },
    aktif: {
        label: "Aktif",
        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        icon: CheckCircle2,
    },
};

const rupiah = (n) => Number(n || 0).toLocaleString("id-ID");

export default function DokumenBerkala({ items, filters, counts, canManage, sort, direction }) {
    const [selected, setSelected] = useState([]);
    const [reminderInput, setReminderInput] = useState("30,14,7");
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [form, setForm] = useState({});
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const allIds = useMemo(() => items.data.map((it) => it.id), [items.data]);
    const allChecked = allIds.length > 0 && selected.length === allIds.length;

    const toggleAll = () => {
        setSelected(allChecked ? [] : allIds);
    };

    const toggle = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const submitBulkReminder = () => {
        const hari = reminderInput
            .split(",")
            .map((v) => parseInt(v.trim(), 10))
            .filter((v) => Number.isInteger(v) && v > 0);
        if (!hari.length) {
            setErrors({
                reminder_hari_sebelum: "Isi minimal satu angka hari.",
            });
            return;
        }
        setErrors({});
        router.post(
            route("fleet.dokumen-berkala.bulk-reminder"),
            { ids: selected, reminder_hari_sebelum: hari },
            {
                preserveScroll: true,
                onError: (err) => setErrors(err),
                onSuccess: () => setSelected([]),
            },
        );
    };

    const startPerpanjang = (it) => {
        setEditing(it);
        setForm({
            tanggal_jatuh_tempo_baru: "",
            nominal_biaya: it.nominal_biaya || "",
            nomor_dokumen_baru: it.nomor_dokumen || "",
            catatan: "",
        });
        setErrors({});
    };

    const submitPerpanjang = (e) => {
        e.preventDefault();
        if (!editing) return;
        setProcessing(true);
        setErrors({});
        router.post(
            route("fleet.armada.dokumen-berkala.perpanjang", {
                armada: editing.armada_id,
                dokumen: editing.id,
            }),
            form,
            {
                preserveScroll: true,
                onError: (err) => setErrors(err),
                onSuccess: () => setEditing(null),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const checkboxHeader = canManage ? (
        <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
    ) : null;

    const checkboxCell = canManage ? (
        <input
            type="checkbox"
            checked={selected.includes("__placeholder__")}
            onChange={() => {}}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
    ) : null;

    const columns = [
        ...(canManage
            ? [
                {
                    key: "select",
                    label: "",
                    search: false,
                    sortable: false,
                    renderHeader: () => checkboxHeader,
                    render: (it) => (
                        <input
                            type="checkbox"
                            checked={selected.includes(it.id)}
                            onChange={() => toggle(it.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    ),
                },
            ]
            : []),
        {
            key: "armada",
            label: "Armada / Unit",
            type: "text",
            sortable: true,
            render: (it) => (
                <div>
                    <div className="font-bold text-gray-900 text-sm">
                        {it.armada?.plat_nomor || "-"}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                        {it.armada?.kode_unit || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "jenis",
            label: "Jenis Dokumen",
            type: "select",
            options: Object.entries(JENIS_LABEL).map(([value, label]) => ({ value, label })),
            sortable: true,
            render: (it) => JENIS_LABEL[it.jenis] || it.jenis,
        },
        { key: "nomor_dokumen", label: "Nomor Dokumen", type: "text", sortable: true },
        { key: "tanggal_jatuh_tempo", label: "Jatuh Tempo", type: "date", sortable: true, render: (it) => formatTanggal(it.tanggal_jatuh_tempo) },
        {
            key: "reminder_hari_sebelum",
            label: "Reminder (H-Hari)",
            type: "text",
            sortable: true,
            render: (it) =>
                (it.reminder_hari_sebelum || []).length > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 font-mono">
                        {it.reminder_hari_sebelum.join(", ")} hr
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
        },
        {
            key: "status_dokumen",
            label: "Status",
            type: "select",
            options: Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
            sortable: true,
            render: (it) => {
                const meta = STATUS_META[it.status_dokumen] || STATUS_META.aktif;
                const StatusIcon = meta.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {meta.label}
                    </span>
                );
            },
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 text-right text-sm",
            render: (it) => (
                <div className="inline-flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setViewing(it)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Detail
                    </button>
                    {canManage && (
                        <button
                            onClick={() => startPerpanjang(it)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-900 hover:bg-black text-white rounded-lg shadow-sm transition"
                        >
                            Perpanjang
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dokumen Armada" />

            {/* Header Page */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Dokumen Armada
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Pantau kelengkapan Pajak, STNK, dan KIR seluruh armada.
                        Kelola pengingat dan perpanjangan dokumen secara
                        terpusat.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                    {
                        key: "lewat",
                        label: "Lewat Jatuh Tempo",
                        badgeCls: "bg-red-50 text-red-700",
                        borderCls: "border-l-4 border-l-red-500",
                        icon: AlertTriangle,
                    },
                    {
                        key: "akan_jatuh_tempo",
                        label: "Akan Jatuh Tempo (30 hari)",
                        badgeCls: "bg-amber-50 text-amber-700",
                        borderCls: "border-l-4 border-l-amber-500",
                        icon: Clock,
                    },
                    {
                        key: "aktif",
                        label: "Aktif / Valid",
                        badgeCls: "bg-emerald-50 text-emerald-700",
                        borderCls: "border-l-4 border-l-emerald-500",
                        icon: CheckCircle2,
                    },
                ].map((c) => {
                    const IconComponent = c.icon;
                    return (
                        <div
                            key={c.key}
                            className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between ${c.borderCls}`}
                        >
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    {c.label}
                                </p>
                                <p className="mt-1 text-3xl font-extrabold text-gray-900">
                                    {counts?.[c.key] ?? 0}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${c.badgeCls}`}>
                                <IconComponent className="w-6 h-6" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bulk Actions Panel */}
            {canManage && (
                <div
                    className={`border border-gray-200 rounded-xl p-4 mb-6 transition-all ${selected.length ? "ring-2 ring-blue-400" : ""}`}
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                            <BellRing className="w-4 h-4 text-blue-600" />
                            <span>
                                <strong className="font-bold text-blue-700">
                                    {selected.length}
                                </strong>{" "}
                                dokumen terpilih untuk pengingat massal
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <input
                                    type="text"
                                    value={reminderInput}
                                    onChange={(e) => setReminderInput(e.target.value)}
                                    placeholder="Hari (misal: 30,14,7)"
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-44 focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div>
                            <button
                                onClick={submitBulkReminder}
                                disabled={!selected.length}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
                            >
                                <Save className="w-4 h-4" /> Set Pengingat
                            </button>
                        </div>
                    </div>
                    {errors.reminder_hari_sebelum && (
                        <p className="mt-2 text-xs text-red-600 font-medium">
                            {errors.reminder_hari_sebelum}
                        </p>
                    )}
                </div>
            )}

            {/* Data Table */}
            <DataTable
                routeName="fleet.dokumen-berkala.index"
                columns={columns}
                rows={items}
                filters={filters}
                sort={sort}
                direction={direction}
            />

            {/* Modal Detail Dokumen */}
            {viewing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dokumen-detail-title"
                        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-gray-100"
                    >
                        <div className="mb-5 flex items-start justify-between pb-4 border-b border-gray-100">
                            <div>
                                <h2
                                    id="dokumen-detail-title"
                                    className="text-lg font-bold text-gray-900"
                                >
                                    Detail Dokumen Armada
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    <span className="font-semibold text-gray-700">
                                        {viewing.armada?.plat_nomor || "-"}
                                    </span>{" "}
                                    ·{" "}
                                    {JENIS_LABEL[viewing.jenis] || viewing.jenis}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewing(null)}
                                aria-label="Tutup detail dokumen"
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <dt className="text-xs text-gray-500">Nomor Dokumen</dt>
                                <dd className="mt-1 font-semibold text-gray-900 font-mono">
                                    {viewing.nomor_dokumen || "-"}
                                </dd>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <dt className="text-xs text-gray-500">Jatuh Tempo</dt>
                                <dd className="mt-1 font-semibold text-gray-900">
                                    {formatTanggal(viewing.tanggal_jatuh_tempo)}
                                </dd>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <dt className="text-xs text-gray-500">Tanggal Terbit</dt>
                                <dd className="mt-1 font-semibold text-gray-900">
                                    {formatTanggal(viewing.tanggal_terbit)}
                                </dd>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <dt className="text-xs text-gray-500">Biaya Perpanjangan</dt>
                                <dd className="mt-1 font-semibold text-gray-900">
                                    {viewing.nominal_biaya
                                        ? `Rp ${rupiah(viewing.nominal_biaya)}`
                                        : "-"}
                                </dd>
                            </div>
                            <div className="col-span-2 bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                                <dt className="text-xs text-gray-500 mb-1">Scan Dokumen</dt>
                                <dd>
                                    {viewing.scan_dokumen_url ? (
                                        <a
                                            href={viewing.scan_dokumen_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 font-medium text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 transition"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Buka Berkas Scan Dokumen
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">
                                            Scan dokumen belum diunggah.
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setViewing(null)}
                                className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Perpanjang Dokumen */}
            {editing && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100">
                        <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Perpanjang Dokumen
                                </h3>
                                <p className="text-xs text-gray-500">
                                    <span className="font-semibold text-gray-700">
                                        {editing.armada?.plat_nomor}
                                    </span>{" "}
                                    ·{" "}
                                    {JENIS_LABEL[editing.jenis] || editing.jenis}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditing(null)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitPerpanjang} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Jatuh Tempo Baru{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.tanggal_jatuh_tempo_baru}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            tanggal_jatuh_tempo_baru: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Nomor Dokumen Baru
                                </label>
                                <input
                                    type="text"
                                    value={form.nomor_dokumen_baru}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            nomor_dokumen_baru: e.target.value,
                                        })
                                    }
                                    placeholder="Opsional (Isi jika berubah)"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Nominal Biaya (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={form.nominal_biaya}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            nominal_biaya: e.target.value,
                                        })
                                    }
                                    placeholder="Opsional"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Catatan
                                </label>
                                <textarea
                                    rows="2"
                                    value={form.catatan}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            catatan: e.target.value,
                                        })
                                    }
                                    placeholder="Catatan tambahan (opsional)"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                            {Object.keys(errors).length > 0 && (
                                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-red-600 text-xs font-medium">
                                        {Object.values(errors)[0]}
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                                >
                                    <Save className="w-4 h-4" />
                                    {processing ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}