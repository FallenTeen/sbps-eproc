import React, { useState, useEffect } from "react";
import { Link, useForm, router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { formatTanggal } from "@/utils/date";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Play,
    Square,
    UserPlus,
    Fuel,
    Wrench,
    ClipboardCheck,
    Clock,
    Users,
    Truck,
    Edit,
    FileText,
    X,
    Trash,
} from "lucide-react";

const JENIS = {
    dump_truck: "Dump Truck",
    dump_truck_tronton: "Dump Truck Tronton",
    self_loader: "Self Loader",
    alat_berat: "Alat Berat",
    truck_molen: "Truck Molen",
    lainnya: "Lainnya",
};

const JENIS_DOKUMEN = {
    pajak_tahunan: "Pajak Tahunan",
    stnk_5_tahunan: "STNK 5 Tahunan",
    kir: "KIR",
};

const MODEL_TARIF = {
    ritase: "Ritase",
    sewa_jam: "Sewa / Jam",
    internal: "Internal",
};

const STATUS = {
    aktif: "bg-green-100 text-green-800 border-green-300",
    servis: "bg-amber-100 text-amber-800 border-amber-300",
    nonaktif: "bg-red-100 text-red-800 border-red-300",
};

const BIAYA_JENIS = {
    bbm: "BBM",
    upah_kenek: "Upah Kenek",
    uang_makan: "Uang Makan",
    insentif: "Insentif",
    standby: "Standby",
    lainnya: "Lainnya",
};

function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(!!flash?.success);

    useEffect(() => {
        if (flash?.success) setVisible(true);
    }, [flash]);

    if (!visible || !flash?.success) return null;
    return (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex justify-between items-center shadow-sm">
            <span className="text-sm font-medium">{flash.success}</span>
            <button
                onClick={() => setVisible(false)}
                className="text-green-600 hover:text-green-800 p-1"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                {label}
            </label>
            {children}
            {error && (
                <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>
            )}
        </div>
    );
}

const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none bg-gray-50/50 focus:bg-white";
const btnPrimary =
    "px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

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
                className={`w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all`}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
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

