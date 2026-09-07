import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Wrench,
    PackageSearch,
    ClipboardCheck,
    Plus,
    Trash2,
    User,
    Truck,
    Check,
} from "lucide-react";

const STATUS_META = {
    diajukan: { label: "Diajukan", cls: "bg-blue-100 text-blue-700" },
    disetujui: { label: "Disetujui", cls: "bg-indigo-100 text-indigo-700" },
    ditolak: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
    dikerjakan: { label: "Dikerjakan", cls: "bg-amber-100 text-amber-700" },
    menunggu_sparepart: { label: "Menunggu Sparepart", cls: "bg-yellow-100 text-yellow-800" },
    sparepart_tersedia: { label: "Sparepart Tersedia", cls: "bg-teal-100 text-teal-700" },
    selesai: { label: "Selesai", cls: "bg-green-100 text-green-700" },
};

function SectionTitle({ number, title, desc }) {
    return (
        <div className="mb-4">
            <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold">
                    {number}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            {desc && <p className="mt-1 ml-8 text-sm text-gray-500">{desc}</p>}
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100 last:border-0">
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className="col-span-2 text-sm text-gray-900">{value || "-"}</dd>
        </div>
    );
}

export default function Show({ pengajuan, can }) {
    const meta = STATUS_META[pengajuan.status] || { label: pengajuan.status, cls: "bg-gray-100 text-gray-600" };

    // Bagian 2 — approval
    const [approve, setApprove] = useState({ catatan_acc: "" });
    const [errors, setErrors] = useState({});

    // Bagian 3 — workshop pengerjaan
    const [work, setWork] = useState({
        tanggal_mulai_kerja: new Date().toISOString().slice(0, 10),
        tanggal_selesai_kerja: "",
        catatan_pengerjaan: "",
        butuh_sparepart: false,
        personels: [{ nama_personel: "", peran: "" }],
    });

    // Bagian 3 — request sparepart
    const [items, setItems] = useState([{ nama_item: "", jumlah: 1, satuan: "", nominal: 0 }]);

    // Bagian 4 — record pengadaan sparepart (Inventory)
    const [records, setRecords] = useState(
        (pengajuan.spareparts || []).map((s) => ({
            id: s.id,
            nominal: Number(s.nominal || 0),
            jumlah: Number(s.jumlah || 1),
            fotos: "",
        }))
    );

    const [processing, setProcessing] = useState(false);

    const post = (url, data, onFinish) => {
        setErrors({});
        setProcessing(true);
        router.post(url, data, {
            preserveScroll: true,
            onError: (err) => setErrors(err),
            onFinish: () => {
                setProcessing(false);
                onFinish && onFinish();
            },
        });
    };

    const doApprove = (reject) => {
        const url = reject
            ? route("fleet.servis-armada.reject", pengajuan.id)
            : route("fleet.servis-armada.approve", pengajuan.id);
        post(url, approve);
    };

    const doAssignWorkshop = (e) => {
        e.preventDefault();
        post(route("fleet.servis-armada.assign-workshop", pengajuan.id), work);
    };

    const doRequestSparepart = (e) => {
        e.preventDefault();
        post(route("fleet.servis-armada.request-sparepart", pengajuan.id), { items });
    };

    const doRecordSparepart = (e) => {
        e.preventDefault();
        post(route("fleet.servis-armada.record-sparepart", pengajuan.id), { items: records });
    };

    const addPersonel = () => setWork({ ...work, personels: [...work.personels, { nama_personel: "", peran: "" }] });
    const addItem = () => setItems([...items, { nama_item: "", jumlah: 1, satuan: "", nominal: 0 }]);

    return (
        <AuthenticatedLayout>
            <Head title={pengajuan.kode_pengajuan} />

            <div className="mb-6">
                <Link
                    href={route("fleet.servis-armada.index")}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </Link>
                <div className="mt-2 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{pengajuan.kode_pengajuan}</h1>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Bagian 1 — Ajuan */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <SectionTitle number={1} title="Ajuan Servis" desc="Data diajukan oleh PIC/operator/driver." />
                    <dl>
                        <Row label="Armada" value={`${pengajuan.armada?.plat_nomor} (${pengajuan.armada?.kode_unit || "-"})`} />
                        <Row label="Tanggal Ajuan" value={pengajuan.tanggal_ajuan} />
                        <Row label="Diajukan Oleh" value={pengajuan.diajukan_oleh?.name} />
                        <Row label="Catatan / Kerusakan" value={pengajuan.catatan_ajuan} />
                    </dl>
                </div>

                {/* Bagian 2 — Approval */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <SectionTitle number={2} title="Approval" desc="ACC / tolak oleh Ketua Divisi Armada." />
                    <dl>
                        <Row label="Status ACC" value={pengajuan.catatan_acc} />
                        <Row label="Disetujui Oleh" value={pengajuan.disetujui_oleh?.name} />
                        <Row label="Tanggal ACC" value={pengajuan.tanggal_acc} />
                    </dl>

                    {can.approve && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                            <textarea
                                value={approve.catatan_acc}
                                onChange={(e) => setApprove({ catatan_acc: e.target.value })}
                                rows={2}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                            />
                            {errors.catatan_acc && <p className="mt-1 text-sm text-red-600">{errors.catatan_acc}</p>}
                            <div className="flex gap-3 mt-3">
                                <button
                                    onClick={() => doApprove(false)}
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Setujui
                                </button>
                                <button
                                    onClick={() => doApprove(true)}
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" /> Tolak
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bagian 3 — Pengerjaan */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <SectionTitle number={3} title="Pengerjaan Workshop" desc="Assign personel & catat pengerjaan oleh Workshop." />
                    <dl>
                        <Row label="Mulai Kerja" value={pengajuan.tanggal_mulai_kerja} />
                        <Row label="Selesai Kerja" value={pengajuan.tanggal_selesai_kerja} />
                        <Row label="Catatan Pengerjaan" value={pengajuan.catatan_pengerjaan} />
                        <Row label="Butuh Sparepart" value={pengajuan.butuh_sparepart ? "Ya" : "Tidak"} />
                    </dl>
                    {pengajuan.personels?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {pengajuan.personels.map((pe) => (
                                <span
                                    key={pe.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium"
                                >
                                    <User className="w-3 h-3" /> {pe.nama_personel} {pe.peran ? `(${pe.peran})` : ""}
                                </span>
                            ))}
                        </div>
                    )}

                    {can.assignWorkshop && (
                        <form onSubmit={doAssignWorkshop} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mulai Kerja</label>
                                    <input
                                        type="date"
                                        value={work.tanggal_mulai_kerja}
                                        onChange={(e) => setWork({ ...work, tanggal_mulai_kerja: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Selesai</label>
                                    <input
                                        type="date"
                                        value={work.tanggal_selesai_kerja}
                                        onChange={(e) => setWork({ ...work, tanggal_selesai_kerja: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Pengerjaan</label>
                                <textarea
                                    value={work.catatan_pengerjaan}
                                    onChange={(e) => setWork({ ...work, catatan_pengerjaan: e.target.value })}
                                    rows={2}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Personel Pengerja</label>
                                {work.personels.map((pe, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input
                                            value={pe.nama_personel}
                                            onChange={(e) => {
                                                const p = [...work.personels];
                                                p[i].nama_personel = e.target.value;
                                                setWork({ ...work, personels: p });
                                            }}
                                            placeholder="Nama personel"
                                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                                        />
                                        <input
                                            value={pe.peran}
                                            onChange={(e) => {
                                                const p = [...work.personels];
                                                p[i].peran = e.target.value;
                                                setWork({ ...work, personels: p });
                                            }}
                                            placeholder="Peran"
                                            className="w-40 border border-gray-300 rounded-md px-3 py-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setWork({ ...work, personels: work.personels.filter((_, x) => x !== i) })}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addPersonel}
                                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                                >
                                    <Plus className="w-4 h-4" /> Tambah Personel
                                </button>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={work.butuh_sparepart}
                                    onChange={(e) => setWork({ ...work, butuh_sparepart: e.target.checked })}
                                    className="rounded border-gray-300"
                                />
                                Servis butuh sparepart (lanjut ke pengadaan)
                            </label>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                                >
                                    <Wrench className="w-4 h-4" /> Mulai / Perbarui Pengerjaan
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Bagian 4 — Sparepart & Complete */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <SectionTitle number={4} title="Pengadaan & Penyelesaian" desc="Sparepart (Inventory) & penyelesaian servis." />

                    <div className="mb-4">
                        <Row label="Status Pengadaan" value={pengajuan.status_pengadaan_sparepart || "-"} />
                        <Row label="Total Biaya" value={`Rp ${Number(pengajuan.total_biaya || 0).toLocaleString("id-ID")}`} />
                        <Row label="Selesai" value={pengajuan.tanggal_selesai} />
                    </div>

                    {(pengajuan.spareparts?.length > 0 || can.requestSparepart) && (
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <PackageSearch className="w-4 h-4 text-yellow-600" /> Daftar Sparepart
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-500">Item</th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-500">Jumlah</th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-500">Nominal</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pengajuan.spareparts?.map((s) => (
                                            <tr key={s.id}>
                                                <td className="px-3 py-2 text-gray-900">
                                                    {s.nama_item}
                                                    {s.satuan && <span className="text-gray-400"> ({s.satuan})</span>}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">{s.jumlah}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {Number(s.nominal || 0).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            s.status === "tersedia"
                                                                ? "bg-teal-100 text-teal-700"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    >
                                                        {s.status === "tersedia" ? "Tersedia" : "Diajukan"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {!pengajuan.spareparts?.length && (
                                            <tr>
                                                <td colSpan={4} className="px-3 py-2 text-gray-400">
                                                    Belum ada item sparepart.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Request sparepart (Workshop) */}
                            {can.requestSparepart && (
                                <form onSubmit={doRequestSparepart} className="mt-4 border-t border-gray-100 pt-4">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Ajukan Kebutuhan Sparepart</h5>
                                    {items.map((it, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                                            <input
                                                value={it.nama_item}
                                                onChange={(e) => {
                                                    const n = [...items];
                                                    n[i].nama_item = e.target.value;
                                                    setItems(n);
                                                }}
                                                placeholder="Nama sparepart"
                                                className="col-span-6 border border-gray-300 rounded-md px-3 py-2"
                                            />
                                            <input
                                                type="number"
                                                value={it.jumlah}
                                                onChange={(e) => {
                                                    const n = [...items];
                                                    n[i].jumlah = e.target.value;
                                                    setItems(n);
                                                }}
                                                placeholder="Jumlah"
                                                className="col-span-2 border border-gray-300 rounded-md px-3 py-2"
                                            />
                                            <input
                                                value={it.satuan}
                                                onChange={(e) => {
                                                    const n = [...items];
                                                    n[i].satuan = e.target.value;
                                                    setItems(n);
                                                }}
                                                placeholder="Satuan"
                                                className="col-span-2 border border-gray-300 rounded-md px-3 py-2"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setItems(items.filter((_, x) => x !== i))}
                                                className="col-span-2 text-red-500 hover:text-red-700 inline-flex items-center justify-center"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        <Plus className="w-4 h-4" /> Tambah Item
                                    </button>
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-50"
                                        >
                                            <PackageSearch className="w-4 h-4" /> Ajukan ke Inventory
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Record pengadaan (Inventory) */}
                            {can.recordSparepart && records.length > 0 && (
                                <form onSubmit={doRecordSparepart} className="mt-4 border-t border-gray-100 pt-4">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Catat Pengadaan (Inventory)</h5>
                                    {records.map((r, i) => (
                                        <div key={r.id} className="grid grid-cols-2 gap-2 mb-2">
                                            <div className="text-sm text-gray-600 flex items-center px-1">
                                                {pengajuan.spareparts.find((s) => s.id === r.id)?.nama_item}
                                            </div>
                                            <input
                                                type="number"
                                                value={r.nominal}
                                                onChange={(e) => {
                                                    const n = [...records];
                                                    n[i].nominal = e.target.value;
                                                    setRecords(n);
                                                }}
                                                placeholder="Nominal (Rp)"
                                                className="border border-gray-300 rounded-md px-3 py-2"
                                            />
                                        </div>
                                    ))}
                                    {errors["items.0.nominal"] && (
                                        <p className="mt-1 text-sm text-red-600">{errors["items.0.nominal"]}</p>
                                    )}
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" /> Catat Pengadaan & Siapkan
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Complete */}
                    {can.complete && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Selesaikan Servis</h5>
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Biaya (Rp)</label>
                                    <input
                                        type="number"
                                        defaultValue={pengajuan.total_biaya || 0}
                                        id="total_biaya"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <button
                                    onClick={() =>
                                        post(
                                            route("fleet.servis-armada.complete", pengajuan.id),
                                            {
                                                total_biaya: document.getElementById("total_biaya").value,
                                                tanggal_selesai_kerja: new Date().toISOString().slice(0, 10),
                                            }
                                        )
                                    }
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    <ClipboardCheck className="w-4 h-4" /> Selesaikan
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
