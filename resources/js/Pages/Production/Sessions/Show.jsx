import React, { useState, useEffect } from "react";
import { Link, useForm, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft, Play, StopCircle, XCircle, Plus, Trash2,
    TrendingUp, TrendingDown, DollarSign, Package, Clock, CheckCircle2, FlaskConical, Truck
} from "lucide-react";

/* ---------- Helpers ---------- */
function fmt(n) {
    return "Rp " + Number(n || 0).toLocaleString("id-ID");
}
function fmtDT(d) {
    if (!d) return "-";
    return new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function liveDurasi(mulai) {
    if (!mulai) return null;
    const mins = Math.round((Date.now() - new Date(mulai)) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
}

/* ---------- Status Config ---------- */
const STATUS_CFG = {
    berjalan:   { cls: "bg-blue-600 text-white",    icon: Play,          label: "SEDANG BERJALAN" },
    selesai:    { cls: "bg-emerald-600 text-white", icon: CheckCircle2,  label: "SELESAI" },
    dibatalkan: { cls: "bg-gray-400 text-white",    icon: XCircle,       label: "DIBATALKAN" },
};

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function Show({ session, biaya, pendapatan, margin, resep, bahanBakus }) {
    const isRunning  = session.status === "berjalan";
    const isFinished = session.status === "selesai";
    const cfg = STATUS_CFG[session.status] || STATUS_CFG.dibatalkan;
    const StatusIcon = cfg.icon;

    const [durasi, setDurasi] = useState(liveDurasi(session.mulai));

    /* Live timer jika masih berjalan */
    useEffect(() => {
        if (!isRunning) return;
        const t = setInterval(() => setDurasi(liveDurasi(session.mulai)), 30000);
        return () => clearInterval(t);
    }, [isRunning, session.mulai]);

    const handleCancel = () => {
        if (confirm("Batalkan sesi produksi ini?")) {
            router.post(route("production.sessions.cancel", session.id));
        }
    };

    return (
        <Layout>
            {/* ---- Header ---- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href={route("production.sessions.index")} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Detail Sesi Produksi</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {session.mesin?.nama} · {session.produk?.nama}
                        </p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.cls}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${isRunning ? "animate-pulse" : ""}`} />
                        {cfg.label}
                    </span>
                </div>
                {isRunning && (
                    <button onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors">
                        <XCircle className="w-4 h-4" /> Batalkan Sesi
                    </button>
                )}
            </div>

            {/* ---- Info Cards Row ---- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <InfoCard label="Mulai" value={fmtDT(session.mulai)} icon={<Play className="w-4 h-4 text-blue-500" />} />
                <InfoCard label={isRunning ? "Durasi Berjalan" : "Selesai"} value={isRunning ? durasi : fmtDT(session.selesai)} icon={<Clock className="w-4 h-4 text-amber-500" />} />
                <InfoCard label="Output" value={session.hasil_output != null ? `${session.hasil_output} ${session.produk?.satuan_output}` : "-"} icon={<Package className="w-4 h-4 text-emerald-500" />} />
                <InfoCard label="Operator" value={session.operator?.nama || "-"} icon={<CheckCircle2 className="w-4 h-4 text-purple-500" />} />
            </div>

            {/* ============================================================
                BERJALAN: Form Akhiri Sesi
            ============================================================ */}
            {isRunning && (
                <EndSessionPanel session={session} resep={resep} bahanBakus={bahanBakus} />
            )}

            {/* ============================================================
                SELESAI: Ringkasan Finansial + Items
            ============================================================ */}
            {isFinished && (
                <FinishedView session={session} biaya={biaya} pendapatan={pendapatan} margin={margin} />
            )}

            {/* ============================================================
                DIBATALKAN
            ============================================================ */}
            {session.status === "dibatalkan" && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                    <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Sesi ini telah dibatalkan.</p>
                    {session.catatan && <p className="text-sm text-gray-400 mt-2">{session.catatan}</p>}
                </div>
            )}
        </Layout>
    );
}

/* ============================================================
   PANEL: AKHIRI SESI
============================================================ */
function EndSessionPanel({ session, resep, bahanBakus }) {
    const { data, setData, post, processing, errors } = useForm({
        hasil_output: "",
        catatan:      session.catatan || "",
        items:        [],
    });

    useEffect(() => {
        const output = parseFloat(data.hasil_output);
        if (!output || isNaN(output) || resep.length === 0) return;
        const suggested = resep.map(r => ({
            bahan_baku_id:  r.bahan_baku_id,
            nama_bahan:     r.bahan_baku?.nama,
            satuan:         r.bahan_baku?.satuan,
            jumlah_terpakai: parseFloat((r.jumlah_per_unit_output * output).toFixed(4)),
        }));
        setData("items", suggested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.hasil_output]);

    const updateItem = (i, field, val) => {
        const items = [...data.items];
        items[i] = { ...items[i], [field]: val };
        setData("items", items);
    };
    const addItem = () => setData("items", [...data.items, { bahan_baku_id: "", nama_bahan: "", satuan: "", jumlah_terpakai: "" }]);
    const removeItem = (i) => setData("items", data.items.filter((_, idx) => idx !== i));

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("production.sessions.end", session.id));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
                <StopCircle className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-amber-800">Akhiri Sesi Produksi</p>
                    <p className="text-xs text-amber-700 mt-0.5">Pastikan data output dan konsumsi bahan baku sudah benar. Stok akan <strong>otomatis berkurang</strong>.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-5 pb-3 border-b border-gray-100">Data Output</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hasil Output ({session.produk?.satuan_output}) *</label>
                        <input type="number" step="0.01" min="0.01" value={data.hasil_output} onChange={e => setData("hasil_output", e.target.value)} placeholder="Contoh: 150" className={`w-full rounded-lg border px-4 py-2.5 text-sm ${errors.hasil_output ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300 focus:outline-none"}`} />
                        {errors.hasil_output && <p className="text-xs text-red-500 mt-1">{errors.hasil_output}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Akhir</label>
                        <textarea rows={2} value={data.catatan} onChange={e => setData("catatan", e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-blue-300 focus:outline-none resize-none" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                    <div><h3 className="text-base font-semibold text-gray-800">Konsumsi Bahan Baku</h3></div>
                    <button type="button" onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
                        <Plus className="w-3.5 h-3.5" /> Tambah Baris
                    </button>
                </div>

                {data.items.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400">Isi hasil output terlebih dahulu untuk auto-generate dari resep.</div>
                ) : (
                    <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                            <div className="col-span-5 text-xs font-semibold text-gray-500 uppercase">Bahan Baku</div>
                            <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase">Jumlah Terpakai</div>
                            <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase">Satuan</div>
                        </div>
                        {data.items.map((item, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                                <div className="col-span-5">
                                    <select value={item.bahan_baku_id} onChange={e => { const bb = bahanBakus.find(b => b.id === e.target.value); updateItem(i, "bahan_baku_id", e.target.value); if (bb) updateItem(i, "satuan", bb.satuan); }} className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:ring-blue-300">
                                        <option value="">-- Bahan --</option>
                                        {bahanBakus.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <input type="number" step="0.0001" min="0" value={item.jumlah_terpakai} onChange={e => updateItem(i, "jumlah_terpakai", e.target.value)} className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:ring-blue-300 font-mono" />
                                </div>
                                <div className="col-span-3 text-xs text-gray-500">{item.satuan || "-"}</div>
                                <div className="col-span-1 flex justify-end">
                                    <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={processing} className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md shadow-red-200 disabled:opacity-50">
                    <StopCircle className="w-5 h-5" /> {processing ? "Mengakhiri..." : "Akhiri Sesi & Simpan"}
                </button>
            </div>
        </form>
    );
}

/* ============================================================
   VIEW: SESI SELESAI
============================================================ */
function FinishedView({ session, biaya, pendapatan, margin }) {
    const marginPositif = margin != null && margin >= 0;
    const isBetonCor = session.produk?.kategori === "beton_cor";

    const [showQcModal, setShowQcModal] = useState(false);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
                {isBetonCor && (
                    <button onClick={() => setShowQcModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
                        <FlaskConical className="w-4 h-4" /> Catat Sample QC
                    </button>
                )}
                <button onClick={() => setShowDeliveryModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                    <Truck className="w-4 h-4" /> Jadwalkan Pengiriman
                </button>
                <Link href={route('production.pengiriman.create')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                     Buka Form Pengiriman Penuh
                </Link>
            </div>

            {/* Finansial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FinCard label="Total Biaya Produksi" value={biaya} icon={<DollarSign className="w-5 h-5 text-red-500" />} bg="bg-red-50" valueColor="text-red-700" />
                <FinCard label="Estimasi Pendapatan" value={pendapatan} icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} bg="bg-emerald-50" valueColor="text-emerald-700" />
                <FinCard label="Margin (Pendapatan − Biaya)" value={margin} icon={marginPositif ? <TrendingUp className="w-5 h-5 text-blue-500" /> : <TrendingDown className="w-5 h-5 text-orange-500" />} bg={marginPositif ? "bg-blue-50" : "bg-orange-50"} valueColor={marginPositif ? "text-blue-700" : "text-orange-700"} />
            </div>

            {/* Items Konsumsi */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-gray-800">Konsumsi Bahan Baku Aktual</h3></div>
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>{["#", "Bahan Baku", "Kode", "Satuan", "Jumlah Terpakai"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {(session.items || []).length === 0 ? (
                            <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Tidak ada data konsumsi bahan baku.</td></tr>
                        ) : (session.items || []).map((item, i) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-5 py-3.5 text-sm text-gray-400">{i + 1}</td>
                                <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{item.bahan_baku?.nama}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-500">{item.bahan_baku?.kode}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-500">{item.bahan_baku?.satuan}</td>
                                <td className="px-5 py-3.5 text-sm font-bold text-gray-800">{item.jumlah_terpakai}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* QC Samples */}
            {(session.qc_samples || []).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-gray-800">Sampel QC</h3></div>
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>{["Tanggal Ambil", "Umur Uji (hari)", "Kuat Tekan Target", "Kuat Tekan Aktual", "Status"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(session.qc_samples || []).map(qc => (
                                <tr key={qc.id}>
                                    <td className="px-5 py-3.5 text-sm">{new Date(qc.tanggal_ambil).toLocaleDateString("id-ID")}</td>
                                    <td className="px-5 py-3.5 text-sm">{qc.umur_uji}</td>
                                    <td className="px-5 py-3.5 text-sm">{qc.kuat_tekan_target} MPa</td>
                                    <td className="px-5 py-3.5 text-sm font-bold">{qc.kuat_tekan_aktual ?? "-"} {qc.kuat_tekan_aktual ? "MPa" : ""}</td>
                                    <td className="px-5 py-3.5">
                                        {qc.kuat_tekan_aktual != null
                                            ? qc.kuat_tekan_aktual >= qc.kuat_tekan_target
                                                ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">LULUS</span>
                                                : <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">GAGAL</span>
                                            : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">MENUNGGU</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pengiriman (if any) */}
            {(session.pengirimans || []).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-gray-800">Riwayat Pengiriman</h3></div>
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>{["Waktu Muat", "Tujuan", "Armada", "Status", ""].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(session.pengirimans || []).map(p => (
                                <tr key={p.id}>
                                    <td className="px-5 py-3.5 text-sm">{fmtDT(p.waktu_muat)}</td>
                                    <td className="px-5 py-3.5 text-sm">{p.tujuan_alamat}</td>
                                    <td className="px-5 py-3.5 text-sm">{p.armada?.nopol ?? "-"}</td>
                                    <td className="px-5 py-3.5 text-sm font-bold">{p.status?.replace("_", " ").toUpperCase()}</td>
                                    <td className="px-5 py-3.5 text-right"><Link href={route('production.pengiriman.show', p.id)} className="text-blue-600 hover:underline text-sm font-medium">Detail</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showQcModal && <QcSampleModal session={session} onClose={() => setShowQcModal(false)} />}
            {showDeliveryModal && <DeliveryScheduleModal session={session} onClose={() => setShowDeliveryModal(false)} />}
        </div>
    );
}

/* ---- Modals ---- */
function QcSampleModal({ session, onClose }) {
    // Default +28 hari
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 28);

    const { data, setData, post, processing, errors } = useForm({
        production_session_id: session.id,
        jenis_uji: 'uji_tekan',
        nilai_slump: '',
        tanggal_uji_tekan_rencana: defaultDate.toISOString().split('T')[0],
        catatan: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('production.qc.store'), {
            onSuccess: onClose
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Catat Sample QC</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Uji *</label>
                        <select value={data.jenis_uji} onChange={e => setData('jenis_uji', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-300">
                            <option value="uji_tekan">Uji Tekan</option>
                            <option value="slump_test">Slump Test</option>
                        </select>
                        {errors.jenis_uji && <p className="text-xs text-red-500 mt-1">{errors.jenis_uji}</p>}
                    </div>
                    {data.jenis_uji === 'slump_test' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nilai Slump (cm)</label>
                            <input type="number" step="0.1" value={data.nilai_slump} onChange={e => setData('nilai_slump', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-300" />
                            {errors.nilai_slump && <p className="text-xs text-red-500 mt-1">{errors.nilai_slump}</p>}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Rencana Uji *</label>
                        <input type="date" value={data.tanggal_uji_tekan_rencana} onChange={e => setData('tanggal_uji_tekan_rencana', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-300" />
                        {errors.tanggal_uji_tekan_rencana && <p className="text-xs text-red-500 mt-1">{errors.tanggal_uji_tekan_rencana}</p>}
                        <p className="text-xs text-gray-500 mt-1">Default 28 hari dari sekarang.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
                        <textarea value={data.catatan} onChange={e => setData('catatan', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-300" rows={2} />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Batal</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50">Simpan Sample</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeliveryScheduleModal({ session, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        production_session_id: session.id,
        tujuan_alamat: '',
        waktu_muat: new Date().toISOString().slice(0, 16),
        catatan: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('production.pengiriman.store'), {
            onSuccess: onClose
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Jadwalkan Pengiriman Cepat</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tujuan (Alamat) *</label>
                        <input type="text" value={data.tujuan_alamat} onChange={e => setData('tujuan_alamat', e.target.value)} required className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300" />
                        {errors.tujuan_alamat && <p className="text-xs text-red-500 mt-1">{errors.tujuan_alamat}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Waktu Muat *</label>
                        <input type="datetime-local" value={data.waktu_muat} onChange={e => setData('waktu_muat', e.target.value)} required className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300" />
                        {errors.waktu_muat && <p className="text-xs text-red-500 mt-1">{errors.waktu_muat}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
                        <textarea value={data.catatan} onChange={e => setData('catatan', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300" rows={2} />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Batal</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50">Jadwalkan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---- Sub-components ---- */
function InfoCard({ label, value, icon }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500 font-medium">{label}</span></div>
            <p className="text-sm font-semibold text-gray-800 mt-1">{value ?? "-"}</p>
        </div>
    );
}
function FinCard({ label, value, icon, bg, valueColor }) {
    return (
        <div className={`${bg} rounded-xl border border-gray-100 p-5`}>
            <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-600 font-medium">{label}</span></div>
            <p className={`text-xl font-bold ${valueColor}`}>
                {value != null ? "Rp " + Number(value).toLocaleString("id-ID") : "-"}
            </p>
        </div>
    );
}
