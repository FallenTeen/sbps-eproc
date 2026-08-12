import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Save, Truck, MapPin, User, Calendar, Hash } from 'lucide-react';

function Field({ label, error, required, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

const inputClass =
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
const selectClass = inputClass;

export default function RitaseCreate({ auth, armadaList = [], ruteList = [], driverList = [], proyekList = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        armada_id: '',
        karyawan_id: '',
        rute_tarif_id: '',
        proyek_id: '',
        tanggal: new Date().toISOString().slice(0, 10),
        jumlah_trip: 1,
        total_volume: '',
        muatan: '',
        lokasi_muat: '',
        lokasi_bongkar: '',
        catatan: '',
    });

    // Auto-fill rute info when rute is selected
    const [selectedRute, setSelectedRute] = useState(null);
    const handleRuteChange = (ruteId) => {
        setData('rute_tarif_id', ruteId);
        const rute = ruteList.find((r) => r.id === ruteId);
        if (rute) {
            setSelectedRute(rute);
            setData((prev) => ({
                ...prev,
                rute_tarif_id: ruteId,
                lokasi_muat: rute.lokasi_muat || prev.lokasi_muat,
                lokasi_bongkar: rute.lokasi_bongkar || prev.lokasi_bongkar,
            }));
        } else {
            setSelectedRute(null);
        }
    };

    const estimatedUpah = selectedRute
        ? Number(selectedRute.tarif_per_trip ?? 0) * Number(data.jumlah_trip || 0)
        : 0;

    const submit = (e) => {
        e.preventDefault();
        post(route('fleet.ritase.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('fleet.ritase.index')}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Catat Ritase Harian</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Input trip armada & hitung upah borongan otomatis</p>
                    </div>
                </div>
            }
        >
            <Head title="Catat Ritase" />

            <form onSubmit={submit} className="max-w-4xl mx-auto space-y-6">

                {/* Section: Armada & Driver */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-blue-50 rounded-lg"><Truck className="w-5 h-5 text-blue-600" /></div>
                        <h3 className="text-base font-semibold text-slate-800">Armada & Driver</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Armada" error={errors.armada_id} required>
                            <select
                                value={data.armada_id}
                                onChange={(e) => setData('armada_id', e.target.value)}
                                className={selectClass}
                                required
                            >
                                <option value="">— Pilih Armada —</option>
                                {armadaList.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.nama_unit} ({a.nomor_polisi})
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Driver (Karyawan Borongan)" error={errors.karyawan_id} required>
                            <select
                                value={data.karyawan_id}
                                onChange={(e) => setData('karyawan_id', e.target.value)}
                                className={selectClass}
                                required
                            >
                                <option value="">— Pilih Driver —</option>
                                {driverList.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.nama_lengkap ?? d.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Proyek / Titik" error={errors.proyek_id}>
                            <select
                                value={data.proyek_id}
                                onChange={(e) => setData('proyek_id', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">— Pilih Proyek (opsional) —</option>
                                {proyekList.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nama_proyek}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Tanggal" error={errors.tanggal} required>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) => setData('tanggal', e.target.value)}
                                    className={`${inputClass} pl-9`}
                                    required
                                />
                            </div>
                        </Field>
                    </div>
                </div>

                {/* Section: Rute & Tarif */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-emerald-50 rounded-lg"><MapPin className="w-5 h-5 text-emerald-600" /></div>
                        <h3 className="text-base font-semibold text-slate-800">Rute & Tarif</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Rute Tarif" error={errors.rute_tarif_id} required>
                            <select
                                value={data.rute_tarif_id}
                                onChange={(e) => handleRuteChange(e.target.value)}
                                className={selectClass}
                                required
                            >
                                <option value="">— Pilih Rute —</option>
                                {ruteList.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.nama_rute} — Rp {Number(r.tarif_per_trip).toLocaleString('id-ID')}/trip
                                    </option>
                                ))}
                            </select>
                            {selectedRute && (
                                <div className="mt-2 p-3 bg-emerald-50 rounded-lg text-xs text-emerald-800">
                                    <p className="font-semibold">{selectedRute.nama_rute}</p>
                                    <p>{selectedRute.lokasi_muat} → {selectedRute.lokasi_bongkar}</p>
                                    <p>Tarif: Rp {Number(selectedRute.tarif_per_trip).toLocaleString('id-ID')} / trip</p>
                                </div>
                            )}
                        </Field>

                        <div className="space-y-4">
                            <Field label="Lokasi Muat" error={errors.lokasi_muat}>
                                <input type="text" value={data.lokasi_muat}
                                    onChange={(e) => setData('lokasi_muat', e.target.value)}
                                    placeholder="Otomatis dari rute atau isi manual"
                                    className={inputClass} />
                            </Field>
                            <Field label="Lokasi Bongkar" error={errors.lokasi_bongkar}>
                                <input type="text" value={data.lokasi_bongkar}
                                    onChange={(e) => setData('lokasi_bongkar', e.target.value)}
                                    placeholder="Otomatis dari rute atau isi manual"
                                    className={inputClass} />
                            </Field>
                        </div>
                    </div>
                </div>

                {/* Section: Volume & Trip */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-amber-50 rounded-lg"><Hash className="w-5 h-5 text-amber-600" /></div>
                        <h3 className="text-base font-semibold text-slate-800">Jumlah Trip & Volume</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Field label="Jumlah Trip" error={errors.jumlah_trip} required>
                            <input
                                type="number" min="1"
                                value={data.jumlah_trip}
                                onChange={(e) => setData('jumlah_trip', e.target.value)}
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field label="Total Volume (m³)" error={errors.total_volume}>
                            <input
                                type="number" min="0" step="0.01"
                                value={data.total_volume}
                                onChange={(e) => setData('total_volume', e.target.value)}
                                placeholder="0.00"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Jenis Muatan" error={errors.muatan}>
                            <input
                                type="text"
                                value={data.muatan}
                                onChange={(e) => setData('muatan', e.target.value)}
                                placeholder="Batu split, pasir, dll."
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    {/* Estimasi Upah */}
                    {estimatedUpah > 0 && (
                        <div className="mt-5 flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div>
                                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Estimasi Upah Borongan</p>
                                <p className="text-2xl font-bold text-blue-700 mt-0.5">
                                    Rp {estimatedUpah.toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-blue-500 mt-0.5">
                                    {data.jumlah_trip} trip × Rp {Number(selectedRute?.tarif_per_trip ?? 0).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="text-blue-300">
                                <Truck className="w-10 h-10" />
                            </div>
                        </div>
                    )}

                    <div className="mt-4">
                        <Field label="Catatan" error={errors.catatan}>
                            <textarea
                                value={data.catatan}
                                onChange={(e) => setData('catatan', e.target.value)}
                                rows={2}
                                placeholder="Opsional — kondisi jalan, kendala, dll."
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pb-6">
                    <Link href={route('fleet.ritase.index')}
                        className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                        Batal
                    </Link>
                    <button type="submit" disabled={processing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50">
                        <Save className="w-4 h-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Ritase'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
