import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PhotoCard from "@/Components/PhotoCard";
import { AlertTriangle, ArrowLeft, Check, X } from "lucide-react";

const STOK_LABEL = {
    hampir_habis: "Hampir Habis",
    seperempat: "Seperempat",
    setengah: "Setengah",
    tiga_perempat: "Tiga Perempat",
    hampir_penuh: "Hampir Penuh",
    penuh: "Penuh",
};

const KONDISI_STYLE = {
    baik: "bg-green-100 text-green-800",
    perlu_perhatian: "bg-amber-100 text-amber-800",
    rusak: "bg-red-100 text-red-800",
};

const KONDISI_LABEL = {
    baik: "Baik",
    perlu_perhatian: "Perlu Perhatian",
    rusak: "Rusak",
};

function itemPhotoUrl(foto) {
    if (!foto) return null;
    if (/^https?:\/\//i.test(foto)) return foto;
    return `/storage/${foto}`;
}

function ItemTable({ items }) {
    if (!items || items.length === 0) {
        return <p className="text-sm text-gray-500">Tidak ada rincian per bagian.</p>;
    }

    return (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{it.bagian || "-"}</p>
                        {it.catatan && <p className="text-xs text-gray-500">{it.catatan}</p>}
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${KONDISI_STYLE[it.kondisi] || "bg-gray-100 text-gray-700"}`}>
                        {KONDISI_LABEL[it.kondisi] || it.kondisi}
                    </span>
                </div>
            ))}
        </div>
    );
}

function Section({ title, badge, children }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                {badge}
            </div>
            {children}
        </div>
    );
}

function KondisiBadge({ baik }) {
    return baik ? (
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800 flex items-center gap-1">
            <Check className="w-4 h-4" /> Kondisi Baik
        </span>
    ) : (
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800 flex items-center gap-1">
            <X className="w-4 h-4" /> Ada Masalah
        </span>
    );
}

function Meta({ label, value }) {
    return (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value ?? "-"}</p>
        </div>
    );
}

function PhotoGrid({ awals }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {awals.map((p, i) => (
                <PhotoCard key={i} label={p.label} url={p.url} meta={p.meta} />
            ))}
        </div>
    );
}

export default function Show({ checklist }) {
    const checkable = checklist.checkable;
    const checkableName = checkable?.kode_unit || checkable?.plat_nomor || checkable?.nama || "Unit";
    const akhir = checklist.akhir;

    return (
        <AuthenticatedLayout>
            <Head title="Detail Checklist" />

            <div className="mb-6 flex items-start gap-4">
                <Link href={route("fleet.checklist-harian.index")} className="text-gray-600 hover:text-gray-900 mt-1">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Detail Checklist Harian</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {checkableName} · {new Date(checklist.tanggal).toLocaleDateString("id-ID")}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Checklist Awal" badge={<KondisiBadge baik={checklist.kondisi_baik} />}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <Meta label="Dicatat Oleh" value={checklist.dicatat_oleh?.nama || checklist.dicatat_oleh?.name} />
                        <Meta label="Jam Mulai Operasi" value={checklist.jam_mulai_operasi} />
                        <Meta label="ODO / HM Pagi" value={checklist.odo_pagi ?? checklist.hm_odo} />
                        <Meta label="Stok Solar" value={STOK_LABEL[checklist.stok_solar] || checklist.stok_solar} />
                    </div>
                    {checklist.item_bermasalah && (
                        <p className="text-sm text-red-700 bg-red-50 rounded p-2 mb-4">{checklist.item_bermasalah}</p>
                    )}
                    <ItemTable items={checklist.items} />
                    <PhotoGrid
                        awals={[
                            { label: "Foto ODO Pagi", url: checklist.foto_odo_pagi_url, meta: checklist.foto_odo_pagi_metadata },
                            { label: "Foto Stok Solar", url: checklist.foto_stok_solar_url, meta: checklist.foto_stok_solar_metadata },
                        ]}
                    />
                </Section>

                {akhir ? (
                    <Section
                        title="Checklist Akhir"
                        badge={
                            <div className="flex items-center gap-2">
                                {akhir.odo_anomali && (
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> ODO Anomali
                                    </span>
                                )}
                                <KondisiBadge baik={akhir.kondisi_baik} />
                            </div>
                        }
                    >
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Meta label="Dicatat Oleh" value={akhir.dicatat_oleh?.nama || akhir.dicatat_oleh?.name} />
                            <Meta label="Jam Selesai Operasi" value={akhir.jam_selesai_operasi} />
                            <Meta label="ODO / HM Akhir" value={akhir.odo_akhir ?? akhir.hm_akhir} />
                            <Meta label="Stok Solar" value={STOK_LABEL[akhir.stok_solar] || akhir.stok_solar} />
                        </div>
                        {akhir.item_bermasalah && (
                            <p className="text-sm text-red-700 bg-red-50 rounded p-2 mb-4">{akhir.item_bermasalah}</p>
                        )}
                        <ItemTable items={akhir.items} />
                        <PhotoGrid
                            awals={[
                                { label: "Foto ODO Akhir", url: akhir.foto_odo_akhir_url, meta: akhir.foto_odo_akhir_metadata },
                                { label: "Foto Stok Solar", url: akhir.foto_stok_solar_url, meta: akhir.foto_stok_solar_metadata },
                            ]}
                        />
                    </Section>
                ) : (
                    <Section title="Checklist Akhir" badge={<span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-700">Belum Diisi</span>}>
                        <p className="text-sm text-gray-500">Checklist akhir belum diisi oleh driver.</p>
                    </Section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
