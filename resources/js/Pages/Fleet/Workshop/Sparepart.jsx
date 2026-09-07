import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { SearchX, PackageSearch, X, Save, Wrench } from "lucide-react";

const STATUS_META = {
    diajukan: { label: "Diajukan", cls: "bg-amber-100 text-amber-800" },
    tersedia: { label: "Tersedia", cls: "bg-green-100 text-green-700" },
};

export default function Sparepart({ items, filters, canRecord }) {
    const [status, setStatus] = useState(filters.status || "");
    const [q, setQ] = useState(filters.q || "");
    const [editing, setEditing] = useState(null);
    const [record, setRecord] = useState({});
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const apply = () => {
        router.get(route("fleet.workshop.sparepart.index"), {
            status: status || undefined,
            q: q || undefined,
        });
    };

    const clear = () => {
        setStatus("");
        setQ("");
        router.get(route("fleet.workshop.sparepart.index"));
    };

    const startRecord = (it) => {
        setEditing(it.id);
        setRecord({
            id: it.id,
            nominal: Number(it.nominal || 0),
            jumlah: Number(it.jumlah || 1),
            tanggal: it.tanggal || new Date().toISOString().slice(0, 10),
            foto_nota: it.foto_nota || "",
            catatan: it.catatan || "",
        });
        setErrors({});
    };

    const submitRecord = (e) => {
        e.preventDefault();
        if (!editing) return;
        setErrors({});
        setProcessing(true);
        router.post(route("fleet.workshop.sparepart.record"), { items: [record] }, {
            preserveScroll: true,
            onError: (err) => setErrors(err),
            onSuccess: () => setEditing(null),
            onFinish: () => setProcessing(false),
        });
    };

    const source = (it) => {
        if (it.workshop_todo) {
            return { label: `To-Do: ${it.workshop_todo.judul}`, unit: it.workshop_todo.unit_label || it.workshop_todo.armada?.plat_nomor };
        }
        if (it.pengajuan) {
            return { label: `Servis: ${it.pengajuan.kode_pengajuan}`, unit: it.pengajuan.armada?.plat_nomor };
        }
        return { label: "-", unit: null };
    };

    return (
        <AuthenticatedLayout>
            <Head title="Workshop — Ajuan Sparepart" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Ajuan Sparepart</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Item sparepart yang diajukan Workshop (insidental 21.8 &amp; rutin 21.9) menunggu pencatatan Inventory
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Item</label>
                        <input
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Nama item"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Semua Status</option>
                            <option value="diajukan">Diajukan</option>
                            <option value="tersedia">Tersedia</option>
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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Sumber</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Jumlah</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Nominal</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                    <PackageSearch className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                                    Belum ada ajuan sparepart.
                                </td>
                            </tr>
                        ) : (
                            items.data.map((it) => {
                                const src = source(it);
                                const meta = STATUS_META[it.status] || { label: it.status, cls: "bg-gray-100 text-gray-600" };
                                return (
                                    <tr key={it.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {it.nama_item}
                                            {it.satuan && <span className="text-xs text-gray-400"> / {it.satuan}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {src.label}
                                            {src.unit && <span className="block text-xs text-gray-400">{src.unit}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm tabular-nums">{it.jumlah}</td>
                                        <td className="px-6 py-4 text-right text-sm tabular-nums">
                                            {Number(it.nominal || 0).toLocaleString("id-ID")}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            {canRecord && it.status === "diajukan" && it.workshop_todo && (
                                                <button
                                                    onClick={() => startRecord(it)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-gray-900"
                                                >
                                                    <Save className="w-4 h-4" /> Catat
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

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {items.from || 0} - {items.to || 0} dari {items.total || 0} data
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

            {/* Modal catat pengadaan (Inventory, item dari to-do) */}
            {editing && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Catat Pengadaan Sparepart</h3>
                            <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitRecord} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                                <input
                                    type="number"
                                    value={record.nominal}
                                    onChange={(e) => setRecord({ ...record, nominal: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                    <input
                                        type="number"
                                        value={record.jumlah}
                                        onChange={(e) => setRecord({ ...record, jumlah: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                    <input
                                        type="date"
                                        value={record.tanggal}
                                        onChange={(e) => setRecord({ ...record, tanggal: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Nota (URL/upload)</label>
                                <input
                                    type="text"
                                    value={record.foto_nota}
                                    onChange={(e) => setRecord({ ...record, foto_nota: e.target.value })}
                                    placeholder="opsional"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                                <textarea
                                    rows="2"
                                    value={record.catatan}
                                    onChange={(e) => setRecord({ ...record, catatan: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            {errors.items && <p className="text-red-600 text-xs">{errors.items}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 inline-flex items-center gap-1"
                                >
                                    <Wrench className="w-4 h-4" /> Catat
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}