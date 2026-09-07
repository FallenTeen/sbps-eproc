import React from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { History, User, FileCheck2, Package, Wrench } from "lucide-react";

const fmt = (d) => (d ? new Date(d).toLocaleDateString("id-ID") : "-");
const rupiah = (n) => Number(n || 0).toLocaleString("id-ID");

export default function Riwayat({ pengajuans, histories }) {
    return (
        <AuthenticatedLayout>
            <Head title="Workshop — Riwayat Servis" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Riwayat Servis</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Gabungan penyelesaian servis: pengajuan servis selesai (21.8) + riwayat servis unit (service history)
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pengajuan servis selesai */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-gray-600" />
                        <h2 className="font-semibold text-gray-900">Pengajuan Servis Selesai</h2>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                        {pengajuans.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">Belum ada pengajuan servis selesai.</div>
                        ) : (
                            pengajuans.map((p) => (
                                <div key={p.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-900">{p.kode_pengajuan}</span>
                                        <span className="text-xs text-gray-500">{fmt(p.tanggal_selesai)}</span>
                                    </div>
                                    <div className="mt-1 text-sm text-gray-600">
                                        {p.armada?.plat_nomor} ({p.armada?.kode_unit})
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                                        <span className="inline-flex items-center gap-1">
                                            <User className="w-3.5 h-3.5" /> {p.diajukan_oleh?.name || "-"}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Wrench className="w-3.5 h-3.5" />
                                            {p.personels?.map((x) => x.nama_personel).join(", ") || "-"}
                                        </span>
                                    </div>
                                    {(p.spareparts?.length > 0 && (
                                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-amber-700">
                                            <Package className="w-3.5 h-3.5" />
                                            {p.spareparts.map((s) => s.nama_item).join(", ")}
                                        </div>
                                    )) || (
                                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400">
                                            <Package className="w-3.5 h-3.5" /> Tanpa sparepart
                                        </div>
                                    )}
                                    <div className="mt-2 text-right text-sm font-semibold tabular-nums text-gray-900">
                                        Rp {rupiah(p.total_biaya)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Service history */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                        <History className="w-4 h-4 text-gray-600" />
                        <h2 className="font-semibold text-gray-900">Riwayat Servis Unit</h2>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                        {histories.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">Belum ada riwayat servis unit.</div>
                        ) : (
                            histories.map((h) => (
                                <div key={h.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {h.serviceable?.plat_nomor || h.serviceable?.nama || "-"}
                                        </span>
                                        <span className="text-xs text-gray-500">{fmt(h.tanggal)}</span>
                                    </div>
                                    <div className="mt-1 text-sm text-gray-600">{h.jenis_servis || "-"}</div>
                                    {h.notes && <div className="mt-1 text-xs text-gray-500">{h.notes}</div>}
                                    <div className="mt-2 text-right text-sm font-semibold tabular-nums text-gray-900">
                                        Rp {rupiah(h.biaya)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}