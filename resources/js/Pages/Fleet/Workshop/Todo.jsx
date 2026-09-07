import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Plus,
    CalendarClock,
    CheckCircle2,
    Trash2,
    Wrench,
    SearchX,
    PackagePlus,
    X,
    AlertCircle,
} from "lucide-react";

const STATUS_META = {
    terjadwal: { label: "Terjadwal", cls: "bg-blue-100 text-blue-700" },
    terlewat: { label: "Terlewat", cls: "bg-red-100 text-red-700" },
    selesai: { label: "Selesai", cls: "bg-green-100 text-green-700" },
};

const JADWAL_TIPE = [
    { value: "harian", label: "Harian" },
    { value: "mingguan", label: "Mingguan" },
    { value: "bulanan", label: "Bulanan" },
    { value: "tanggal_tertentu", label: "Tanggal Tertentu" },
];

const emptyTodo = {
    judul: "",
    deskripsi: "",
    jadwal_tipe: "mingguan",
    jadwal_detail: "senin",
    armada_id: "",
    mesin_id: "",
    assigned_to: "",
};

export default function Todo({ todos, armadas, mesins, workshopUsers, filters, can }) {
    const [status, setStatus] = useState(filters.status || "");
    const [q, setQ] = useState(filters.q || "");
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(emptyTodo);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [sparepartFor, setSparepartFor] = useState(null);
    const [items, setItems] = useState([{ nama_item: "", jumlah: 1, satuan: "", nominal: 0 }]);
    const [spErrors, setSpErrors] = useState({});

    const post = (url, data, opts = {}) => {
        setErrors({});
        setProcessing(true);
        router.post(url, data, {
            preserveScroll: true,
            onError: (err) => {
                if (opts.onError) opts.onError(err);
                else setErrors(err);
            },
            onSuccess: () => opts.onSuccess && opts.onSuccess(),
            onFinish: () => setProcessing(false),
        });
    };

    const apply = () => {
        router.get(route("fleet.workshop.todo.index"), {
            status: status || undefined,
            q: q || undefined,
        });
    };

    const clear = () => {
        setStatus("");
        setQ("");
        router.get(route("fleet.workshop.todo.index"));
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route("fleet.workshop.todo.store"), form, {
            onSuccess: () => {
                setShowCreate(false);
                setForm(emptyTodo);
            },
        });
    };

    const doComplete = (t) => {
        setProcessing(true);
        router.post(route("fleet.workshop.todo.complete", t.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const doDelete = (t) => {
        if (!confirm(`Hapus to-do "${t.judul}"?`)) return;
        router.delete(route("fleet.workshop.todo.destroy", t.id), { preserveScroll: true });
    };

    const openSparepart = (t) => {
        setSparepartFor(t);
        setItems([{ nama_item: "", jumlah: 1, satuan: "", nominal: 0 }]);
        setSpErrors({});
    };

    const addSparepartItem = () =>
        setItems([...items, { nama_item: "", jumlah: 1, satuan: "", nominal: 0 }]);

    const submitSparepart = (e) => {
        e.preventDefault();
        if (!sparepartFor) return;
        setSpErrors({});
        post(
            route("fleet.workshop.todo.request-sparepart", sparepartFor.id),
            { items },
            {
                onError: (err) => setSpErrors(err),
                onSuccess: () => setSparepartFor(null),
            }
        );
    };

    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString("id-ID") : "-";

    return (
        <AuthenticatedLayout>
            <Head title="Workshop — To-Do List" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">To-Do List Servis Rutin</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Servis terjadwal Workshop (harian / mingguan / bulanan / tanggal tertentu)
                    </p>
                </div>
                {can.manage && (
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        {showCreate ? "Tutup Form" : "Buat To-Do"}
                    </button>
                )}
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Judul</label>
                        <input
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Judul to-do"
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
                            <option value="belum">Belum Selesai</option>
                            <option value="selesai">Selesai</option>
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

            {/* Form create */}
            {showCreate && can.manage && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Buat To-Do Servis Rutin</h2>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul *</label>
                                <input
                                    type="text"
                                    value={form.judul}
                                    onChange={(e) => setForm({ ...form, judul: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                                {errors.judul && <p className="text-red-600 text-xs mt-1">{errors.judul}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jadwal Tipe *</label>
                                <select
                                    value={form.jadwal_tipe}
                                    onChange={(e) => setForm({ ...form, jadwal_tipe: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    {JADWAL_TIPE.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Detail Jadwal</label>
                                {form.jadwal_tipe === "mingguan" ? (
                                    <select
                                        value={form.jadwal_detail}
                                        onChange={(e) => setForm({ ...form, jadwal_detail: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        {["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"].map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                ) : form.jadwal_tipe === "bulanan" ? (
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={form.jadwal_detail}
                                        onChange={(e) => setForm({ ...form, jadwal_detail: e.target.value })}
                                        placeholder="1..31"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                ) : form.jadwal_tipe === "tanggal_tertentu" ? (
                                    <input
                                        type="date"
                                        value={form.jadwal_detail}
                                        onChange={(e) => setForm({ ...form, jadwal_detail: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={form.jadwal_detail || "-"}
                                        disabled
                                        placeholder="Setiap hari"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                                    />
                                )}
                                {errors.jadwal_detail && <p className="text-red-600 text-xs mt-1">{errors.jadwal_detail}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                                <select
                                    value={form.assigned_to}
                                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">- Tidak ditentukan -</option>
                                    {workshopUsers.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Armada (opsional)</label>
                                <select
                                    value={form.armada_id}
                                    onChange={(e) => setForm({ ...form, armada_id: e.target.value, mesin_id: "" })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">- Pilih Armada -</option>
                                    {armadas.map((a) => (
                                        <option key={a.id} value={a.id}>{a.plat_nomor} ({a.kode_unit})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mesin Produksi (opsional)</label>
                                <select
                                    value={form.mesin_id}
                                    onChange={(e) => setForm({ ...form, mesin_id: e.target.value, armada_id: "" })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">- Pilih Mesin -</option>
                                    {mesins.map((m) => (
                                        <option key={m.id} value={m.id}>{m.nama} ({m.jenis})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea
                                    rows="3"
                                    value={form.deskripsi}
                                    onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                                {errors.deskripsi && <p className="text-red-600 text-xs mt-1">{errors.deskripsi}</p>}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
                        >
                            Simpan To-Do
                        </button>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {todos.data.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-500">
                        Belum ada to-do servis rutin.
                    </div>
                ) : (
                    todos.data.map((t) => {
                        const meta = STATUS_META[t.status_text] || { label: t.status_text, cls: "bg-gray-100 text-gray-600" };
                        return (
                            <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-base font-semibold text-gray-900">{t.judul}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>
                                                {meta.label}
                                            </span>
                                        </div>
                                        {t.deskripsi && <p className="mt-1 text-sm text-gray-500">{t.deskripsi}</p>}
                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarClock className="w-3.5 h-3.5" />
                                                {t.jadwal_label}
                                            </span>
                                            <span>Unit: <b>{t.unit_label}</b></span>
                                            <span>Jatuh tempo: <b>{fmtDate(t.due_date)}</b></span>
                                            {t.assigned_to && <span>PJ: {t.assigned_to?.name}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {can.manage && t.status !== "selesai" && (
                                            <button
                                                onClick={() => doComplete(t)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-900"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Selesai
                                            </button>
                                        )}
                                        {can.manage && (
                                            <button
                                                onClick={() => openSparepart(t)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900"
                                            >
                                                <PackagePlus className="w-4 h-4" /> Ajukan Sparepart
                                            </button>
                                        )}
                                        {can.manage && (
                                            <button
                                                onClick={() => doDelete(t)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" /> Hapus
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {todos.from || 0} - {todos.to || 0} dari {todos.total || 0} data
                </div>
                <div className="flex gap-2">
                    {todos.links &&
                        todos.links.map((link, index) => (
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

            {/* Modal ajukan sparepart */}
            {sparepartFor && can.manage && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-bw-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Ajukan Sparepart</h3>
                                <p className="text-sm text-gray-500">Dari to-do: {sparepartFor.judul}</p>
                            </div>
                            <button onClick={() => setSparepartFor(null)} className="text-gray-500 hover:text-gray-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitSparepart} className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nama item *"
                                            value={item.nama_item}
                                            onChange={(e) =>
                                                setItems(items.map((x, i) => (i === idx ? { ...x, nama_item: e.target.value } : x)))
                                            }
                                            className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="number"
                                            placeholder="Jumlah"
                                            value={item.jumlah}
                                            onChange={(e) =>
                                                setItems(items.map((x, i) => (i === idx ? { ...x, jumlah: e.target.value } : x)))
                                            }
                                            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Satuan"
                                            value={item.satuan}
                                            onChange={(e) =>
                                                setItems(items.map((x, i) => (i === idx ? { ...x, satuan: e.target.value } : x)))
                                            }
                                            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Nominal"
                                            value={item.nominal}
                                            onChange={(e) =>
                                                setItems(items.map((x, i) => (i === idx ? { ...x, nominal: e.target.value } : x)))
                                            }
                                            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addSparepartItem}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900"
                            >
                                <Plus className="w-4 h-4" /> Tambah Item
                            </button>
                            {spErrors.adalah && <p className="text-red-600 text-xs">{spErrors.adalah}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSparepartFor(null)}
                                    className="border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Kirim ke Inventory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {processing && (
                <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg inline-flex items-center gap-2 shadow-lg">
                    <AlertCircle className="w-4 h-4 animate-spin" /> Memproses...
                </div>
            )}
        </AuthenticatedLayout>
    );
}