function Tabs({ tabs, active, onChange }) {
    return (
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <nav className="flex gap-2 min-w-max pb-1">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => onChange(t.key)}
                        className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 border-b-2 -mb-1 ${
                            active === t.key
                                ? "border-blue-600 text-blue-600 bg-blue-50/50 font-semibold"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}

function DokumenSection({ armada, canManage }) {
    const [viewing, setViewing] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        jenis: "pajak_tahunan",
        nomor_dokumen: "",
        tanggal_terbit: "",
        tanggal_jatuh_tempo: "",
        nominal_biaya: "",
        scan_dokumen: null,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route("fleet.armada.dokumen-berkala.store", armada.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset(
                    "nomor_dokumen",
                    "tanggal_terbit",
                    "tanggal_jatuh_tempo",
                    "nominal_biaya",
                    "scan_dokumen",
                );
                setIsModalOpen(false);
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Dokumen Armada</span>
                </h3>
                {canManage && (
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={route("fleet.dokumen-berkala.index")}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                            <FileText className="h-4 w-4" />
                            <span>Buka pemantauan semua dokumen armada</span>
                        </Link>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={btnPrimary + " flex items-center gap-2"}
                        >
                            <Plus className="h-4 w-4" />
                            <span>Input Dokumen</span>
                        </button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Input Dokumen Armada"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Jenis Dokumen" error={errors.jenis}>
                            <select
                                value={data.jenis}
                                onChange={(e) =>
                                    setData("jenis", e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="pajak_tahunan">
                                    Pajak Tahunan
                                </option>
                                <option value="stnk_5_tahunan">
                                    STNK 5 Tahunan
                                </option>
                                <option value="kir">KIR</option>
                            </select>
                        </Field>
                        <Field
                            label="Nomor Dokumen"
                            error={errors.nomor_dokumen}
                        >
                            <input
                                value={data.nomor_dokumen}
                                onChange={(e) =>
                                    setData("nomor_dokumen", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field
                            label="Tanggal Terbit"
                            error={errors.tanggal_terbit}
                        >
                            <input
                                type="date"
                                value={data.tanggal_terbit}
                                onChange={(e) =>
                                    setData("tanggal_terbit", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field
                            label="Tanggal Jatuh Tempo"
                            error={errors.tanggal_jatuh_tempo}
                        >
                            <input
                                type="date"
                                value={data.tanggal_jatuh_tempo}
                                onChange={(e) =>
                                    setData(
                                        "tanggal_jatuh_tempo",
                                        e.target.value,
                                    )
                                }
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field label="Biaya (Rp)" error={errors.nominal_biaya}>
                            <input
                                type="number"
                                min="0"
                                value={data.nominal_biaya}
                                onChange={(e) =>
                                    setData("nominal_biaya", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field
                            label="Scan Dokumen (PDF/JPG/PNG)"
                            error={errors.scan_dokumen}
                        >
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) =>
                                    setData(
                                        "scan_dokumen",
                                        e.target.files[0] || null,
                                    )
                                }
                                className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-gray-50"
                            />
                        </Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={btnPrimary}
                        >
                            {processing ? "Menyimpan..." : "Simpan Dokumen"}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/70">
                        <tr>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Jenis
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Nomor
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Terbit
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Jatuh Tempo
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Dokumen
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {armada.dokumen_berkalas?.length ? (
                            armada.dokumen_berkalas.map((dokumen) => (
                                <tr
                                    key={dokumen.id}
                                    className="hover:bg-gray-50/50"
                                >
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {JENIS_DOKUMEN[dokumen.jenis] ||
                                            dokumen.jenis ||
                                            "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {dokumen.nomor_dokumen || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatTanggal(
                                            dokumen.tanggal_terbit,
                                        ) || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatTanggal(
                                            dokumen.tanggal_jatuh_tempo,
                                        ) || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                dokumen.status_dokumen
                                                    ?.toLowerCase()
                                                    .includes("akan")
                                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                    : dokumen.status_dokumen?.toLowerCase() ===
                                                        "aktif"
                                                      ? "bg-green-50 text-green-700 border-green-200"
                                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                            }`}
                                        >
                                            {dokumen.status_dokumen?.replaceAll(
                                                "_",
                                                " ",
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <button
                                            type="button"
                                            onClick={() => setViewing(dokumen)}
                                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            <FileText className="h-4 w-4" />{" "}
                                            Lihat Dokumen
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="px-4 py-8 text-center text-sm text-gray-500"
                                >
                                    Belum ada dokumen untuk unit armada ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Modal
                isOpen={!!viewing}
                onClose={() => setViewing(null)}
                title="Detail Dokumen Armada"
            >
                {viewing && (
                    <div>
                        <p className="text-sm text-gray-500 mb-4">
                            {viewing.jenis_label}
                        </p>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <dt className="text-gray-500 text-xs uppercase font-bold">
                                    Nomor Dokumen
                                </dt>
                                <dd className="mt-1 font-semibold text-gray-900">
                                    {viewing.nomor_dokumen || "-"}
                                </dd>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <dt className="text-gray-500 text-xs uppercase font-bold">
                                    Jatuh Tempo
                                </dt>
                                <dd className="mt-1 font-semibold text-gray-900">
                                    {formatTanggal(
                                        viewing.tanggal_jatuh_tempo,
                                    ) || "-"}
                                </dd>
                            </div>
                            <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <dt className="text-gray-500 text-xs uppercase font-bold">
                                    Scan Dokumen
                                </dt>
                                <dd className="mt-2">
                                    {viewing.scan_dokumen_url ? (
                                        <a
                                            href={viewing.scan_dokumen_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
                                        >
                                            <FileText className="h-4 w-4" />{" "}
                                            Buka Scan Dokumen
                                        </a>
                                    ) : (
                                        <span className="text-gray-500 italic text-xs">
                                            Scan dokumen belum diunggah.
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function RitaseSection({ armada, options, can }) {
    const canRecord = can ? can.recordRitase : true;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            driver_karyawan_id: "",
            tanggal: new Date().toISOString().split("T")[0],
            rute_tarif_id: "",
            kategori: "",
            material: "",
            jumlah_rit: "",
            tarif_per_rit_snapshot: "",
            proyek_id: "",
            titik_id: "",
            customer: "",
            catatan: "",
            biaya_lain: [],
        });

    const onRuteChange = (e) => {
        const id = e.target.value;
        const rute = options.ruteTarifs.find((r) => r.id === id);
        setData({
            ...data,
            rute_tarif_id: id,
            tarif_per_rit_snapshot: rute ? rute.tarif_per_rit : "",
        });
    };

    const addBiaya = () => {
        setData("biaya_lain", [
            ...data.biaya_lain,
            { jenis: "bbm", jumlah: "", catatan: "" },
        ]);
    };

    const updateBiaya = (index, field, value) => {
        const list = [...data.biaya_lain];
        list[index][field] = value;
        setData("biaya_lain", list);
    };

    const removeBiaya = (index) => {
        setData(
            "biaya_lain",
            data.biaya_lain.filter((_, i) => i !== index),
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-ritase", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsModalOpen(false);
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" /> Riwayat Ritase
                </h3>
                {canRecord && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={btnPrimary + " flex items-center gap-2"}
                    >
                        <Plus className="w-4 h-4" /> Catat Ritase
                    </button>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Catat Ritase"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Driver *"
                            error={errors.driver_karyawan_id}
                        >
                            <select
                                value={data.driver_karyawan_id}
                                onChange={(e) =>
                                    setData(
                                        "driver_karyawan_id",
                                        e.target.value,
                                    )
                                }
                                className={inputClass}
                            >
                                <option value="">Pilih Driver</option>
                                {options.drivers.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.nama}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Tanggal *" error={errors.tanggal}>
                            <input
                                type="date"
                                value={data.tanggal}
                                onChange={(e) =>
                                    setData("tanggal", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Rute Tarif" error={errors.rute_tarif_id}>
                            <select
                                value={data.rute_tarif_id}
                                onChange={onRuteChange}
                                className={inputClass}
                            >
                                <option value="">Pilih Rute</option>
                                {options.ruteTarifs.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.lokasi_asal} → {r.lokasi_tujuan}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            label="Tarif / Rit (manual jika tanpa rute)"
                            error={errors.tarif_per_rit_snapshot}
                        >
                            <input
                                type="number"
                                step="0.01"
                                value={data.tarif_per_rit_snapshot}
                                onChange={(e) =>
                                    setData(
                                        "tarif_per_rit_snapshot",
                                        e.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Jumlah Rit *" error={errors.jumlah_rit}>
                            <input
                                type="number"
                                min="1"
                                value={data.jumlah_rit}
                                onChange={(e) =>
                                    setData("jumlah_rit", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Satuan Volume *">
                            <select
                                value={data.satuan_volume}
                                onChange={(e) =>
                                    setData("satuan_volume", e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="">Pilih Volume</option>
                                <option value="tonase">Tonase</option>
                                <option value="ritase">Ritase</option>
                                <option value="m3">m³</option>
                                <option value="harian">Harian</option>
                            </select>
                        </Field>
                        <Field label="Kategori">
                            <input
                                type="text"
                                value={data.kategori}
                                onChange={(e) =>
                                    setData("kategori", e.target.value)
                                }
                                placeholder="batu pecah, pasir"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Material">
                            <input
                                type="text"
                                value={data.material}
                                onChange={(e) =>
                                    setData("material", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Proyek">
                            <select
                                value={data.proyek_id}
                                onChange={(e) =>
                                    setData("proyek_id", e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="">Pilih Proyek</option>
                                {options.proyeks.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Titik">
                            <select
                                value={data.titik_id}
                                onChange={(e) =>
                                    setData("titik_id", e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="">Pilih Titik</option>
                                {options.titiks.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nama}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <div className="md:col-span-2">
                            <Field label="Customer">
                                <input
                                    type="text"
                                    value={data.customer}
                                    onChange={(e) =>
                                        setData("customer", e.target.value)
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                                Biaya Lain
                            </label>
                            <button
                                type="button"
                                onClick={addBiaya}
                                className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Tambah Biaya
                            </button>
                        </div>
                        {data.biaya_lain.map((b, i) => (
                            <div
                                key={i}
                                className="flex gap-2 items-center mb-2"
                            >
                                <select
                                    value={b.jenis}
                                    onChange={(e) =>
                                        updateBiaya(i, "jenis", e.target.value)
                                    }
                                    className="w-1/3 border border-gray-300 rounded-lg px-2.5 py-2 text-sm bg-gray-50"
                                >
                                    {Object.entries(BIAYA_JENIS).map(
                                        ([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ),
                                    )}
                                </select>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={b.jumlah}
                                    onChange={(e) =>
                                        updateBiaya(i, "jumlah", e.target.value)
                                    }
                                    placeholder="Jumlah"
                                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-2 text-sm bg-gray-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeBiaya(i)}
                                    className="text-red-500 hover:text-red-700 p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <Field label="Catatan">
                        <textarea
                            rows="2"
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            className={inputClass}
                        />
                    </Field>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={btnPrimary}
                        >
                            {processing ? "Menyimpan..." : "Simpan Ritase"}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {armada.ritases.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        Belum ada ritase tercatat
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/70">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Driver
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Rute
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Rit
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Tarif
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {armada.ritases.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                                        {formatTanggal(r.tanggal)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {r.driver?.nama || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {r.rute_tarif
                                            ? `${r.rute_tarif.lokasi_asal} → ${r.rute_tarif.lokasi_tujuan}`
                                            : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                        {r.jumlah_rit}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                        Rp{" "}
                                        {Number(
                                            r.tarif_per_rit_snapshot,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                        Rp{" "}
                                        {Number(
                                            r.total_upah_rit,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                                                String(
                                                    r.status,
                                                ).toLowerCase() === "draft"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : String(
                                                            r.status,
                                                        ).toLowerCase() ===
                                                        "disetujui"
                                                      ? "bg-green-100 text-green-700"
                                                      : String(
                                                              r.status,
                                                          ).toLowerCase() ===
                                                          "ditagih"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function SewaSection({ armada, options, can }) {
    const canRecord = can ? can.recordSewa : true;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            proyek_id: "",
            tipe_sewa: "",
            penyewa_nama: "",
            penyewa_eksternal: "",
            lokasi_pekerjaan: "",
            harga_per_jam_snapshot: "",
            tanggal: new Date().toISOString().split("T")[0],
            hm_awal: "",
            hm_akhir: "",
            jumlah_jam: "",
            catatan: "",
        });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-sewa", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsModalOpen(false);
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" /> Riwayat Sewa
                    Alat
                </h3>
                {canRecord && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={btnPrimary + " flex items-center gap-2"}
                    >
                        <Plus className="w-4 h-4" /> Catat Sewa Alat
                    </button>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Catat Sewa Alat"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Proyek">
                            <select
                                value={data.proyek_id}
                                onChange={(e) =>
                                    setData("proyek_id", e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="">Pilih Proyek</option>
                                {options.proyeks.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Tipe Sewa">
                            <select
                                value={data.tipe_sewa}
                                onChange={(e) =>
                                    setData("tipe_sewa", e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="">Pilih Tipe Sewa</option>
                                <option value="internal">Internal</option>
                                <option value="eksternal">Eksternal</option>
                            </select>
                        </Field>
                        {data.tipe_sewa === "eksternal" && (
                            <Field
                                label="Nama Penyewa"
                                error={errors.penyewa_nama}
                            >
                                <input
                                    type="text"
                                    value={data.penyewa_nama}
                                    onChange={(e) =>
                                        setData("penyewa_nama", e.target.value)
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        )}
                        <Field label="Penyewa Eksternal">
                            <input
                                type="text"
                                value={data.penyewa_eksternal}
                                onChange={(e) =>
                                    setData("penyewa_eksternal", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Lokasi Pekerjaan">
                            <input
                                type="text"
                                value={data.lokasi_pekerjaan}
                                onChange={(e) =>
                                    setData("lokasi_pekerjaan", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field
                            label="Harga / Jam *"
                            error={errors.harga_per_jam_snapshot}
                        >
                            <input
                                type="number"
                                step="0.01"
                                value={data.harga_per_jam_snapshot}
                                onChange={(e) =>
                                    setData(
                                        "harga_per_jam_snapshot",
                                        e.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Tanggal *" error={errors.tanggal}>
                            <input
                                type="date"
                                value={data.tanggal}
                                onChange={(e) =>
                                    setData("tanggal", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="HM Awal">
                            <input
                                type="number"
                                step="0.01"
                                value={data.hm_awal}
                                onChange={(e) =>
                                    setData("hm_awal", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="HM Akhir">
                            <input
                                type="number"
                                step="0.01"
                                value={data.hm_akhir}
                                onChange={(e) =>
                                    setData("hm_akhir", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Jumlah Jam *" error={errors.jumlah_jam}>
                            <input
                                type="number"
                                step="0.01"
                                min="0.1"
                                value={data.jumlah_jam}
                                onChange={(e) =>
                                    setData("jumlah_jam", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                    </div>
                    <Field label="Catatan">
                        <textarea
                            rows="2"
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={btnPrimary}
                        >
                            {processing ? "Menyimpan..." : "Simpan Sewa"}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {armada.sewa_alat_jams.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        Belum ada sewa alat tercatat
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/70">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Proyek / Penyewa
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Jam
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Harga/Jam
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {armada.sewa_alat_jams.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                                        {formatTanggal(s.tanggal)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {s.proyek?.nama || s.penyewa_eksternal}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                        {s.jumlah_jam} Jam
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                        Rp{" "}
                                        {Number(
                                            s.harga_per_jam_snapshot,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                        Rp{" "}
                                        {Number(
                                            s.harga_per_jam_snapshot *
                                                s.jumlah_jam,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                                                String(
                                                    s.status,
                                                ).toLowerCase() === "draft"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : String(
                                                            s.status,
                                                        ).toLowerCase() ===
                                                        "disetujui"
                                                      ? "bg-green-100 text-green-700"
                                                      : String(
                                                              s.status,
                                                          ).toLowerCase() ===
                                                          "ditagih"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {s.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function ServiceSection({ armada, options }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            tanggal: new Date().toISOString().split("T")[0],
            jenis_servis: "",
            biaya: "",
            notes: "",
        });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-service", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsModalOpen(false);
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-600" /> Riwayat Servis
                </h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={btnPrimary + " flex items-center gap-2"}
                >
                    <Plus className="w-4 h-4" /> Catat Servis
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Catat Servis"
            >
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Tanggal *" error={errors.tanggal}>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) => setData("tanggal", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Jenis Servis">
                        <input
                            type="text"
                            value={data.jenis_servis}
                            onChange={(e) =>
                                setData("jenis_servis", e.target.value)
                            }
                            placeholder="ganti oli, tune up"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Biaya *" error={errors.biaya}>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.biaya}
                            onChange={(e) => setData("biaya", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Notes">
                        <textarea
                            rows="2"
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={btnPrimary}
                        >
                            {processing ? "Menyimpan..." : "Simpan Servis"}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {armada.service_histories.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        Belum ada riwayat servis
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/70">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Jenis
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Biaya
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Notes
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {armada.service_histories.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                                        {formatTanggal(s.tanggal)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {s.jenis_servis || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                        Rp{" "}
                                        {Number(s.biaya).toLocaleString(
                                            "id-ID",
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {s.notes || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function BbmSection({ armada, options }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            tanggal: new Date().toISOString().split("T")[0],
            liter: "",
            biaya: "",
            jam_operasional_saat_isi: "",
        });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-bbm", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsModalOpen(false);
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-blue-600" /> Riwayat BBM
                </h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={btnPrimary + " flex items-center gap-2"}
                >
                    <Plus className="w-4 h-4" /> Catat BBM
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Catat BBM"
            >
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Tanggal *" error={errors.tanggal}>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) => setData("tanggal", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Liter *" error={errors.liter}>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.liter}
                            onChange={(e) => setData("liter", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Biaya">
                        <input
                            type="number"
                            step="0.01"
                            value={data.biaya}
                            onChange={(e) => setData("biaya", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Jam Operasional Saat Isi">
                        <input
                            type="number"
                            step="0.01"
                            value={data.jam_operasional_saat_isi}
                            onChange={(e) =>
                                setData(
                                    "jam_operasional_saat_isi",
                                    e.target.value,
                                )
                            }
                            className={inputClass}
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={btnPrimary}
                        >
                            {processing ? "Menyimpan..." : "Simpan BBM"}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {armada.bbm_logs.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        Belum ada pengisian BBM
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/70">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Liter
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Biaya
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Jam Operasional
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {armada.bbm_logs.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                                        {formatTanggal(b.tanggal)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                        {Number(b.liter).toLocaleString(
                                            "id-ID",
                                        )}{" "}
                                        L
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                        Rp{" "}
                                        {Number(b.biaya).toLocaleString(
                                            "id-ID",
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                        {b.jam_operasional_saat_isi || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

const BAGIAN_DEFAULT = [
    "Ban",
    "Rem",
    "Lampu",
    "Oli mesin",
    "Air radiator",
    "Body",
    "Kabin",
];

const KONDISI_OPTIONS = [
    { value: "baik", label: "Baik" },
    { value: "perlu_perhatian", label: "Perlu Perhatian" },
    { value: "rusak", label: "Rusak" },
];

function KondisiBadge({ baik }) {
    return (
        <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                baik
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
            }`}
        >
            {baik ? "Baik" : "Masalah"}
        </span>
    );
}

function ItemEditor({ items, setItems }) {
    const update = (idx, key, value) =>
        setItems(
            items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
        );

    return (
        <div className="space-y-2">
            {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={it.bagian}
                        onChange={(e) => update(idx, "bagian", e.target.value)}
                        placeholder="Bagian"
                        className={inputClass + " flex-1"}
                    />
                    <select
                        value={it.kondisi}
                        onChange={(e) => update(idx, "kondisi", e.target.value)}
                        className={inputClass + " w-36"}
                    >
                        {KONDISI_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={it.catatan}
                        onChange={(e) => update(idx, "catatan", e.target.value)}
                        placeholder="Catatan"
                        className={inputClass + " flex-1"}
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setItems(items.filter((_, i) => i !== idx))
                        }
                        className="text-red-500 hover:text-red-700 p-1"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() =>
                    setItems([
                        ...items,
                        { bagian: "", kondisi: "baik", catatan: "" },
                    ])
                }
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-1"
            >
                <Plus className="w-3.5 h-3.5" /> Tambah Bagian
            </button>
        </div>
    );
}

function ChecklistFormModal({ armada, options, tipe, isOpen, onClose }) {
    const isAkhir = tipe === "akhir";
    const isAlatBerat = armada.tipe_unit === "alat_berat";
    const odoKey = isAlatBerat
        ? isAkhir
            ? "hm_akhir"
            : "hm_odo"
        : isAkhir
          ? "odo_akhir"
          : "odo_pagi";
    const jamKey = isAkhir ? "jam_selesai_operasi" : "jam_mulai_operasi";

    const { data, setData, post, processing, errors, reset } = useForm({
        tanggal: new Date().toISOString().split("T")[0],
        stok_solar: "",
        [odoKey]: "",
        [jamKey]: "",
        items: BAGIAN_DEFAULT.map((b) => ({
            bagian: b,
            kondisi: "baik",
            catatan: "",
        })),
        dicatat_oleh_karyawan_id: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(
            route(
                isAkhir
                    ? "fleet.armada.record-checklist-akhir"
                    : "fleet.armada.record-checklist",
                armada.id,
            ),
            {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            },
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isAkhir ? "Checklist Akhir" : "Checklist Awal"}
            maxWidth="max-w-2xl"
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="Tanggal *" error={errors.tanggal}>
                    <input
                        type="date"
                        value={data.tanggal}
                        onChange={(e) => setData("tanggal", e.target.value)}
                        className={inputClass}
                    />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Stok Solar">
                        <select
                            value={data.stok_solar}
                            onChange={(e) =>
                                setData("stok_solar", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">-</option>
                            {(options.stokSolarOptions || []).map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label={isAlatBerat ? "HM" : "ODO"}>
                        <input
                            type="number"
                            step="0.01"
                            value={data[odoKey]}
                            onChange={(e) => setData(odoKey, e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                </div>
                <Field
                    label={
                        isAkhir ? "Jam Selesai Operasi" : "Jam Mulai Operasi"
                    }
                >
                    <input
                        type="time"
                        value={data[jamKey]}
                        onChange={(e) => setData(jamKey, e.target.value)}
                        className={inputClass}
                    />
                </Field>
                <Field label="Kondisi per Bagian">
                    <ItemEditor
                        items={data.items}
                        setItems={(v) => setData("items", v)}
                    />
                </Field>
                <Field
                    label="Dicatat Oleh *"
                    error={errors.dicatat_oleh_karyawan_id}
                >
                    <select
                        value={data.dicatat_oleh_karyawan_id}
                        onChange={(e) =>
                            setData("dicatat_oleh_karyawan_id", e.target.value)
                        }
                        className={inputClass}
                    >
                        <option value="">Pilih Petugas</option>
                        {options.drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.nama}
                            </option>
                        ))}
                    </select>
                </Field>
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className={btnPrimary}
                    >
                        {processing
                            ? "Menyimpan..."
                            : isAkhir
                              ? "Simpan Checklist Akhir"
                              : "Simpan Checklist Awal"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function ChecklistSection({ armada, options }) {
    const [openAwalModal, setOpenAwalModal] = useState(false);
    const [openAkhirModal, setOpenAkhirModal] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-blue-600" /> Riwayat
                    Checklist
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setOpenAwalModal(true)}
                        className={
                            btnPrimary +
                            " flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        }
                    >
                        <Plus className="w-4 h-4" /> Checklist Awal
                    </button>
                    <button
                        onClick={() => setOpenAkhirModal(true)}
                        className={
                            btnPrimary +
                            " flex items-center gap-2 bg-slate-700 hover:bg-slate-800"
                        }
                    >
                        <Plus className="w-4 h-4" /> Checklist Akhir
                    </button>
                </div>
            </div>

            <ChecklistFormModal
                armada={armada}
                options={options}
                tipe="awal"
                isOpen={openAwalModal}
                onClose={() => setOpenAwalModal(false)}
            />

            <ChecklistFormModal
                armada={armada}
                options={options}
                tipe="akhir"
                isOpen={openAkhirModal}
                onClose={() => setOpenAkhirModal(false)}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {armada.checklists.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        Belum ada checklist
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/70">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Awal
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Akhir
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Dicatat Oleh
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {armada.checklists.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                                        {formatTanggal(c.tanggal)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <KondisiBadge baik={c.kondisi_baik} />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {c.akhir ? (
                                            <KondisiBadge
                                                baik={c.akhir.kondisi_baik}
                                            />
                                        ) : (
                                            <span className="text-gray-400 font-semibold">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${
                                                    c.akhir
                                                        ? "bg-green-100 text-green-800 border border-green-200"
                                                        : "bg-blue-100 text-blue-800 border border-blue-200"
                                                }`}
                                            >
                                                {c.akhir
                                                    ? "Selesai"
                                                    : "Berjalan"}
                                            </span>
                                            {c.akhir?.odo_anomali && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 w-fit">
                                                    ODO Anomali
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {c.dicatat_oleh?.nama || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function PengisianSolarSection({ armada }) {
    const rows = armada.pengisian_solars || [];

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-blue-600" /> Riwayat Pengisian
                Solar
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {rows.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        Belum ada pengisian solar
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/70">
                            <tr>
                                {[
                                    "Tanggal",
                                    "Waktu",
                                    "ODO/HM",
                                    "Liter",
                                    "Nominal",
                                    "Rp/L",
                                    "Foto",
                                    "Driver",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                                        {formatTanggal(p.tanggal)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {p.waktu || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {p.odo_atau_hm != null
                                            ? Number(
                                                  p.odo_atau_hm,
                                              ).toLocaleString("id-ID")
                                            : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {Number(p.liter).toLocaleString(
                                            "id-ID",
                                        )}{" "}
                                        L
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                        Rp{" "}
                                        {Number(p.nominal_rp).toLocaleString(
                                            "id-ID",
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        Rp{" "}
                                        {Number(
                                            p.harga_per_liter,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex gap-2">
                                            {p.foto_odo_url && (
                                                <a
                                                    href={p.foto_odo_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-600 hover:underline font-semibold text-xs"
                                                >
                                                    ODO
                                                </a>
                                            )}
                                            {p.foto_nota_url && (
                                                <a
                                                    href={p.foto_nota_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-600 hover:underline font-semibold text-xs"
                                                >
                                                    Nota
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {p.dicatat_oleh?.nama ||
                                            p.karyawan?.nama ||
                                            "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function DowntimeSection({ armada }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            penyebab: "",
            kategori: "kerusakan",
            catatan: "",
        });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.start-downtime", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsModalOpen(false);
            },
        });
    };

    const endDowntime = (id) => {
        if (window.confirm("Yakin selesaikan downtime ini?")) {
            router.post(
                route("fleet.armada.end-downtime", [armada.id, id]),
                {},
                { preserveScroll: true },
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Play className="w-5 h-5 text-blue-600" /> Riwayat Downtime
                </h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={
                        btnPrimary +
                        " flex items-center gap-2 bg-red-600 hover:bg-red-700"
                    }
                >
                    <Play className="w-4 h-4 fill-white" /> Mulai Downtime
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Mulai Downtime"
            >
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Penyebab">
                        <input
                            type="text"
                            value={data.penyebab}
                            onChange={(e) =>
                                setData("penyebab", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Kategori *" error={errors.kategori}>
                        <select
                            value={data.kategori}
                            onChange={(e) =>
                                setData("kategori", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="kerusakan">Kerusakan</option>
                            <option value="menunggu_sparepart">
                                Menunggu Sparepart
                            </option>
                            <option value="lainnya">Lainnya</option>
                        </select>
                    </Field>
                    <Field label="Catatan">
                        <textarea
                            rows="2"
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={
                                btnPrimary + " bg-red-600 hover:bg-red-700"
                            }
                        >
                            {processing ? "Menyimpan..." : "Mulai Downtime"}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {armada.downtimes.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        Tidak ada downtime
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/70">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Mulai
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Selesai
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Kategori
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Penyebab
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {armada.downtimes.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                                        {formatTanggal(d.mulai)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {d.selesai ? (
                                            formatTanggal(d.selesai)
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                Berjalan
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 uppercase text-xs font-bold">
                                        {d.kategori.replace(/_/g, " ")}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {d.penyebab || d.catatan || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm">
                                        {!d.selesai && (
                                            <button
                                                onClick={() =>
                                                    endDowntime(d.id)
                                                }
                                                className="text-green-600 hover:text-green-800 font-semibold inline-flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200"
                                            >
                                                <Square className="w-3.5 h-3.5" />{" "}
                                                Selesaikan
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function DriverSection({ armada, options }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            karyawan_id: "",
            tipe: "standby",
            tanggal_mulai: new Date().toISOString().split("T")[0],
        });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.assign-driver", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsModalOpen(false);
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" /> Riwayat
                    Penugasan Driver
                </h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={btnPrimary + " flex items-center gap-2"}
                >
                    <UserPlus className="w-4 h-4" /> Tugaskan Driver
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Tugaskan Driver"
            >
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Driver *" error={errors.karyawan_id}>
                        <select
                            value={data.karyawan_id}
                            onChange={(e) =>
                                setData("karyawan_id", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Pilih Driver</option>
                            {options.drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nama}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Tipe *" error={errors.tipe}>
                        <select
                            value={data.tipe}
                            onChange={(e) => setData("tipe", e.target.value)}
                            className={inputClass}
                        >
                            <option value="standby">Standby</option>
                            <option value="kondisional">Kondisional</option>
                        </select>
                    </Field>
                    <Field label="Tanggal Mulai *" error={errors.tanggal_mulai}>
                        <input
                            type="date"
                            value={data.tanggal_mulai}
                            onChange={(e) =>
                                setData("tanggal_mulai", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={btnPrimary}
                        >
                            {processing ? "Menyimpan..." : "Tugaskan Driver"}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {armada.driver_assignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        Belum ada penugasan driver
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/70">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Driver
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Tipe
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Mulai
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Selesai
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {armada.driver_assignments.map((da) => (
                                <tr key={da.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                                        {da.karyawan?.nama || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                                        {da.tipe}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatTanggal(da.tanggal_mulai)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {da.tanggal_selesai
                                            ? formatTanggal(da.tanggal_selesai)
                                            : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                da.status === "aktif"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-blue-100 text-blue-800"
                                            }`}
                                        >
                                            {da.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function HelperSection({ armada }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        armada_id: armada.id,
        nama: "",
        no_hp: "",
        honor: "",
        durasi_mulai: new Date().toISOString().split("T")[0],
        durasi_selesai: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.helper.store"), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsModalOpen(false);
            },
        });
    };

    const helpers = armada.helper_armadas || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" /> Daftar Helper
                </h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={btnPrimary + " flex items-center gap-2"}
                >
                    <Plus className="w-4 h-4" /> Tambah Helper
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Tambah Helper"
                maxWidth="max-w-xl"
            >
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Nama *" error={errors.nama}>
                            <input
                                type="text"
                                value={data.nama}
                                onChange={(e) =>
                                    setData("nama", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="No HP" error={errors.no_hp}>
                            <input
                                type="text"
                                value={data.no_hp}
                                onChange={(e) =>
                                    setData("no_hp", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Honor (Rp)" error={errors.honor}>
                            <input
                                type="number"
                                value={data.honor}
                                onChange={(e) =>
                                    setData("honor", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field
                            label="Durasi Mulai *"
                            error={errors.durasi_mulai}
                        >
                            <input
                                type="date"
                                value={data.durasi_mulai}
                                onChange={(e) =>
                                    setData("durasi_mulai", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <div className="md:col-span-2">
                            <Field
                                label="Durasi Selesai"
                                error={errors.durasi_selesai}
                            >
                                <input
                                    type="date"
                                    value={data.durasi_selesai}
                                    onChange={(e) =>
                                        setData(
                                            "durasi_selesai",
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={btnPrimary}
                        >
                            {processing ? "Menyimpan..." : "Tambah Helper"}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {helpers.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">
                        Belum ada helper ditambahkan
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/70">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Nama
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    No HP
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Honor
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Durasi
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Presensi
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {helpers.map((h) => (
                                <HelperRow
                                    key={h.id}
                                    armada={armada}
                                    helper={h}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function HelperRow({ armada, helper }) {
    const [editing, setEditing] = useState(false);

    const {
        data,
        setData,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        armada_id: armada.id,
        nama: helper.nama || "",
        no_hp: helper.no_hp || "",
        honor: helper.honor ?? "",
        durasi_mulai: helper.durasi_mulai || "",
        durasi_selesai: helper.durasi_selesai || "",
        status: helper.status || "aktif",
    });

    const save = (e) => {
        e.preventDefault();
        put(route("fleet.helper.update", helper.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditing(false);
                clearErrors();
            },
        });
    };

    const cancelEdit = () => {
        reset();
        clearErrors();
        setEditing(false);
    };

    const handleDelete = () => {
        if (
            window.confirm(
                `Apakah Anda yakin ingin menghapus helper "${helper.nama}"?`,
            )
        ) {
            destroy(route("fleet.helper.destroy", helper.id), {
                preserveScroll: true,
            });
        }
    };

    const presensis = helper.presensis || [];

    return (
        <>
            <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {helper.nama}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                    {helper.no_hp || "-"}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    Rp {Number(helper.honor || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatTanggal(helper.durasi_mulai) || "-"}
                    {formatTanggal(helper.durasi_selesai)
                        ? ` s/d ${formatTanggal(helper.durasi_selesai)}`
                        : ""}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                    {presensis.length === 0 ? (
                        "-"
                    ) : (
                        <ul className="space-y-1 text-xs">
                            {presensis.map((p) => (
                                <li key={p.id}>
                                    {formatTanggal(p.tanggal)} ·{" "}
                                    {p.check_in
                                        ? formatTanggal(p.check_in)
                                        : "?"}{" "}
                                    -{" "}
                                    {p.check_out
                                        ? formatTanggal(p.check_out)
                                        : "?"}
                                </li>
                            ))}
                        </ul>
                    )}
                </td>
                <td className="px-4 py-3 text-sm">
                    <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            helper.status === "aktif"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {helper.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 hover:text-amber-800"
                        >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={processing}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                            <Trash className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                        </button>
                    </div>
                </td>
            </tr>

            <Modal
                isOpen={editing}
                onClose={cancelEdit}
                title={`Edit Helper - ${helper.nama}`}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={save} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Nama Helper" error={errors.nama}>
                            <input
                                type="text"
                                value={data.nama}
                                onChange={(e) =>
                                    setData("nama", e.target.value)
                                }
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field label="Nomor HP" error={errors.no_hp}>
                            <input
                                type="text"
                                value={data.no_hp}
                                onChange={(e) =>
                                    setData("no_hp", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Honor" error={errors.honor}>
                            <input
                                type="number"
                                min="0"
                                value={data.honor}
                                onChange={(e) =>
                                    setData("honor", e.target.value)
                                }
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field label="Durasi Mulai" error={errors.durasi_mulai}>
                            <input
                                type="date"
                                value={data.durasi_mulai}
                                onChange={(e) =>
                                    setData("durasi_mulai", e.target.value)
                                }
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field
                            label="Durasi Selesai"
                            error={errors.durasi_selesai}
                        >
                            <input
                                type="date"
                                value={data.durasi_selesai}
                                min={data.durasi_mulai || undefined}
                                onChange={(e) =>
                                    setData("durasi_selesai", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Status" error={errors.status}>
                            <select
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                                className={inputClass}
                                required
                            >
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                        </Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={btnPrimary}
                        >
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

export default function Show({ armada, options, can }) {
    const [tab, setTab] = useState("ritase");

    const tabs = [
        { key: "ritase", label: "Ritase", icon: <Truck className="w-4 h-4" /> },
        {
            key: "sewa",
            label: "Sewa Alat",
            icon: <Clock className="w-4 h-4" />,
        },
        {
            key: "service",
            label: "Servis",
            icon: <Wrench className="w-4 h-4" />,
        },
        { key: "bbm", label: "BBM", icon: <Fuel className="w-4 h-4" /> },
        {
            key: "checklist",
            label: "Checklist",
            icon: <ClipboardCheck className="w-4 h-4" />,
        },
        {
            key: "pengisian_solar",
            label: "Pengisian Solar",
            icon: <Fuel className="w-4 h-4" />,
        },
        {
            key: "downtime",
            label: "Downtime",
            icon: <Play className="w-4 h-4" />,
        },
        {
            key: "driver",
            label: "Driver",
            icon: <UserPlus className="w-4 h-4" />,
        },
        ...(can.helper
            ? [
                  {
                      key: "helper",
                      label: "Helper",
                      icon: <Users className="w-4 h-4" />,
                  },
              ]
            : []),
        {
            key: "dokumen",
            label: "Dokumen",
            icon: <FileText className="w-4 h-4" />,
        },
    ];

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        Armada: {armada.kode_unit}
                    </h1>
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                            STATUS[armada.status] ||
                            "bg-gray-100 text-gray-800 border-gray-300"
                        }`}
                    >
                        {armada.status}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route("fleet.armada.index")}
                        className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </Link>
                    <Link
                        href={route("fleet.armada.edit", armada.id)}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition"
                    >
                        <Edit className="h-4 w-4" /> Edit
                    </Link>
                </div>
            </div>

            <FlashMessage />

            {/* Panel Informasi Unit */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                    Informasi Unit
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6">
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400 mb-1">
                            Plat Nomor
                        </span>
                        <span className="text-base font-bold text-gray-900">
                            {armada.plat_nomor || "-"}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400 mb-1">
                            Jenis
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                            {JENIS[armada.jenis] || armada.jenis}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400 mb-1">
                            Model Tarif
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                            {MODEL_TARIF[armada.model_tarif] ||
                                armada.model_tarif}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400 mb-1">
                            Unit Bisnis
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                            {armada.unit_bisnis?.nama || "-"}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400 mb-1">
                            Titik / Basecamp
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                            {armada.titik?.nama || "-"}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400 mb-1">
                            Tahun
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                            {armada.tahun || "-"}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400 mb-1">
                            Kapasitas
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                            {armada.kapasitas || "-"}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold uppercase text-gray-400 mb-1">
                            Driver Saat Ini
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                            {armada.driver_assignments[0]?.karyawan?.nama ||
                                "-"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {/* Tab Sections */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {tab === "ritase" && (
                    <RitaseSection
                        armada={armada}
                        options={options}
                        can={can}
                    />
                )}
                {tab === "sewa" && (
                    <SewaSection armada={armada} options={options} can={can} />
                )}
                {tab === "service" && (
                    <ServiceSection armada={armada} options={options} />
                )}
                {tab === "bbm" && (
                    <BbmSection armada={armada} options={options} />
                )}
                {tab === "checklist" && (
                    <ChecklistSection armada={armada} options={options} />
                )}
                {tab === "pengisian_solar" && (
                    <PengisianSolarSection armada={armada} />
                )}
                {tab === "downtime" && <DowntimeSection armada={armada} />}
                {tab === "driver" && (
                    <DriverSection armada={armada} options={options} />
                )}
                {tab === "helper" && can.helper && (
                    <HelperSection armada={armada} />
                )}
                {tab === "dokumen" && (
                    <DokumenSection
                        armada={armada}
                        canManage={can.manageDocuments}
                    />
                )}
            </div>
        </Layout>
    );
}
