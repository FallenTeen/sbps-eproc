import React, { useState, useEffect } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Plus,
    Edit,
    Calendar,
    CheckCircle2,
    Printer,
    X,
    Truck,
    User,
    Gauge,
    Clock,
    FileText,
    Camera,
    AlertCircle,
    Building,
    ArrowLeft,
} from "lucide-react";
import { formatTanggal } from "@/utils/date";

const STATUS_BADGE = {
    baik: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rusak: "bg-rose-50 text-rose-700 border-rose-200",
};

const formatInputDate = (tanggal) => {
    const pad = (n) => String(n).padStart(2, "0");
    const formatLocal = (d) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (!tanggal) return formatLocal(new Date());

    if (
        typeof tanggal === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(tanggal.trim())
    ) {
        return tanggal.trim();
    }

    const date = tanggal.toDate ? tanggal.toDate() : new Date(tanggal);
    if (isNaN(date.getTime())) return formatLocal(new Date());

    return formatLocal(date);
};

function InfoCard({ label, value, sub, icon: Icon, accent = "blue" }) {
    const accents = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        slate: "bg-slate-100 text-slate-600 border-slate-200",
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {label}
                </p>
                <p
                    className="text-lg font-bold text-slate-800 mt-1 truncate"
                    title={String(value)}
                >
                    {value}
                </p>
                {sub && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {sub}
                    </p>
                )}
            </div>
            {Icon && (
                <div
                    className={`p-2.5 rounded-lg border shrink-0 ${accents[accent]}`}
                >
                    <Icon className="w-4 h-4" />
                </div>
            )}
        </div>
    );
}

