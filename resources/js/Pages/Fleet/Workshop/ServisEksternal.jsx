import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    SearchX,
    Wrench,
    X,
    CheckCircle2,
    AlertTriangle,
    ExternalLink,
    ArrowLeft,
} from "lucide-react";

const STATUS_META = {
    belum: { label: "Belum Diverifikasi", cls: "bg-amber-100 text-amber-800" },
    terverifikasi: { label: "Terverifikasi", cls: "bg-green-100 text-green-700" },
    bermasalah: { label: "Bermasalah", cls: "bg-red-100 text-red-700" },
};

const rupiah = (n) => Number(n || 0).toLocaleString("id-ID");

export default function ServisEksternal({ items, filters, counts, canVerify }) {
    const [verifikasi, setVerifikasi] = useState(filters.verifikasi || "");
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ status: "terverifikasi", catatan: "" });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const apply = () => {
        router.get(route("fleet.workshop.servis-eksternal.index"), {
            verifikasi: verifikasi || undefined,
        });
    };

    const clear = () => {
        setVerifikasi("");
        router.get(route("fleet.workshop.servis-eksternal.index"));
    };

    const startVerify = (it) => {
        setEditing(it);
        setForm({
            status: it.eksternal_detail?.verifikasi_workshop || "terverifikasi",
            catatan: it.eksternal_detail?.verifikasi_workshop_catatan || "",
        });
        setErrors({});
    };

    const submit = (e) => {
        e.preventDefault();
        if (!editing) return;
        setProcessing(true);
        setErrors({});
        router.post(
            route("fleet.workshop.servis-eksternal.verifikasi", {
                pengajuan: editing.id,
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
            <Head title="Workshop - Verifikasi Servis Eksternal" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Verifikasi Servis Eksternal
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Servis armada yang dikerjakan bengkel luar. Workshop
                    memverifikasi kelengkapan nota &amp; hasil pekerjaan
                    (TD-B6/B7).
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { key: "belum", label: "Belum Diverifikasi", cls: "text-amber-700" },
                    { key: "terverifikasi", label: "Terverifikasi", cls: "text-green-700" },
                    { key: "bermasalah", label: "Bermasalah", cls: "text-red-700" },
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

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status Verifikasi
                        </label>
                        <select
                            value={verifikasi}
                            onChange={(e) => setVerifikasi(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Semua Status</option>
                            <option value="belum">Belum Diverifikasi</option>
                            <option value="terverifikasi">Terverifikasi</option>
                            <option value="bermasalah">Bermasalah</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
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

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                                Pengajuan / Unit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                                Bengkel
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">
                                Estimasi
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">
                                Nota
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
                                    colSpan={6}
                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                >
                                    <Wrench className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                                    Belum ada servis eksternal.
                                </td>
                            </tr>
                        ) : (
                            items.data.map((it) => {
                                const detail = it.eksternal_detail || {};
                                const status = detail.verifikasi_workshop || "belum";
                                const meta = STATUS_META[status] || STATUS_META.belum;
                                return (
                                    <tr key={it.id} className="hover:bg-gray-50 align-top">
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-semibold text-gray-900">
                                                {it.kode_pengajuan}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {it.armada?.plat_nomor ||
                                                    it.armada?.kode_unit ||
                                                    "-"}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Diajukan:{" "}
                                                {it.diajukan_oleh?.name || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="font-medium">
                                                {detail.nama_bengkel || "-"}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {detail.alamat_bengkel || "-"}
                                            </div>
                                            {detail.rincian_pekerjaan && (
                                                <div className="mt-1 text-xs text-gray-400 max-w-xs">
                                                    {detail.rincian_pekerjaan}
                                                </div>
                                            )}
                                            {detail.foto_bengkel_url && (
                                                <a
                                                    href={detail.foto_bengkel_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Foto bengkel
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm tabular-nums text-gray-700">
                                            Rp {rupiah(detail.total_biaya_estimasi)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm tabular-nums text-gray-700">
                                            {it.eksternal_notas?.length || 0}
                                            {it.eksternal_notas?.length > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    Rp{" "}
                                                    {rupiah(
                                                        it.eksternal_notas.reduce(
                                                            (s, n) =>
                                                                s +
                                                                Number(
                                                                    n.nominal_rp ||
                                                                        0,
                                                                ),
                                                            0,
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}
                                            >
                                                {meta.label}
                                            </span>
                                            {detail.verifikasi_workshop_catatan && (
                                                <div className="mt-1 text-xs text-gray-500 max-w-[14rem]">
                                                    {detail.verifikasi_workshop_catatan}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            {canVerify && (
                                                <button
                                                    onClick={() => startVerify(it)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Verifikasi
                                                </button>
                                            )}
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

            {editing && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Verifikasi Servis Eksternal
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {editing.kode_pengajuan} -{" "}
                                    {editing.eksternal_detail?.nama_bengkel || "-"}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditing(null)}
                                className="text-gray-500 hover:text-gray-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hasil Verifikasi
                                </label>
                                <select
                                    value={form.status}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            status: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="terverifikasi">
                                        Terverifikasi
                                    </option>
                                    <option value="bermasalah">
                                        Bermasalah
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catatan
                                </label>
                                <textarea
                                    rows="3"
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
                            {(errors.status || errors.catatan) && (
                                <p className="text-red-600 text-xs">
                                    {errors.status || errors.catatan}
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
                                    {form.status === "bermasalah" ? (
                                        <AlertTriangle className="w-4 h-4" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                    )}
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
