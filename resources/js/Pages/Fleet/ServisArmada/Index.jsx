import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Plus, SearchX, Eye } from "lucide-react";
import { formatTanggal } from "@/utils/date";

const STATUS_META = {
    diajukan: { label: "Diajukan", cls: "bg-blue-100 text-blue-700" },
    disetujui: { label: "Disetujui", cls: "bg-indigo-100 text-indigo-700" },
    ditolak: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
    dikerjakan: { label: "Dikerjakan", cls: "bg-amber-100 text-amber-700" },
    menunggu_sparepart: { label: "Menunggu Sparepart", cls: "bg-yellow-100 text-yellow-800" },
    sparepart_tersedia: { label: "Sparepart Tersedia", cls: "bg-teal-100 text-teal-700" },
    selesai: { label: "Selesai", cls: "bg-green-100 text-green-700" },
};

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, m]) => ({
    value,
    label: m.label,
}));

export default function Index({ pengajuans, armadas, filters }) {
    const { auth } = usePage().props;
    const permissions = auth?.permissions || [];
    const canSubmit =
        permissions.includes("manage fleet service") ||
        permissions.includes("submit fleet service") ||
        permissions.includes("manage fleet");

    const [status, setStatus] = useState(filters.status || "");
    const [armadaId, setArmadaId] = useState(filters.armada_id || "");
    const [q, setQ] = useState(filters.q || "");

    const apply = () => {
        router.get(route("fleet.servis-armada.index"), {
            status: status || undefined,
            armada_id: armadaId || undefined,
            q: q || undefined,
        });
    };

    const clear = () => {
        setStatus("");
        setArmadaId("");
        setQ("");
        router.get(route("fleet.servis-armada.index"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Servis Armada" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sistem Servis Armada</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Alur ajuan &rarr; approval &rarr; workshop &rarr; sparepart (multi-bagian)
                    </p>
                </div>
                {canSubmit && (
                    <Link
                        href={route("fleet.servis-armada.create")}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Ajukan Servis
                    </Link>
                )}
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari (No./Plat)</label>
                        <input
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Kode pengajuan atau plat"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Semua Status</option>
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Armada</label>
                        <select
                            value={armadaId}
                            onChange={(e) => setArmadaId(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Semua Armada</option>
                            {armadas.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.plat_nomor} ({a.kode_unit})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={apply}
                            className="flex-1 bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-700"
                        >
                            Terapkan
                        </button>
                        <button
                            onClick={clear}
                            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-100 inline-flex items-center justify-center gap-1"
                        >
                            <SearchX className="w-4 h-4" /> Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">No. Pengajuan</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Armada</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Diajukan</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Biaya</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {pengajuans.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                    Belum ada pengajuan servis armada.
                                </td>
                            </tr>
                        ) : (
                            pengajuans.data.map((p) => {
                                const meta = STATUS_META[p.status] || { label: p.status, cls: "bg-gray-100 text-gray-600" };
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.kode_pengajuan}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {p.armada?.plat_nomor}
                                            <span className="block text-xs text-gray-400">{p.armada?.kode_unit}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{p.diajukan_oleh?.name || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatTanggal(p.tanggal_ajuan)}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm tabular-nums">
                                            {Number(p.total_biaya || 0).toLocaleString("id-ID")}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                            <Link
                                                href={route("fleet.servis-armada.show", p.id)}
                                                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                                            >
                                                <Eye className="w-4 h-4" /> Detail
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {pengajuans.from || 0} - {pengajuans.to || 0} dari {pengajuans.total || 0} data
                </div>
                <div className="flex gap-2">
                    {pengajuans.links &&
                        pengajuans.links.map((link, index) => (
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
        </AuthenticatedLayout>
    );
}
