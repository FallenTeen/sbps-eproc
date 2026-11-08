import React, { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    SearchX,
    CalendarClock,
    X,
    Save,
    ArrowLeft,
    BellRing,
    Eye,
} from "lucide-react";

const JENIS_LABEL = {
    pajak_tahunan: "Pajak Tahunan",
    stnk_5_tahunan: "STNK 5 Tahunan",
    kir: "KIR",
};

const STATUS_META = {
    lewat: { label: "Lewat Jatuh Tempo", cls: "bg-red-100 text-red-700" },
    akan_jatuh_tempo: {
        label: "Akan Jatuh Tempo",
        cls: "bg-amber-100 text-amber-800",
    },
    aktif: { label: "Aktif", cls: "bg-green-100 text-green-700" },
};

const rupiah = (n) => Number(n || 0).toLocaleString("id-ID");
const tanggal = (v) => (v ? new Date(v).toLocaleDateString("id-ID") : "-");

export default function DokumenBerkala({ items, filters, counts, canManage }) {
    const [status, setStatus] = useState(filters.status || "");
    const [jenis, setJenis] = useState(filters.jenis || "");
    const [q, setQ] = useState(filters.q || "");
    const [selected, setSelected] = useState([]);
    const [reminderInput, setReminderInput] = useState("30,14,7");
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [form, setForm] = useState({});
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const allIds = useMemo(() => items.data.map((it) => it.id), [items.data]);
    const allChecked = allIds.length > 0 && selected.length === allIds.length;

    const apply = () => {
        router.get(route("fleet.dokumen-berkala.index"), {
            status: status || undefined,
            jenis: jenis || undefined,
            q: q || undefined,
        });
    };

    const clear = () => {
        setStatus("");
        setJenis("");
        setQ("");
        router.get(route("fleet.dokumen-berkala.index"));
    };

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
            setErrors({ reminder_hari_sebelum: "Isi minimal satu angka hari." });
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

    return (
        <AuthenticatedLayout>
            <Head title="Dokumen Armada" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Dokumen Armada
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Pantau pajak, STNK, dan KIR seluruh armada. Atur pengingat
                    (hari sebelum jatuh tempo) secara massal dan perpanjang
                    dokumen langsung dari sini.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { key: "lewat", label: "Lewat Jatuh Tempo", cls: "text-red-700" },
                    { key: "akan_jatuh_tempo", label: "Akan Jatuh Tempo (30 hari)", cls: "text-amber-700" },
                    { key: "aktif", label: "Aktif", cls: "text-green-700" },
                ].map((c) => (
                    <div
                        key={c.key}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
                    >
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {c.label}
                        </div>
                        <div className={`mt-1 text-2xl font-bold ${c.cls}`}>
                            {counts?.[c.key] ?? 0}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cari Unit
                        </label>
                        <input
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Plat / kode unit"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis
                        </label>
                        <select
                            value={jenis}
                            onChange={(e) => setJenis(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Semua Jenis</option>
                            <option value="pajak_tahunan">Pajak Tahunan</option>
                            <option value="stnk_5_tahunan">STNK 5 Tahunan</option>
                            <option value="kir">KIR</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Semua Status</option>
                            <option value="lewat">Lewat Jatuh Tempo</option>
                            <option value="akan_jatuh_tempo">Akan Jatuh Tempo</option>
                            <option value="aktif">Aktif</option>
                        </select>
                    </div>
                    <div className="flex gap-2 md:col-span-2">
                        <button
                            onClick={apply}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white border-2 border-black bg-gray-900 transition-colors"
                        >
                            Terapkan
                        </button>
                        <button
                            onClick={clear}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-white bg-surface-muted border-2 border-black hover:bg-gray-900 transition-colors"
                        >
                            <SearchX className="w-4 h-4" /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {canManage && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <BellRing className="w-4 h-4" />
                            <span>
                                {selected.length} dokumen dipilih
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Reminder (hari sebelum, pisah koma)
                            </label>
                            <input
                                type="text"
                                value={reminderInput}
                                onChange={(e) => setReminderInput(e.target.value)}
                                placeholder="30,14,7"
                                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48"
                            />
                        </div>
                        <button
                            onClick={submitBulkReminder}
                            disabled={!selected.length}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                        >
                            <Save className="w-4 h-4" /> Terapkan ke Terpilih
                        </button>
                        {errors.reminder_hari_sebelum && (
                            <span className="text-xs text-red-600">
                                {errors.reminder_hari_sebelum}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {canManage && (
                                <th className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        onChange={toggleAll}
                                    />
                                </th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                                Unit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                                Jenis
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                                Nomor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                                Jatuh Tempo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                                Reminder
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={canManage ? 8 : 7}
                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                >
                                    <CalendarClock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                                    Belum ada dokumen berkala.
                                </td>
                            </tr>
                        ) : (
                            items.data.map((it) => {
                                const meta =
                                    STATUS_META[it.status_dokumen] ||
                                    STATUS_META.aktif;
                                return (
                                    <tr
                                        key={it.id}
                                        className="hover:bg-gray-50"
                                    >
                                        {canManage && (
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(
                                                        it.id,
                                                    )}
                                                    onChange={() => toggle(it.id)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-semibold text-gray-900">
                                                {it.armada?.plat_nomor || "-"}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {it.armada?.kode_unit || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {JENIS_LABEL[it.jenis] || it.jenis}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {it.nomor_dokumen || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {tanggal(it.tanggal_jatuh_tempo)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {(it.reminder_hari_sebelum || [])
                                                .join(", ") || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}
                                            >
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            <div className="inline-flex items-center justify-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewing(it)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Lihat Dokumen
                                                </button>
                                                {canManage && (
                                                    <button
                                                        onClick={() =>
                                                            startPerpanjang(it)
                                                        }
                                                        className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-900 hover:bg-black text-white rounded-md px-3 py-1 transition-colors"
                                                    >
                                                        Perpanjang
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {items.from || 0} - {items.to || 0} dari{" "}
                    {items.total || 0} data
                </div>
                <div className="flex gap-2">
                    {items.links &&
                        items.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 border rounded ${link.active ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100"}`}
                                disabled={!link.url}
                            />
                        ))}
                </div>
            </div>

            {viewing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dokumen-detail-title"
                        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg"
                    >
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <h2
                                    id="dokumen-detail-title"
                                    className="text-lg font-semibold text-gray-900"
                                >
                                    Detail Dokumen Armada
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    {viewing.armada?.plat_nomor || "-"} ·{" "}
                                    {JENIS_LABEL[viewing.jenis] || viewing.jenis}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewing(null)}
                                aria-label="Tutup detail dokumen"
                                className="text-gray-500 hover:text-gray-900"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-gray-500">Nomor Dokumen</dt>
                                <dd className="mt-1 font-medium text-gray-900">
                                    {viewing.nomor_dokumen || "-"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Jatuh Tempo</dt>
                                <dd className="mt-1 font-medium text-gray-900">
                                    {tanggal(viewing.tanggal_jatuh_tempo)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Tanggal Terbit</dt>
                                <dd className="mt-1 font-medium text-gray-900">
                                    {tanggal(viewing.tanggal_terbit)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Biaya</dt>
                                <dd className="mt-1 font-medium text-gray-900">
                                    {viewing.nominal_biaya
                                        ? `Rp ${rupiah(viewing.nominal_biaya)}`
                                        : "-"}
                                </dd>
                            </div>
                            <div className="col-span-2">
                                <dt className="text-gray-500">Scan Dokumen</dt>
                                <dd className="mt-1">
                                    {viewing.scan_dokumen_url ? (
                                        <a
                                            href={viewing.scan_dokumen_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Buka scan dokumen
                                        </a>
                                    ) : (
                                        <span className="text-gray-500">
                                            Scan dokumen belum diunggah.
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Perpanjang Dokumen
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {editing.armada?.plat_nomor} -{" "}
                                    {JENIS_LABEL[editing.jenis] || editing.jenis}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditing(null)}
                                className="text-gray-500 hover:text-gray-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitPerpanjang} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jatuh Tempo Baru
                                </label>
                                <input
                                    type="date"
                                    value={form.tanggal_jatuh_tempo_baru}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            tanggal_jatuh_tempo_baru:
                                                e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    placeholder="opsional"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    placeholder="opsional"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    placeholder="opsional"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            {Object.keys(errors).length > 0 && (
                                <p className="text-red-600 text-xs">
                                    {Object.values(errors)[0]}
                                </p>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
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
