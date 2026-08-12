import React, { useState, useEffect } from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Play, ChevronRight } from "lucide-react";

export default function Create({ mesins, produks, operator, titiks }) {
    const { data, setData, post, processing, errors } = useForm({
        mesin_id:             "",
        titik_id:             "",
        produk_id:            "",
        operator_karyawan_id: "",
        catatan:              "",
    });

    /* Auto-fill titik & produk dari mesin yang dipilih */
    useEffect(() => {
        if (!data.mesin_id) return;
        const mesin = mesins.find(m => m.id === data.mesin_id);
        if (mesin) {
            setData(prev => ({
                ...prev,
                titik_id:  mesin.titik_id  || prev.titik_id,
                produk_id: mesin.produk_id || prev.produk_id,
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.mesin_id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("production.sessions.store"));
    };

    const selectedMesin = mesins.find(m => m.id === data.mesin_id);

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route("production.sessions.index")} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Mulai Sesi Produksi</h1>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Mesin */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <h2 className="text-base font-semibold text-gray-800 pb-3 border-b border-gray-100">Konfigurasi Sesi</h2>

                        {/* Mesin */}
                        <Field label="Mesin Produksi" required error={errors.mesin_id} hint="Hanya mesin berstatus Aktif">
                            <select value={data.mesin_id} onChange={e => setData("mesin_id", e.target.value)}
                                className={cls(errors.mesin_id)}>
                                <option value="">-- Pilih Mesin --</option>
                                {mesins.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.nama} — {m.jenis?.replace("_", " ")} {m.kapasitas ? `(${m.kapasitas})` : ""}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* Mesin info card */}
                        {selectedMesin && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-4">
                                <div className="flex-1 grid grid-cols-3 gap-3 text-sm">
                                    <div><p className="text-xs text-gray-500">Jenis</p><p className="font-medium">{selectedMesin.jenis?.replace("_", " ")}</p></div>
                                    <div><p className="text-xs text-gray-500">Kapasitas</p><p className="font-medium">{selectedMesin.kapasitas || "-"}</p></div>
                                    <div><p className="text-xs text-gray-500">Biaya/Jam</p><p className="font-medium text-blue-700">Rp {Number(selectedMesin.biaya_per_jam || 0).toLocaleString("id-ID")}</p></div>
                                </div>
                            </div>
                        )}

                        {/* Titik Lokasi */}
                        <Field label="Titik Lokasi" required error={errors.titik_id}>
                            <select value={data.titik_id} onChange={e => setData("titik_id", e.target.value)}
                                className={cls(errors.titik_id)}>
                                <option value="">-- Pilih Titik Lokasi --</option>
                                {titiks.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                            </select>
                            {data.mesin_id && selectedMesin?.titik_id === data.titik_id && (
                                <p className="text-xs text-blue-600 mt-1">✓ Auto-filled dari titik mesin</p>
                            )}
                        </Field>

                        {/* Produk */}
                        <Field label="Produk Output" required error={errors.produk_id}>
                            <select value={data.produk_id} onChange={e => setData("produk_id", e.target.value)}
                                className={cls(errors.produk_id)}>
                                <option value="">-- Pilih Produk --</option>
                                {produks.map(p => (
                                    <option key={p.id} value={p.id}>{p.nama} ({p.satuan_output})</option>
                                ))}
                            </select>
                            {data.mesin_id && selectedMesin?.produk_id === data.produk_id && data.produk_id && (
                                <p className="text-xs text-blue-600 mt-1">✓ Auto-filled dari produk default mesin</p>
                            )}
                        </Field>

                        {/* Operator */}
                        <Field label="Operator" required error={errors.operator_karyawan_id}>
                            <select value={data.operator_karyawan_id} onChange={e => setData("operator_karyawan_id", e.target.value)}
                                className={cls(errors.operator_karyawan_id)}>
                                <option value="">-- Pilih Operator --</option>
                                {operator.map(k => (
                                    <option key={k.id} value={k.id}>{k.nama} ({k.tipe})</option>
                                ))}
                            </select>
                        </Field>

                        {/* Catatan */}
                        <Field label="Catatan" error={errors.catatan}>
                            <textarea rows={2} value={data.catatan} onChange={e => setData("catatan", e.target.value)}
                                placeholder="Catatan tambahan (opsional)..."
                                className={cls(errors.catatan) + " resize-none"} />
                        </Field>
                    </div>

                    {/* Info box */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                        <Play className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-emerald-800">Setelah klik "Mulai Sesi":</p>
                            <ul className="text-sm text-emerald-700 mt-1 space-y-0.5 list-disc list-inside">
                                <li>Status sesi menjadi <strong>Berjalan</strong></li>
                                <li>Waktu mulai dicatat otomatis (sekarang)</li>
                                <li>Anda akan diarahkan ke halaman detail sesi</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Link href={route("production.sessions.index")}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                            <Play className="w-4 h-4" />
                            {processing ? "Memulai..." : "Mulai Sesi Sekarang"}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

function cls(err) {
    return `w-full rounded-lg border px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 ${err ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300 focus:border-blue-400"}`;
}
function Field({ label, required, hint, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
                {hint && <span className="ml-1 text-xs text-gray-400 font-normal">({hint})</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
