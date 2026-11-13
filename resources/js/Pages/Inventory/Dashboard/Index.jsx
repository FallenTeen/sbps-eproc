import React from "react";
import { Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Boxes, AlertTriangle, ClipboardCheck, Clock, Wallet } from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Index({ metrics }) {
    const fmt = (n) => "Rp " + Number(n).toLocaleString("id-ID");

    return (
        <AuthenticatedLayout>
            <Head title="Ringkasan Persediaan" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Ringkasan Persediaan</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Pantau jumlah barang, perkiraan nilai stok, pesanan pembelian, dan barang yang perlu diisi ulang.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard
                    title="Jenis barang tersedia"
                    value={metrics.total_item}
                    icon={<Boxes className="w-6 h-6 text-blue-500" />}
                    colorClass="bg-blue-50 border-blue-100 text-blue-900"
                    link={route("procurement.bahan-baku.index")}
                />
                <KpiCard
                    title="Perkiraan nilai persediaan"
                    value={fmt(metrics.nilai_stok)}
                    icon={<Wallet className="w-6 h-6 text-emerald-500" />}
                    colorClass="bg-emerald-50 border-emerald-100 text-emerald-900"
                />
                <KpiCard
                    title="Pesanan pembelian menunggu persetujuan"
                    value={metrics.po_pending_approval}
                    icon={<Clock className="w-6 h-6 text-amber-500" />}
                    colorClass="bg-amber-50 border-amber-100 text-amber-900"
                    link={route("procurement.purchase-orders.approval-queue")}
                />
                <KpiCard
                    title="Barang dengan stok menipis"
                    value={metrics.mendekati_habis.length}
                    icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
                    colorClass="bg-red-50 border-red-100 text-red-900"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" /> Stok menipis
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">Sisa 10 satuan atau kurang; periksa sebelum barang digunakan lagi.</p>
                        </div>
                        <Link href={route("procurement.bahan-baku.index")} className="text-sm text-blue-600 hover:underline font-medium">
                            Lihat semua
                        </Link>
                    </div>
                    {metrics.mendekati_habis.length === 0 ? (
                        <p className="text-sm text-gray-600 py-4" role="status">Tidak ada barang dengan stok 10 satuan atau kurang.</p>
                    ) : (
                        <div className="space-y-2">
                            {metrics.mendekati_habis.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{item.nama}</p>
                                        <p className="text-sm text-gray-600">
                                            Kode {item.kode} · {item.kategori === "sparepart" ? "Suku cadang" : "Bahan baku"}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-red-600 tabular-nums">
                                        {item.saldo} {item.satuan}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-blue-500" /> Pemeriksaan stok terbaru
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">Membandingkan catatan aplikasi dengan jumlah barang yang dihitung langsung.</p>
                        </div>
                        <Link href={route("inventory.stok-opname.index")} className="text-sm text-blue-600 hover:underline font-medium">
                            Lihat semua
                        </Link>
                    </div>
                    {metrics.opname_terbaru.length === 0 ? (
                        <p className="text-sm text-gray-600 py-4" role="status">Belum ada pemeriksaan stok yang dicatat.</p>
                    ) : (
                        <div className="space-y-2">
                            {metrics.opname_terbaru.map((o) => (
                                <div key={o.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{o.item}</p>
                                        <p className="text-sm text-gray-600">
                                            {formatTanggal(o.tanggal)} · {o.titik}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-700 tabular-nums">
                                            Catatan {o.saldo_sistem} {o.satuan || ''} · Terhitung {o.saldo_fisik} {o.satuan || ''}
                                        </p>
                                        <p className={`text-sm font-semibold tabular-nums ${o.selisih === 0 ? "text-gray-700" : o.selisih > 0 ? "text-green-800" : "text-red-800"}`}>
                                            Selisih {o.selisih > 0 ? "+" : ""}{o.selisih}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" /> Pergerakan barang terbaru
                </h2>
                <p className="mb-4 text-sm text-gray-600">Catatan barang yang masuk atau keluar dari persediaan.</p>
                {metrics.mutasi_terbaru.length === 0 ? (
                    <p className="text-sm text-gray-600 py-4" role="status">Belum ada barang masuk atau keluar yang dicatat.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="text-left text-sm text-gray-600">
                                <th scope="col" className="py-2 font-medium">Barang</th>
                                <th scope="col" className="py-2 font-medium">Lokasi kerja</th>
                                <th scope="col" className="py-2 font-medium">Tanggal</th>
                                <th scope="col" className="py-2 text-right font-medium">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {metrics.mutasi_terbaru.map((m) => (
                                <tr key={m.id}>
                                    <td className="py-3 text-sm font-semibold text-gray-800">{m.item}</td>
                                    <td className="py-3 text-sm text-gray-700">{m.titik || "-"}</td>
                                    <td className="py-3 text-sm text-gray-700">{formatTanggal(m.tanggal)}</td>
                                    <td className="py-3 text-right">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                m.tipe === "masuk" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
                                            }`}
                                        >
                                            {m.tipe === "masuk" ? "Barang masuk +" : "Barang keluar -"}{m.jumlah} {m.satuan || ""}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function KpiCard({ title, value, icon, colorClass, link }) {
    const card = (
        <div className={`p-5 rounded-xl border ${colorClass} h-full flex flex-col justify-between hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold opacity-90">{title}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold mt-2">{value}</div>
        </div>
    );

    return link ? (
        <Link href={link} className="block h-full">
            {card}
        </Link>
    ) : (
        card
    );
}