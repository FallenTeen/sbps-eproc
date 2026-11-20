import React, { useEffect, useState } from "react";
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
import TimelineStrip from "@/Components/Fleet/TimelineStrip";
import RelatedLinks from "@/Components/Fleet/RelatedLinks";
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

const INPUT_CLS =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

// Tanggal lokal (YYYY-MM-DD). toISOString() memakai UTC, sehingga di WIB
// sebelum jam 07:00 hasilnya mundur satu hari.
const todayLocal = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const emptyItem = () => ({
    bahan_baku_id: "",
    nama_item: "",
    jumlah: 1,
    satuan: "",
    nominal: 0,
    manual: false,
});

const toRecords = (spareparts = []) =>
    spareparts.map((s) => ({
        id: s.id,
        nominal: Number(s.nominal || 0),
        jumlah: Number(s.jumlah || 1),
        fotos: "",
    }));

// Laravel menserialisasi relasi sebagai snake_case (bahan_baku).
const sparepartName = (s) =>
    s?.bahan_baku?.nama || s?.bahanBaku?.nama || s?.nama_item || "-";

function SectionTitle({ title, desc }) {
    return (
        <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {desc && <p className="mt-1 text-sm text-gray-500">{desc}</p>}
        </div>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                {value || "-"}
            </p>
        </div>
    );
}

function Row({ label, value }) {
    const empty =
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);

    return (
        <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="col-span-2 text-sm text-gray-900">
                {empty ? "-" : value}
            </dd>
        </div>
    );
}

