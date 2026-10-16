import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
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
    Check,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

const STATUS_META = {
    diajukan: { label: "Diajukan", cls: "bg-blue-100 text-blue-700" },
    disetujui: { label: "Disetujui", cls: "bg-indigo-100 text-indigo-700" },
    ditolak: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
    dikerjakan: { label: "Dikerjakan", cls: "bg-amber-100 text-amber-700" },
    menunggu_sparepart: {
        label: "Menunggu Sparepart",
        cls: "bg-yellow-100 text-yellow-800",
    },
    sparepart_tersedia: {
        label: "Sparepart Tersedia",
        cls: "bg-teal-100 text-teal-700",
    },
    selesai: { label: "Selesai", cls: "bg-green-100 text-green-700" },
};

function SectionTitle({ number, title, desc }) {
    return (
        <div className="mb-4">
            <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
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
        <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="col-span-2 text-sm text-gray-900">{value || "-"}</dd>
        </div>
    );
}

export default function Show({ pengajuan, can }) {
    const meta = STATUS_META[pengajuan.status] || {
        label: pengajuan.status,
        cls: "bg-gray-100 text-gray-600",
    };

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
    const [items, setItems] = useState([
        { nama_item: "", jumlah: 1, satuan: "", nominal: 0 },
    ]);

    // Bagian 4 — record pengadaan sparepart (Inventory)
    const [records, setRecords] = useState(
        (pengajuan.spareparts || []).map((s) => ({
            id: s.id,
            nominal: Number(s.nominal || 0),
            jumlah: Number(s.jumlah || 1),
            fotos: "",
        })),
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
        router.post(
            route("fleet.servis-armada.assign-workshop", pengajuan.id),
            work,
            {
                onSuccess: () => {
                    setWork({
                        tanggal_mulai_kerja: "",
                        tanggal_selesai_kerja: "",
                        catatan_pengerjaan: "",
                        personels: [{ nama_personel: "", peran: "" }],
                        butuh_sparepart: false,
                    });
                },
            },
        );
    };

    const doRequestSparepart = (e) => {
        e.preventDefault();
        post(route("fleet.servis-armada.request-sparepart", pengajuan.id), {
            items,
        });
    };

    const doRecordSparepart = (e) => {
        e.preventDefault();
        post(route("fleet.servis-armada.record-sparepart", pengajuan.id), {
            items: records,
        });
    };

    const addPersonel = () =>
        setWork({
            ...work,
            personels: [...work.personels, { nama_personel: "", peran: "" }],
        });

    const addItem = () =>
        setItems([
            ...items,
            { nama_item: "", jumlah: 1, satuan: "", nominal: 0 },
        ]);

    return (
        <AuthenticatedLayout>
            <Head title={pengajuan.kode_pengajuan} />

            <div className="mx-auto max-w-5xl py-6 space-y-6">
                {/* Header Halaman & Action Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Detail Pengajuan Servis
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                            <h1 className="break-all text-xl font-bold text-gray-900 sm:text-2xl">
                                {pengajuan.kode_pengajuan}
                            </h1>
                            <span
                                className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${meta.cls}`}
                            >
                                {meta.label}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            Informasi pengajuan, persetujuan, pengerjaan, dan penyelesaian servis.
                        </p>
                    </div>

                    <Link
                        href={route("fleet.servis-armada.index")}
                        className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Daftar
                    </Link>
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Bagian 1 — Ajuan */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <SectionTitle
                            number={1}
                            title="Ajuan Servis"
                            desc="Data diajukan oleh PIC/operator/driver."
                        />

                        <dl className="mt-2">
                            <Row
                                label="Armada"
                                value={`${pengajuan.armada?.plat_nomor || "-"} (${pengajuan.armada?.kode_unit || "-"})`}
                            />
                            <Row
                                label="Tanggal Ajuan"
                                value={formatTanggal(pengajuan.tanggal_ajuan)}
                            />
                            <Row
                                label="Diajukan Oleh"
                                value={pengajuan.diajukan_oleh?.name}
                            />
                            <Row
                                label="Catatan / Kerusakan"
                                value={pengajuan.catatan_ajuan}
                            />
                        </dl>
                    </div>

                    {/* Bagian 2 — Approval */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <SectionTitle
                            number={2}
                            title="Approval"
                            desc="ACC / tolak oleh Ketua Divisi Armada."
                        />

                        <dl className="mt-2">
                            <Row label="Catatan ACC" value={pengajuan.catatan_acc} />
                            <Row
                                label="Disetujui Oleh"
                                value={pengajuan.disetujui_oleh?.name}
                            />
                            <Row
                                label="Tanggal ACC"
                                value={formatTanggal(pengajuan.tanggal_acc)}
                            />
                        </dl>

                        {can.approve && (
                            <div className="mt-5 border-t border-gray-100 pt-4 space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Catatan Approval
                                    </label>
                                    <textarea
                                        value={approve.catatan_acc}
                                        onChange={(e) =>
                                            setApprove({ catatan_acc: e.target.value })
                                        }
                                        rows={2}
                                        placeholder="Berikan catatan persetujuan atau penolakan…"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    />
                                    {errors.catatan_acc && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.catatan_acc}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => doApprove(true)}
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50 transition"
                                    >
                                        <XCircle className="w-4 h-4" /> Tolak
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => doApprove(false)}
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Setujui
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bagian 3 — Pengerjaan */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <SectionTitle
                            number={3}
                            title="Pengerjaan Workshop"
                            desc="Assign personel & catat pengerjaan oleh Workshop."
                        />

                        <dl className="mt-2">
                            <Row
                                label="Mulai Kerja"
                                value={formatTanggal(pengajuan.tanggal_mulai_kerja)}
                            />
                            <Row
                                label="Selesai Kerja"
                                value={formatTanggal(pengajuan.tanggal_selesai_kerja)}
                            />
                            <Row
                                label="Catatan Pengerjaan"
                                value={pengajuan.catatan_pengerjaan}
                            />
                            <Row
                                label="Butuh Sparepart"
                                value={pengajuan.butuh_sparepart ? "Ya" : "Tidak"}
                            />
                        </dl>

                        {pengajuan.personels?.length > 0 && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                                <span className="text-xs font-medium text-gray-500 mr-2">Personel Assigned:</span>
                                {pengajuan.personels.map((pe) => (
                                    <span
                                        key={pe.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-medium"
                                    >
                                        <User className="w-3 h-3 text-amber-600" />
                                        {pe.nama_personel}
                                        {pe.peran ? ` (${pe.peran})` : ""}
                                    </span>
                                ))}
                            </div>
                        )}

                        {can.assignWorkshop && (
                            <form
                                onSubmit={doAssignWorkshop}
                                className="mt-5 border-t border-gray-100 pt-4 space-y-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mulai Kerja
                                        </label>
                                        <input
                                            type="date"
                                            value={work.tanggal_mulai_kerja}
                                            onChange={(e) =>
                                                setWork({
                                                    ...work,
                                                    tanggal_mulai_kerja: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Target Selesai
                                        </label>
                                        <input
                                            type="date"
                                            value={work.tanggal_selesai_kerja}
                                            onChange={(e) =>
                                                setWork({
                                                    ...work,
                                                    tanggal_selesai_kerja: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Catatan Pengerjaan
                                    </label>
                                    <textarea
                                        value={work.catatan_pengerjaan}
                                        onChange={(e) =>
                                            setWork({
                                                ...work,
                                                catatan_pengerjaan: e.target.value,
                                            })
                                        }
                                        rows={2}
                                        placeholder="Tambahkan instruksi / catatan pengerjaan…"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Personel Pengerja
                                    </label>
                                    <div className="space-y-2">
                                        {work.personels.map((pe, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2"
                                            >
                                                <input
                                                    value={pe.nama_personel}
                                                    onChange={(e) => {
                                                        const p = [...work.personels];
                                                        p[i].nama_personel = e.target.value;
                                                        setWork({ ...work, personels: p });
                                                    }}
                                                    placeholder="Nama personel"
                                                    className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                />
                                                <input
                                                    value={pe.peran}
                                                    onChange={(e) => {
                                                        const p = [...work.personels];
                                                        p[i].peran = e.target.value;
                                                        setWork({ ...work, personels: p });
                                                    }}
                                                    placeholder="Peran (Mekanik, dll)"
                                                    className="w-36 sm:w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setWork({
                                                            ...work,
                                                            personels: work.personels.filter(
                                                                (_, x) => x !== i,
                                                            ),
                                                        })
                                                    }
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addPersonel}
                                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Tambah Personel
                                    </button>
                                </div>

                                <div className="pt-2">
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={work.butuh_sparepart}
                                            onChange={(e) =>
                                                setWork({
                                                    ...work,
                                                    butuh_sparepart: e.target.checked,
                                                })
                                            }
                                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                        />
                                        Servis butuh sparepart (lanjut ke pengadaan)
                                    </label>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Wrench className="w-4 h-4" />
                                        Mulai / Perbarui Pengerjaan
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Bagian 4 — Sparepart & Complete */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <SectionTitle
                            number={4}
                            title="Pengadaan & Penyelesaian"
                            desc="Sparepart (Inventory) & penyelesaian servis."
                        />

                        <dl className="mt-2">
                            <Row
                                label="Status Pengadaan"
                                value={pengajuan.status_pengadaan_sparepart || "-"}
                            />
                            <Row
                                label="Total Biaya"
                                value={`Rp ${Number(pengajuan.total_biaya || 0).toLocaleString("id-ID")}`}
                            />
                            <Row
                                label="Selesai"
                                value={formatTanggal(pengajuan.tanggal_selesai)}
                            />
                        </dl>

                        {(pengajuan.spareparts?.length > 0 || can.requestSparepart) && (
                            <div className="mt-5 border-t border-gray-100 pt-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <PackageSearch className="w-4 h-4 text-amber-600" />
                                    Daftar Sparepart
                                </h4>

                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3.5 py-2.5 text-left font-semibold text-gray-600">
                                                    Item
                                                </th>
                                                <th className="px-3.5 py-2.5 text-right font-semibold text-gray-600">
                                                    Jumlah
                                                </th>
                                                <th className="px-3.5 py-2.5 text-right font-semibold text-gray-600">
                                                    Nominal
                                                </th>
                                                <th className="px-3.5 py-2.5 text-center font-semibold text-gray-600">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {pengajuan.spareparts?.map((s) => (
                                                <tr key={s.id} className="hover:bg-gray-50/50">
                                                    <td className="px-3.5 py-2.5 font-medium text-gray-900">
                                                        {s.nama_item}
                                                        {s.satuan && (
                                                            <span className="text-gray-400 font-normal">
                                                                {" "} ({s.satuan})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-right tabular-nums text-gray-700">
                                                        {s.jumlah}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-right tabular-nums text-gray-700">
                                                        Rp {Number(s.nominal || 0).toLocaleString("id-ID")}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                                                    <td
                                                        colSpan={4}
                                                        className="px-3.5 py-4 text-center text-gray-400"
                                                    >
                                                        Belum ada item sparepart.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Form Request Sparepart */}
                                {can.requestSparepart && (
                                    <form
                                        onSubmit={doRequestSparepart}
                                        className="mt-5 rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
                                    >
                                        <h5 className="text-sm font-semibold text-gray-800">
                                            Ajukan Kebutuhan Sparepart
                                        </h5>

                                        <div className="space-y-2">
                                            {items.map((it, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-2"
                                                >
                                                    <input
                                                        value={it.nama_item}
                                                        onChange={(e) => {
                                                            const n = [...items];
                                                            n[i].nama_item = e.target.value;
                                                            setItems(n);
                                                        }}
                                                        placeholder="Nama sparepart"
                                                        className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={it.jumlah}
                                                        onChange={(e) => {
                                                            const n = [...items];
                                                            n[i].jumlah = e.target.value;
                                                            setItems(n);
                                                        }}
                                                        placeholder="Qty"
                                                        className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                    />
                                                    <input
                                                        value={it.satuan}
                                                        onChange={(e) => {
                                                            const n = [...items];
                                                            n[i].satuan = e.target.value;
                                                            setItems(n);
                                                        }}
                                                        placeholder="Satuan (Pcs, Set, dll)"
                                                        className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setItems(items.filter((_, x) => x !== i))
                                                        }
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Tambah Item
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                <PackageSearch className="w-4 h-4" />
                                                Ajukan ke Inventory
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Record Pengadaan (Inventory) */}
                                {can.recordSparepart && records.length > 0 && (
                                    <form
                                        onSubmit={doRecordSparepart}
                                        className="mt-5 rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
                                    >
                                        <h5 className="text-sm font-semibold text-gray-800">
                                            Catat Pengadaan (Inventory)
                                        </h5>

                                        <div className="space-y-2">
                                            {records.map((r, i) => (
                                                <div
                                                    key={r.id}
                                                    className="flex items-center gap-3"
                                                >
                                                    <span className="flex-1 min-w-0 text-sm font-medium text-gray-700 truncate">
                                                        {pengajuan.spareparts.find((s) => s.id === r.id)?.nama_item}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={r.nominal}
                                                        onChange={(e) => {
                                                            const n = [...records];
                                                            n[i].nominal = e.target.value;
                                                            setRecords(n);
                                                        }}
                                                        placeholder="Nominal (Rp)"
                                                        className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {errors["items.0.nominal"] && (
                                            <p className="text-xs text-red-600">
                                                {errors["items.0.nominal"]}
                                            </p>
                                        )}

                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
                                            >
                                                <Check className="w-4 h-4" />
                                                Catat Pengadaan & Siapkan
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Complete Section */}
                        {can.complete && (
                            <div className="mt-5 border-t border-gray-100 pt-4 space-y-3">
                                <h5 className="text-sm font-semibold text-gray-800">
                                    Selesaikan Servis
                                </h5>

                                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total Biaya Akhir (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue={pengajuan.total_biaya || 0}
                                            id="total_biaya"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            post(
                                                route("fleet.servis-armada.complete", pengajuan.id),
                                                {
                                                    total_biaya: document.getElementById("total_biaya").value,
                                                    tanggal_selesai_kerja: new Date().toISOString().slice(0, 10),
                                                },
                                            )
                                        }
                                        disabled={processing}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50 shrink-0"
                                    >
                                        <ClipboardCheck className="w-4 h-4" />
                                        Selesaikan Servis
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}