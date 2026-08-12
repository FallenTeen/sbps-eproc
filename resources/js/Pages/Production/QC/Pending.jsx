import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { FlaskConical, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function Pending({ samples }) {
    const [selectedSample, setSelectedSample] = useState(null);

    const getStatusInfo = (tglRencana) => {
        if (!tglRencana) return null;
        const hariIni = new Date();
        hariIni.setHours(0, 0, 0, 0);
        const rencana = new Date(tglRencana);
        rencana.setHours(0, 0, 0, 0);

        const diffTime = rencana - hariIni;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: 'Terlambat Uji', color: 'bg-red-100 text-red-700 border-red-200' };
        } else if (diffDays === 0) {
            return { label: 'Uji Hari Ini', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        } else if (diffDays === 1) {
            return { label: 'Besok (H-1)', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
        } else {
            return { label: `H-${diffDays}`, color: 'bg-blue-50 text-blue-700 border-blue-200' };
        }
    };

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pending QC (Uji Tekan)</h1>
                <p className="text-sm text-gray-500 mt-1">Daftar sample beton cor yang menunggu hasil uji tekan.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tgl Ambil</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk / Sesi</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tgl Rencana Uji</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status/Reminder</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {samples.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">Tidak ada sample pending.</td></tr>
                        ) : samples.map(sample => {
                            const st = getStatusInfo(sample.tanggal_uji_tekan_rencana);
                            return (
                                <tr key={sample.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-700">{new Date(sample.tanggal_ambil).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{sample.session?.produk?.nama}</div>
                                        <div className="text-xs text-gray-500">Sesi: #{sample.production_session_id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{sample.kuat_tekan_target} MPa<br/><span className="text-xs font-normal text-gray-500">{sample.umur_uji} Hari</span></td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{sample.tanggal_uji_tekan_rencana ? new Date(sample.tanggal_uji_tekan_rencana).toLocaleDateString('id-ID') : '-'}</td>
                                    <td className="px-6 py-4">
                                        {st ? (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${st.color}`}>
                                                {st.label}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setSelectedSample(sample)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                                            Catat Hasil
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedSample && <RecordResultModal sample={selectedSample} onClose={() => setSelectedSample(null)} />}
        </Layout>
    );
}

function RecordResultModal({ sample, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        hasil_uji_tekan: '',
        target_mpa: sample.kuat_tekan_target || '',
        catatan: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('production.qc.record-result', sample.id), {
            onSuccess: onClose
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FlaskConical className="w-5 h-5 text-indigo-600"/> Input Hasil Uji Tekan</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-2 border border-blue-100">
                        <span className="font-semibold block mb-1">Target: {sample.kuat_tekan_target} MPa</span>
                        Jika hasil aktual &gt;= target, maka status otomatis <strong>Lolos</strong>.
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hasil Aktual (MPa) *</label>
                        <input type="number" step="0.01" value={data.hasil_uji_tekan} onChange={e => setData('hasil_uji_tekan', e.target.value)} required className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-300 font-mono text-lg" placeholder="Contoh: 25.5" />
                        {errors.hasil_uji_tekan && <p className="text-xs text-red-500 mt-1">{errors.hasil_uji_tekan}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ubah Target MPa (Opsional)</label>
                        <input type="number" step="0.1" value={data.target_mpa} onChange={e => setData('target_mpa', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-300" />
                        <p className="text-xs text-gray-500 mt-1">Hanya diisi jika target aktual berbeda dari standar produk.</p>
                        {errors.target_mpa && <p className="text-xs text-red-500 mt-1">{errors.target_mpa}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Tambahan</label>
                        <textarea value={data.catatan} onChange={e => setData('catatan', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-300" rows={2} />
                    </div>
                    
                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Batal</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4"/> Simpan Hasil
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
