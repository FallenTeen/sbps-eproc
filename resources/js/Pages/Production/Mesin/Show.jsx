import React, { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft, Trash2, Pencil, AlertTriangle, CheckCircle2,
    Wrench, FileCheck, Fuel, Clock, Factory
} from "lucide-react";

const TABS = [
    { key: "info",       label: "Informasi" },
    { key: "service",    label: "Riwayat Servis" },
    { key: "checklist",  label: "Checklist Harian" },
    { key: "bbm",        label: "Log BBM" },
    { key: "downtime",   label: "Downtime" },
    { key: "sessions",   label: "Sesi Produksi" },
];

const STATUS_BADGE = {
    aktif:       "bg-emerald-100 text-emerald-800 border border-emerald-200",
    rusak:       "bg-red-100 text-red-800 border border-red-200",
    maintenance: "bg-amber-100 text-amber-800 border border-amber-200",
    nonaktif:    "bg-gray-100 text-gray-700 border border-gray-200",
};

const SESSION_STATUS_BADGE = {
    berjalan: "bg-blue-100 text-blue-800",
    selesai:  "bg-emerald-100 text-emerald-800",
    dibatalkan: "bg-gray-100 text-gray-600",
};

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}
function formatDate(d) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDatetime(d) {
    if (!d) return "-";
    return new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Show({ mesin }) {
    const [activeTab, setActiveTab] = useState("info");
    const { delete: destroy } = useForm();

    const handleDelete = () => {
        if (confirm(`Hapus mesin "${mesin.nama}"? Tindakan ini tidak dapat dibatalkan.`)) {
            destroy(route("production.mesin.destroy", mesin.id));
        }
    };

    const handleStartDowntime = () => {
        const penyebab = prompt("Penyebab Downtime:");
        if (!penyebab) return;
        router.post(route("production.mesin.start-downtime", mesin.id), {
            mulai: new Date().toISOString().slice(0, 19).replace("T", " "),
            penyebab,
            kategori: "kerusakan_mesin",
            catatan: "",
        });
    };

    const handleEndDowntime = (downtimeId) => {
        const selesai = prompt("Waktu selesai (YYYY-MM-DD HH:mm:ss):", new Date().toISOString().slice(0, 19).replace("T", " "));
        if (!selesai) return;
        router.post(route("production.mesin.end-downtime", { mesin: mesin.id, downtime: downtimeId }), { selesai });
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href={route("production.mesin.index")} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{mesin.nama}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{mesin.jenis?.replace("_", " ").toUpperCase()} · {mesin.unit_bisnis?.nama}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[mesin.status]}`}>
                        {mesin.status.toUpperCase()}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {mesin.status === "aktif" && (
                        <button onClick={handleStartDowntime}
                            className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors">
                            <AlertTriangle className="w-4 h-4" /> Start Downtime
                        </button>
                    )}
                    <Link href={route("production.mesin.edit", mesin.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors">
                        <Pencil className="w-4 h-4" /> Edit
                    </Link>
                    <button onClick={handleDelete}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                        <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon={<Wrench className="w-5 h-5 text-blue-500" />} label="Total Servis" value={mesin.service_histories?.length || 0} unit="kali" bg="bg-blue-50" />
                <StatCard icon={<Fuel className="w-5 h-5 text-amber-500" />} label="Total BBM" value={mesin.bbm_logs?.reduce((s, b) => s + (b.liter || 0), 0).toFixed(0) || 0} unit="liter" bg="bg-amber-50" />
                <StatCard icon={<Clock className="w-5 h-5 text-red-500" />} label="Total Downtime" value={mesin.downtimes?.length || 0} unit="kejadian" bg="bg-red-50" />
                <StatCard icon={<Factory className="w-5 h-5 text-emerald-500" />} label="Sesi Produksi" value={mesin.production_sessions?.length || 0} unit="sesi" bg="bg-emerald-50" />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                <nav className="flex gap-0 min-w-max">
                    {TABS.map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.key
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                {/* === TAB INFO === */}
                {activeTab === "info" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <section>
                            <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Detail Mesin</h3>
                            <dl className="space-y-3">
                                <DField label="Nama" value={mesin.nama} />
                                <DField label="Jenis" value={mesin.jenis?.replace("_", " ")} />
                                <DField label="Status" value={
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[mesin.status]}`}>{mesin.status.toUpperCase()}</span>
                                } />
                                <DField label="Kapasitas" value={mesin.kapasitas || "-"} />
                                <DField label="Biaya Per Jam" value={formatRupiah(mesin.biaya_per_jam)} />
                            </dl>
                        </section>
                        <section>
                            <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Penempatan & Output</h3>
                            <dl className="space-y-3">
                                <DField label="Unit Bisnis" value={mesin.unit_bisnis?.nama || "-"} />
                                <DField label="Titik Lokasi" value={mesin.titik?.nama || "-"} />
                                <DField label="Produk Output Default" value={mesin.produk_default?.nama || "-"} />
                            </dl>
                        </section>
                    </div>
                )}

                {/* === TAB SERVIS === */}
                {activeTab === "service" && (
                    <TabSection title="Riwayat Servis (10 Terakhir)" actionLabel="Catat Servis"
                        onAction={() => {
                            const tanggal = prompt("Tanggal (YYYY-MM-DD):", todayStr());
                            const jenis_servis = prompt("Jenis Servis:");
                            const biaya = prompt("Biaya (Rp):", "0");
                            const notes = prompt("Catatan (opsional):", "");
                            if (tanggal && jenis_servis) {
                                router.post(route("production.mesin.record-service", mesin.id), { tanggal, jenis_servis, biaya: Number(biaya), notes });
                            }
                        }}>
                        <DataTable
                            columns={["Tanggal", "Jenis Servis", "Biaya", "Catatan"]}
                            rows={mesin.service_histories || []}
                            emptyText="Belum ada riwayat servis."
                            renderRow={(s) => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <Td>{formatDate(s.tanggal)}</Td>
                                    <Td className="font-medium">{s.jenis_servis}</Td>
                                    <Td>{formatRupiah(s.biaya)}</Td>
                                    <Td className="text-gray-500">{s.notes || "-"}</Td>
                                </tr>
                            )}
                        />
                    </TabSection>
                )}

                {/* === TAB CHECKLIST === */}
                {activeTab === "checklist" && (
                    <TabSection title="Checklist Harian (10 Terakhir)" actionLabel="Catat Checklist"
                        onAction={() => {
                            const tanggal = prompt("Tanggal (YYYY-MM-DD):", todayStr());
                            const kondisi = confirm("Kondisi Baik? (OK = Ya, Cancel = Tidak)");
                            const item_bermasalah = kondisi ? "" : prompt("Item Bermasalah:", "");
                            if (tanggal) {
                                router.post(route("production.mesin.record-checklist", mesin.id), { tanggal, kondisi_baik: kondisi, item_bermasalah });
                            }
                        }}>
                        <DataTable
                            columns={["Tanggal", "Kondisi", "Item Bermasalah"]}
                            rows={mesin.checklists || []}
                            emptyText="Belum ada data checklist."
                            renderRow={(c) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                    <Td>{formatDate(c.tanggal)}</Td>
                                    <Td>
                                        {c.kondisi_baik
                                            ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> BAIK</span>
                                            : <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><AlertTriangle className="w-3.5 h-3.5" /> BERMASALAH</span>
                                        }
                                    </Td>
                                    <Td className="text-gray-500">{c.item_bermasalah || "-"}</Td>
                                </tr>
                            )}
                        />
                    </TabSection>
                )}

                {/* === TAB BBM === */}
                {activeTab === "bbm" && (
                    <TabSection title="Log BBM (10 Terakhir)" actionLabel="Catat BBM"
                        onAction={() => {
                            const tanggal = prompt("Tanggal (YYYY-MM-DD):", todayStr());
                            const liter = prompt("Jumlah Liter:", "0");
                            const biaya = prompt("Total Biaya (Rp):", "0");
                            if (tanggal && liter) {
                                router.post(route("production.mesin.record-bbm", mesin.id), { tanggal, liter: Number(liter), biaya: Number(biaya) });
                            }
                        }}>
                        <DataTable
                            columns={["Tanggal", "Liter", "Total Biaya", "Harga/Liter"]}
                            rows={mesin.bbm_logs || []}
                            emptyText="Belum ada log BBM."
                            renderRow={(b) => (
                                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                    <Td>{formatDate(b.tanggal)}</Td>
                                    <Td className="font-medium">{b.liter} L</Td>
                                    <Td>{formatRupiah(b.biaya)}</Td>
                                    <Td className="text-gray-500">{b.liter ? formatRupiah(b.biaya / b.liter) + "/L" : "-"}</Td>
                                </tr>
                            )}
                        />
                    </TabSection>
                )}

                {/* === TAB DOWNTIME === */}
                {activeTab === "downtime" && (
                    <TabSection title="Downtime (10 Terakhir)">
                        <DataTable
                            columns={["Mulai", "Selesai", "Durasi", "Kategori", "Penyebab", "Aksi"]}
                            rows={mesin.downtimes || []}
                            emptyText="Belum ada riwayat downtime."
                            renderRow={(d) => {
                                const mulai = new Date(d.mulai);
                                const selesai = d.selesai ? new Date(d.selesai) : null;
                                const durasi = selesai ? Math.round((selesai - mulai) / 60000) : null;
                                return (
                                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                        <Td>{formatDatetime(d.mulai)}</Td>
                                        <Td>{d.selesai ? formatDatetime(d.selesai) : <span className="text-amber-600 font-medium text-xs">Sedang Berlangsung</span>}</Td>
                                        <Td>{durasi !== null ? `${durasi} menit` : "-"}</Td>
                                        <Td><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{d.kategori?.replace("_", " ")}</span></Td>
                                        <Td className="text-gray-600">{d.penyebab}</Td>
                                        <Td>
                                            {!d.selesai && (
                                                <button onClick={() => handleEndDowntime(d.id)}
                                                    className="text-xs text-blue-600 hover:underline font-medium">Selesaikan</button>
                                            )}
                                        </Td>
                                    </tr>
                                );
                            }}
                        />
                    </TabSection>
                )}

                {/* === TAB SESSIONS === */}
                {activeTab === "sessions" && (
                    <TabSection title="Sesi Produksi (10 Terakhir)">
                        <DataTable
                            columns={["Mulai", "Selesai", "Produk", "Output", "Status", "Aksi"]}
                            rows={mesin.production_sessions || []}
                            emptyText="Belum ada sesi produksi."
                            renderRow={(s) => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <Td>{formatDatetime(s.mulai)}</Td>
                                    <Td>{s.selesai ? formatDatetime(s.selesai) : <span className="text-blue-600 text-xs font-medium">Berjalan</span>}</Td>
                                    <Td className="font-medium">{s.produk?.nama || "-"}</Td>
                                    <Td>{s.hasil_output ? `${s.hasil_output} ${s.produk?.satuan_output || ""}` : "-"}</Td>
                                    <Td>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SESSION_STATUS_BADGE[s.status]}`}>
                                            {s.status?.toUpperCase()}
                                        </span>
                                    </Td>
                                    <Td>
                                        <Link href={route("production.sessions.show", s.id)} className="text-xs text-blue-600 hover:underline font-medium">
                                            Detail
                                        </Link>
                                    </Td>
                                </tr>
                            )}
                        />
                    </TabSection>
                )}
            </div>
        </Layout>
    );
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function StatCard({ icon, label, value, unit, bg }) {
    return (
        <div className={`${bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500 font-medium">{label}</span></div>
            <p className="text-2xl font-bold text-gray-800">{value} <span className="text-sm font-normal text-gray-500">{unit}</span></p>
        </div>
    );
}

function DField({ label, value }) {
    return (
        <div className="flex gap-2">
            <dt className="text-sm text-gray-500 w-40 shrink-0">{label}</dt>
            <dd className="text-sm font-medium text-gray-800">{value ?? "-"}</dd>
        </div>
    );
}

function Td({ children, className = "" }) {
    return <td className={`px-4 py-3 text-sm text-gray-700 ${className}`}>{children}</td>;
}

function TabSection({ title, actionLabel, onAction, children }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                {actionLabel && (
                    <button onClick={onAction}
                        className="flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors font-medium">
                        + {actionLabel}
                    </button>
                )}
            </div>
            {children}
        </div>
    );
}

function DataTable({ columns, rows, emptyText, renderRow }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                    <tr>{columns.map((c) => <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {rows.length === 0
                        ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-400">{emptyText}</td></tr>
                        : rows.map(renderRow)
                    }
                </tbody>
            </table>
        </div>
    );
}