export default function Show({
    pengajuan,
    timeline = [],
    can = {},
    masterSpareparts = [],
    related_links = [],
}) {
    const meta = STATUS_META[pengajuan.status] || {
        label: pengajuan.status,
        cls: "bg-gray-100 text-gray-600",
    };

    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState("Servis");

    const tabs = [
        { key: "Servis", label: "Detail Servis & Timeline" },
        { key: "detail", label: "Detail Servis" },
        { key: "timeline", label: "Timeline" },
    ];

    const summaryPanel = (
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3">
            <SummaryItem
                label="Armada"
                value={`${pengajuan.armada?.plat_nomor || "-"} (${pengajuan.armada?.kode_unit || "-"})`}
            />
            <SummaryItem
                label="Tanggal Ajuan"
                value={formatTanggal(pengajuan.tanggal_ajuan)}
            />
            <SummaryItem
                label="Diajukan Oleh"
                value={pengajuan.diajukan_oleh?.name}
            />
            <SummaryItem
                label="Status Pengadaan"
                value={pengajuan.status_pengadaan_sparepart}
            />
            <SummaryItem
                label="Total Biaya"
                value={`Rp ${Number(pengajuan.total_biaya || 0).toLocaleString("id-ID")}`}
            />
            <SummaryItem label="Kode Pengajuan" value={pengajuan.kode_pengajuan} />
        </div>
    );

    const timelinePanel = (
        <div>
            {timeline.length > 0 ? (
                <TimelineStrip events={timeline} title="Timeline Servis" />
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                    Timeline belum tersedia untuk pengajuan ini.
                </div>
            )}
        </div>
    );

    // Bagian 2 - approval
    const [approve, setApprove] = useState({ catatan_acc: "" });

    // Bagian 3 - workshop pengerjaan (prefill dari data yang sudah ada)
    const [work, setWork] = useState({
        tanggal_mulai_kerja: pengajuan.tanggal_mulai_kerja || todayLocal(),
        tanggal_selesai_kerja: pengajuan.tanggal_selesai_kerja || "",
        catatan_pengerjaan: pengajuan.catatan_pengerjaan || "",
        butuh_sparepart: !!pengajuan.butuh_sparepart,
        personels: pengajuan.personels?.length
            ? pengajuan.personels.map((p) => ({
                  nama_personel: p.nama_personel || "",
                  peran: p.peran || "",
              }))
            : [{ nama_personel: "", peran: "" }],
    });

    // Bagian 3 - request sparepart
    const [items, setItems] = useState([emptyItem()]);

    // Bagian 4 - record pengadaan sparepart (Inventory)
    const [records, setRecords] = useState(toRecords(pengajuan.spareparts));

    // Sinkronkan ulang setelah Inertia memuat props baru (useState hanya
    // membaca nilai awal sekali, jadi tanpa ini form masih berisi data lama).
    useEffect(() => {
        setRecords(toRecords(pengajuan.spareparts));
    }, [pengajuan.spareparts]);

    const [totalBiaya, setTotalBiaya] = useState(pengajuan.total_biaya || 0);
    useEffect(() => {
        setTotalBiaya(pengajuan.total_biaya || 0);
    }, [pengajuan.total_biaya]);

    const post = (url, data, options = {}) => {
        setErrors({});
        setProcessing(true);
        router.post(url, data, {
            preserveScroll: true,
            onError: (err) => setErrors(err),
            onSuccess: options.onSuccess,
            onFinish: () => setProcessing(false),
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
        post(
            route("fleet.servis-armada.request-sparepart", pengajuan.id),
            {
                // buang flag UI "manual" sebelum dikirim
                items: items.map(({ manual, ...rest }) => rest),
            },
            { onSuccess: () => setItems([emptyItem()]) },
        );
    };

    const doRecordSparepart = (e) => {
        e.preventDefault();
        post(route("fleet.servis-armada.record-sparepart", pengajuan.id), {
            items: records,
        });
    };

    const doComplete = () => {
        post(route("fleet.servis-armada.complete", pengajuan.id), {
            total_biaya: totalBiaya,
            tanggal_selesai_kerja: todayLocal(),
        });
    };

    // ---- helper update state secara immutable ----
    const updatePersonel = (index, field, value) =>
        setWork((w) => ({
            ...w,
            personels: w.personels.map((p, i) =>
                i === index ? { ...p, [field]: value } : p,
            ),
        }));

    const addPersonel = () =>
        setWork((w) => ({
            ...w,
            personels: [...w.personels, { nama_personel: "", peran: "" }],
        }));

    const removePersonel = (index) =>
        setWork((w) => ({
            ...w,
            personels: w.personels.filter((_, i) => i !== index),
        }));

    const updateItem = (index, patch) =>
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        );

    const addItem = () => setItems((prev) => [...prev, emptyItem()]);

    const removeItem = (index) =>
        setItems((prev) => {
            const next = prev.filter((_, i) => i !== index);
            return next.length ? next : [emptyItem()];
        });

    const handleSelectSparepart = (index, value) => {
        if (value === "__manual__") {
            updateItem(index, {
                bahan_baku_id: "",
                nama_item: "",
                satuan: "",
                manual: true,
            });
            return;
        }

        // Bandingkan sebagai string: value dari <select> selalu string,
        // sedangkan id master bisa berupa number.
        const master = masterSpareparts.find(
            (s) => String(s.id) === String(value),
        );

        updateItem(index, {
            bahan_baku_id: master?.id ?? "",
            nama_item: master?.nama ?? "",
            satuan: master?.satuan ?? "",
            manual: false,
        });
    };

    const updateRecord = (index, nominal) =>
        setRecords((prev) =>
            prev.map((r, i) => (i === index ? { ...r, nominal } : r)),
        );

    // Ambil pesan error pertama untuk form berisi array (items.0.nama_item, dst.)
    const firstErrorFor = (prefix) => {
        const key = Object.keys(errors).find(
            (k) => k === prefix || k.startsWith(`${prefix}.`),
        );
        return key ? errors[key] : null;
    };

    return (
        <AuthenticatedLayout>
            <Head title={pengajuan.kode_pengajuan} />

            <div className="space-y-6 py-6">
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
                            Informasi pengajuan, persetujuan, pengerjaan, dan
                            penyelesaian servis.
                        </p>
                    </div>

                    <Link
                        href={route("fleet.servis-armada.index")}
                        className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Daftar
                    </Link>
                </div>

                <div className="flex gap-6 border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            aria-pressed={activeTab === tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                                activeTab === tab.key
                                    ? "border-gray-900 text-gray-900"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {summaryPanel}
                <RelatedLinks items={related_links} />

                {activeTab === "timeline" ? (
                    timelinePanel
                ) : (
                <div
                    className={
                        activeTab === "Servis"
                            ? "grid grid-cols-1 gap-6 xl:grid-cols-3"
                            : "space-y-6"
                    }
                >
                    <div
                        className={
                            activeTab === "Servis"
                                ? "space-y-6 xl:col-span-2"
                                : "space-y-6"
                        }
                    >
                        {/* Bagian 1 - Ajuan */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <SectionTitle
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

                    {/* Bagian 2 - Approval */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <SectionTitle
                            title="Approval"
                            desc="ACC / tolak oleh Ketua Divisi Armada."
                        />

                        <dl className="mt-2">
                            <Row
                                label="Catatan ACC"
                                value={pengajuan.catatan_acc}
                            />
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
                                            setApprove({
                                                catatan_acc: e.target.value,
                                            })
                                        }
                                        rows={2}
                                        placeholder="Berikan catatan persetujuan atau penolakan..."
                                        className={INPUT_CLS}
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
                                        <CheckCircle2 className="w-4 h-4" />{" "}
                                        Setujui
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bagian 3 - Pengerjaan */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <SectionTitle
                            title="Pengerjaan Workshop"
                            desc="Assign personel & catat pengerjaan oleh Workshop."
                        />

                        <div className="mt-2">
                            <Row
                                label="Mulai Kerja"
                                value={formatTanggal(
                                    pengajuan.tanggal_mulai_kerja,
                                )}
                            />
                            <Row
                                label="Selesai Kerja"
                                value={formatTanggal(
                                    pengajuan.tanggal_selesai_kerja,
                                )}
                            />
                            <Row
                                label="Catatan Pengerjaan"
                                value={pengajuan.catatan_pengerjaan}
                            />
                            <Row
                                label="Butuh Sparepart"
                                value={
                                    pengajuan.butuh_sparepart ? "Ya" : "Tidak"
                                }
                            />
                            <Row
                                label="Nama Personel"
                                value={
                                    pengajuan.personels?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {pengajuan.personels.map((pe) => (
                                                <span
                                                    key={pe.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-medium"
                                                >
                                                    <User className="w-3 h-3 text-amber-600" />
                                                    {pe.nama_personel}
                                                    {pe.peran
                                                        ? ` (${pe.peran})`
                                                        : ""}
                                                </span>
                                            ))}
                                        </div>
                                    )
                                }
                            />
                        </div>

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
                                                    tanggal_mulai_kerja:
                                                        e.target.value,
                                                })
                                            }
                                            className={INPUT_CLS}
                                        />
                                        {errors.tanggal_mulai_kerja && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.tanggal_mulai_kerja}
                                            </p>
                                        )}
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
                                                    tanggal_selesai_kerja:
                                                        e.target.value,
                                                })
                                            }
                                            className={INPUT_CLS}
                                        />
                                        {errors.tanggal_selesai_kerja && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.tanggal_selesai_kerja}
                                            </p>
                                        )}
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
                                                catatan_pengerjaan:
                                                    e.target.value,
                                            })
                                        }
                                        rows={2}
                                        placeholder="Tambahkan instruksi / catatan pengerjaan..."
                                        className={INPUT_CLS}
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
                                                    onChange={(e) =>
                                                        updatePersonel(
                                                            i,
                                                            "nama_personel",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Nama personel"
                                                    className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                />
                                                <input
                                                    value={pe.peran}
                                                    onChange={(e) =>
                                                        updatePersonel(
                                                            i,
                                                            "peran",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Peran (Mekanik, dll)"
                                                    className="w-36 sm:w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removePersonel(i)
                                                    }
                                                    aria-label="Hapus personel"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {firstErrorFor("personels") && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {firstErrorFor("personels")}
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={addPersonel}
                                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Tambah
                                        Personel
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
                                                    butuh_sparepart:
                                                        e.target.checked,
                                                })
                                            }
                                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                        />
                                        Servis butuh sparepart (lanjut ke
                                        pengadaan)
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

                    {/* Bagian 4 - Sparepart & Complete */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <SectionTitle
                            title="Pengadaan & Penyelesaian"
                            desc="Sparepart (Inventory) & penyelesaian servis."
                        />

                        <dl className="mt-2">
                            <Row
                                label="Status Pengadaan"
                                value={pengajuan.status_pengadaan_sparepart}
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

                        {(pengajuan.spareparts?.length > 0 ||
                            can.requestSparepart) && (
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
                                                <tr
                                                    key={s.id}
                                                    className="hover:bg-gray-50/50"
                                                >
                                                    <td className="px-3.5 py-2.5 font-medium text-gray-900">
                                                        {sparepartName(s)}
                                                        {s.satuan && (
                                                            <span className="text-gray-400 font-normal">
                                                                {" "}
                                                                ({s.satuan})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-right tabular-nums text-gray-700">
                                                        {s.jumlah}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-right tabular-nums text-gray-700">
                                                        Rp{" "}
                                                        {Number(
                                                            s.nominal || 0,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                s.status ===
                                                                "tersedia"
                                                                    ? "bg-teal-100 text-teal-700"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                        >
                                                            {s.status ===
                                                            "tersedia"
                                                                ? "Tersedia"
                                                                : "Diajukan"}
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
                                                        Belum ada item
                                                        sparepart.
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
                                                    className="flex flex-wrap sm:flex-nowrap items-center gap-2"
                                                >
                                                    <select
                                                        value={
                                                            it.bahan_baku_id ||
                                                            (it.manual
                                                                ? "__manual__"
                                                                : "")
                                                        }
                                                        onChange={(e) =>
                                                            handleSelectSparepart(
                                                                i,
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                    >
                                                        <option value="">
                                                            Pilih sparepart
                                                        </option>
                                                        {masterSpareparts
                                                            .filter(
                                                                (s) =>
                                                                    !s.sparepart_untuk ||
                                                                    s.sparepart_untuk ===
                                                                        "armada",
                                                            )
                                                            .map((s) => (
                                                                <option
                                                                    key={s.id}
                                                                    value={s.id}
                                                                >
                                                                    {s.nama}
                                                                    {s.satuan
                                                                        ? ` (${s.satuan})`
                                                                        : ""}
                                                                </option>
                                                            ))}
                                                        <option value="__manual__">
                                                            Lainnya (ketik
                                                            manual)
                                                        </option>
                                                    </select>
                                                    {it.manual && (
                                                        <input
                                                            value={it.nama_item}
                                                            onChange={(e) =>
                                                                updateItem(i, {
                                                                    nama_item:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="Nama sparepart"
                                                            className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                        />
                                                    )}
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={it.jumlah}
                                                        onChange={(e) =>
                                                            updateItem(i, {
                                                                jumlah: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        placeholder="Qty"
                                                        className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                    />
                                                    <input
                                                        value={it.satuan}
                                                        onChange={(e) =>
                                                            updateItem(i, {
                                                                satuan: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        placeholder="Satuan (Pcs, Set, dll)"
                                                        className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeItem(i)
                                                        }
                                                        aria-label="Hapus item"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {firstErrorFor("items") && (
                                            <p className="text-xs text-red-600">
                                                {firstErrorFor("items")}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between pt-1">
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition"
                                            >
                                                <Plus className="w-3.5 h-3.5" />{" "}
                                                Tambah Item
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
                                                        {sparepartName(
                                                            pengajuan.spareparts.find(
                                                                (s) =>
                                                                    s.id ===
                                                                    r.id,
                                                            ),
                                                        )}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={r.nominal}
                                                        onChange={(e) =>
                                                            updateRecord(
                                                                i,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Nominal (Rp)"
                                                        className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* tampilkan error nominal untuk item mana pun, bukan hanya index 0 */}
                                        {Object.entries(errors)
                                            .filter(([k]) =>
                                                /^items\.\d+\./.test(k),
                                            )
                                            .map(([k, msg]) => (
                                                <p
                                                    key={k}
                                                    className="text-xs text-red-600"
                                                >
                                                    {msg}
                                                </p>
                                            ))}

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
                                        <label
                                            htmlFor="total_biaya"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Total Biaya Akhir (Rp)
                                        </label>
                                        <input
                                            id="total_biaya"
                                            type="number"
                                            min={0}
                                            value={totalBiaya}
                                            onChange={(e) =>
                                                setTotalBiaya(e.target.value)
                                            }
                                            className={INPUT_CLS}
                                        />
                                        {errors.total_biaya && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.total_biaya}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={doComplete}
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
                    {activeTab === "Servis" && (
                        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                            {timelinePanel}
                        </aside>
                    )}
                </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