function ChecklistSection({ title, tipe, data, pemakaian, onOpenModal }) {
    const isBerangkat = tipe === "berangkat";
    const badgeColor = isBerangkat
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-indigo-50 text-indigo-700 border-indigo-200";

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeColor}`}
                    >
                        {isBerangkat ? "01" : "02"}
                    </span>
                    <h2 className="text-base font-bold text-slate-800">
                        {title}
                    </h2>
                </div>

                {data && (
                    <button
                        type="button"
                        onClick={() => onOpenModal(tipe)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-blue-600 transition shadow-xs"
                    >
                        <Edit className="w-3.5 h-3.5" /> Edit Data
                    </button>
                )}
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col">
                {data ? (
                    <div className="space-y-6 flex-1">
                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                            <div>
                                <span className="text-xs text-slate-400 block">
                                    Tanggal Serah Terima
                                </span>
                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                    <Calendar className="w-3.5 h-3.5 text-green-400" />
                                    {formatTanggal(data.tanggal)}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 block">
                                    Odometer / Hour Meter
                                </span>
                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                                    {data.odo_atau_hm ?? "-"} HM
                                    {!isBerangkat && pemakaian > 0 && (
                                        <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                            +
                                            {pemakaian.toLocaleString("id-ID", {
                                                minimumFractionDigits: 1,
                                                maximumFractionDigits: 1,
                                            })}{" "}
                                            HM
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 block">
                                    Penyewa / Perusahaan
                                </span>
                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                    <Building className="w-3.5 h-3.5 text-blue-400" />
                                    {data?.data_penyewa?.nama ?? "-"}{" "}
                                    {data?.data_penyewa?.pt
                                        ? ` (${data.data_penyewa.pt})`
                                        : ""}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 block">
                                    Dicatat / Ditandatangani
                                </span>
                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                    <User className="w-3.5 h-3.5 text-purple-400" />
                                    {data?.dicatatOleh?.name ??
                                        data?.ditandatangani_oleh ??
                                        "-"}
                                </span>
                            </div>
                        </div>

                        {/* Catatan */}
                        {data?.catatan && (
                            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5">
                                <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
                                    <FileText className="w-3.5 h-3.5" /> Catatan
                                    Tambahan
                                </span>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    {data.catatan}
                                </p>
                            </div>
                        )}

                        {/* Daftar Item Checklist */}
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Rincian Pengecekan (
                                    {data?.details?.length ?? 0} Item)
                                </h3>
                            </div>
                            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                                {data?.details?.length > 0 ? (
                                    data.details.map((detail, idx) => (
                                        <div
                                            key={idx}
                                            className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-sm bg-white hover:bg-slate-50/60"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-700 truncate">
                                                    {detail.item}
                                                </p>
                                                {detail.catatan && (
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                                        {detail.catatan}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize shrink-0 ${STATUS_BADGE[detail.kondisi] ?? "bg-slate-100 text-slate-600"}`}
                                            >
                                                {detail.kondisi}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-xs text-slate-400 text-center">
                                        Tidak ada rincian item.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Lampiran Foto */}
                        {data?.foto_kondisi?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                    <Camera className="w-3.5 h-3.5" /> Lampiran
                                    Foto ({data.foto_kondisi.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.foto_kondisi.map((foto, idx) => {
                                        const fotoPath =
                                            typeof foto === "string"
                                                ? foto
                                                : (foto.path ?? foto.url ?? "");
                                        const storagePath = fotoPath.replace(
                                            /^(public\/|storage\/)/,
                                            "",
                                        );
                                        const fotoUrl = /^https?:\/\//i.test(
                                            fotoPath,
                                        )
                                            ? fotoPath
                                            : `/storage/${storagePath}`;

                                        return (
                                            <a
                                                key={idx}
                                                href={fotoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:bg-slate-200 transition"
                                            >
                                                <img
                                                    src={fotoUrl}
                                                    alt={`Foto ${idx + 1}`}
                                                    className="w-12 h-12 object-cover block"
                                                />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                            Belum ada data checklist {tipe}
                        </p>
                        <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
                            Lengkapi formulir pengecekan kondisi unit sebelum
                            atau sesudah masa sewa berlangsung.
                        </p>
                        <button
                            type="button"
                            onClick={() => onOpenModal(tipe)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Isi Checklist {title}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SewaAlatSerahTerima({
    auth,
    sewa,
    berangkat,
    kembali,
    pemakaian,
    defaultItems,
    can,
}) {
    const { flash } = usePage().props;
    const [showFlash, setShowFlash] = useState(!!flash?.success);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTipe, setModalTipe] = useState("berangkat");
    const [processing, setProcessing] = useState(false);

    const [formOdo, setFormOdo] = useState("");
    const [formTanggal, setFormTanggal] = useState(() => formatInputDate());
    const [formCatatan, setFormCatatan] = useState("");
    const [formDitandatangani, setFormDitandatangani] = useState("");
    const [formItems, setFormItems] = useState([]);
    const [formFoto, setFormFoto] = useState([]);
    const [existingFotos, setExistingFotos] = useState([]);

    useEffect(() => {
        if (flash?.success) setShowFlash(true);
    }, [flash]);

    const openModal = (tipe) => {
        setModalTipe(tipe);
        const source = tipe === "berangkat" ? berangkat : kembali;

        if (source) {
            setFormOdo(source.odo_atau_hm ?? "");
            setFormTanggal(formatInputDate(source.tanggal));
            setFormCatatan(source.catatan ?? "");
            setFormDitandatangani(
                source.ditandatangani_oleh?.name ??
                    source.ditandatangani_oleh ??
                    "",
            );
            setFormItems(
                source.details?.length > 0
                    ? source.details.map((d) => ({
                          item: d.item,
                          kondisi: d.kondisi,
                          catatan: d.catatan ?? "",
                      }))
                    : defaultItems.map((item) => ({
                          item,
                          kondisi: "baik",
                          catatan: "",
                      })),
            );
            setExistingFotos(source.foto_kondisi ?? []);
            setFormFoto([]);
        } else {
            setFormOdo("");
            setFormTanggal(formatInputDate());
            setFormCatatan("");
            setFormDitandatangani("");
            setFormItems(
                defaultItems.map((item) => ({
                    item,
                    kondisi: "baik",
                    catatan: "",
                })),
            );
            setExistingFotos([]);
            setFormFoto([]);
        }

        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setProcessing(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            tipe: modalTipe,
            sewa_id: sewa.id,
            odo_atau_hm: formOdo !== "" ? parseFloat(formOdo) : null,
            tanggal: formTanggal,
            catatan: formCatatan || null,
            ditandatangani_oleh: formDitandatangani || null,
            items: formItems.map((it) => ({
                item: it.item,
                kondisi: it.kondisi,
                catatan: it.catatan,
            })),
            existing_fotos: existingFotos,
            foto_kondisi: formFoto,
        };

        router.post(
            route("fleet.sewa-alat.serah-terima.store", sewa.id),
            payload,
            {
                forceFormData: true,
                onSuccess: () => {
                    closeModal();
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const updateItemField = (idx, field, value) => {
        setFormItems((prev) => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            return updated;
        });
    };

    return (
        <AuthenticatedLayout>
            <Head
                title={`Checklist Serah Terima - ${sewa.armada?.kode_unit ?? ""}`}
            />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Flash Message */}
                {showFlash && flash?.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                        <button
                            onClick={() => setShowFlash(false)}
                            className="text-emerald-600 hover:text-emerald-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Page Header & Primary Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Checklist Serah Terima
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                                {sewa.status ?? "Draft"}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Dokumentasi kondisi unit sebelum keberangkatan dan
                            setelah pengembalian sewa.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={route("fleet.sewa-alat.index")}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Batal
                        </Link>
                        {berangkat && kembali && (
                            <a
                                href={route(
                                    "fleet.sewa-alat.serah-terima.print",
                                    sewa.id,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm shrink-0"
                            >
                                <Printer className="w-4 h-4" /> Cetak Berita
                                Acara (PDF)
                            </a>
                        )}
                    </div>
                </div>

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <InfoCard
                        label="Unit Armada"
                        value={sewa.armada?.kode_unit ?? "-"}
                        sub={sewa.armada?.plat_nomor ?? "Tanpa Plat"}
                        icon={Truck}
                        accent="blue"
                    />
                    <InfoCard
                        label="Penyewa"
                        value={sewa.penyewa_nama ?? "-"}
                        icon={User}
                        accent="purple"
                    />
                    <InfoCard
                        label="HM Awal"
                        value={sewa.hm_awal ? `${sewa.hm_awal} HM` : "-"}
                        icon={Gauge}
                        accent="amber"
                    />
                    <InfoCard
                        label="HM Akhir"
                        value={sewa.hm_akhir ? `${sewa.hm_akhir} HM` : "-"}
                        icon={Gauge}
                        accent="amber"
                    />
                    <InfoCard
                        label="Total Pemakaian"
                        value={pemakaian > 0 ? `${pemakaian} HM` : "-"}
                        icon={Clock}
                        accent="emerald"
                    />
                </div>

                {/* Main Content: 2-Column Side-by-Side Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    <ChecklistSection
                        title="Checklist Berangkat"
                        tipe="berangkat"
                        data={berangkat}
                        pemakaian={pemakaian}
                        onOpenModal={openModal}
                    />
                    <ChecklistSection
                        title="Checklist Kembali"
                        tipe="kembali"
                        data={kembali}
                        pemakaian={pemakaian}
                        onOpenModal={openModal}
                    />
                </div>
            </div>

            {/* Modal Form */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Sticky Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {modalTipe === "berangkat"
                                        ? "Form Checklist Berangkat"
                                        : "Form Checklist Kembali"}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Unit: {sewa.armada?.kode_unit} (
                                    {sewa.armada?.plat_nomor})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Modal Body */}
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col flex-1 overflow-hidden"
                        >
                            <div className="p-6 overflow-y-auto space-y-5 flex-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Odo / HM (
                                            {modalTipe === "berangkat"
                                                ? "Awal"
                                                : "Akhir"}
                                            )
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            min="0"
                                            required
                                            value={formOdo}
                                            onChange={(e) =>
                                                setFormOdo(e.target.value)
                                            }
                                            placeholder="Contoh: 1250.5"
                                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Tanggal Serah Terima
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formTanggal}
                                            onChange={(e) =>
                                                setFormTanggal(e.target.value)
                                            }
                                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Ditandatangani Oleh
                                    </label>
                                    <input
                                        type="text"
                                        value={formDitandatangani}
                                        onChange={(e) =>
                                            setFormDitandatangani(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Nama penanggung jawab / operator lapangan"
                                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Checklist Items Table */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                                        Pengecekan Item Fisik & Fungsi
                                    </label>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                        <div className="bg-slate-50 px-3.5 py-2 grid grid-cols-12 text-xs font-semibold text-slate-500">
                                            <div className="col-span-5">
                                                Komponen
                                            </div>
                                            <div className="col-span-3 text-center">
                                                Kondisi
                                            </div>
                                            <div className="col-span-4">
                                                Keterangan
                                            </div>
                                        </div>

                                        {formItems.map((itemObj, idx) => (
                                            <div
                                                key={idx}
                                                className="px-3.5 py-2.5 grid grid-cols-12 items-center gap-2 text-sm bg-white"
                                            >
                                                <div className="col-span-5 font-medium text-slate-700 pr-2">
                                                    {itemObj.item}
                                                </div>

                                                <div className="col-span-3 flex items-center justify-center gap-2">
                                                    <label
                                                        className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                                            itemObj.kondisi ===
                                                            "baik"
                                                                ? "bg-emerald-600 text-white border-emerald-600"
                                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`kondisi_${idx}`}
                                                            value="baik"
                                                            checked={
                                                                itemObj.kondisi ===
                                                                "baik"
                                                            }
                                                            onChange={() =>
                                                                updateItemField(
                                                                    idx,
                                                                    "kondisi",
                                                                    "baik",
                                                                )
                                                            }
                                                            className="sr-only"
                                                        />
                                                        Baik
                                                    </label>

                                                    <label
                                                        className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                                            itemObj.kondisi ===
                                                            "rusak"
                                                                ? "bg-rose-600 text-white border-rose-600"
                                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`kondisi_${idx}`}
                                                            value="rusak"
                                                            checked={
                                                                itemObj.kondisi ===
                                                                "rusak"
                                                            }
                                                            onChange={() =>
                                                                updateItemField(
                                                                    idx,
                                                                    "kondisi",
                                                                    "rusak",
                                                                )
                                                            }
                                                            className="sr-only"
                                                        />
                                                        Rusak
                                                    </label>
                                                </div>

                                                <div className="col-span-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Opsional..."
                                                        value={
                                                            itemObj.catatan ??
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateItemField(
                                                                idx,
                                                                "catatan",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Catatan Umum
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formCatatan}
                                        onChange={(e) =>
                                            setFormCatatan(e.target.value)
                                        }
                                        placeholder="Tuliskan catatan kondisi keseluruhan unit jika ada..."
                                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Foto Dokumentasi (Maksimal 6 Foto)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) =>
                                            setFormFoto(
                                                Array.from(
                                                    e.target.files,
                                                ).slice(0, 6),
                                            )
                                        }
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-1.5"
                                    />
                                    {existingFotos.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs font-medium text-slate-600">
                                                Foto tersimpan saat ini:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {existingFotos.map(
                                                    (foto, i) => {
                                                        const fotoPath =
                                                            typeof foto ===
                                                            "string"
                                                                ? foto
                                                                : (foto.path ??
                                                                  foto.url ??
                                                                  "");
                                                        const storagePath =
                                                            fotoPath.replace(
                                                                /^(public\/|storage\/)/,
                                                                "",
                                                            );
                                                        const fotoUrl =
                                                            /^https?:\/\//i.test(
                                                                fotoPath,
                                                            )
                                                                ? fotoPath
                                                                : `/storage/${storagePath}`;

                                                        return (
                                                            <span
                                                                key={i}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700"
                                                            >
                                                                <a
                                                                    href={
                                                                        fotoUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1.5"
                                                                >
                                                                    <img
                                                                        src={
                                                                            fotoUrl
                                                                        }
                                                                        alt={`Foto ${i + 1}`}
                                                                        className="w-10 h-10 rounded object-cover"
                                                                    />
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setExistingFotos(
                                                                            (
                                                                                prev,
                                                                            ) =>
                                                                                prev.filter(
                                                                                    (
                                                                                        _,
                                                                                        idx,
                                                                                    ) =>
                                                                                        idx !==
                                                                                        i,
                                                                                ),
                                                                        )
                                                                    }
                                                                    className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                                                                    title="Hapus foto ini"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {formFoto.length > 0 && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            {formFoto.length} file dipilih:{" "}
                                            {formFoto
                                                .map((f) => f.name)
                                                .join(", ")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Modal Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                                >
                                    {processing
                                        ? "Menyimpan..."
                                        : "Simpan Checklist"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
