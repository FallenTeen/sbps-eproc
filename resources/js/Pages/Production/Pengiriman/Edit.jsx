import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { Truck, ArrowLeft, Calendar, User, MapPin, Save } from 'lucide-react';

export default function Edit({ pengiriman, armadas, drivers }) {
    const { data, setData, put, processing, errors } = useForm({
        armada_id: pengiriman.armada_id || '',
        driver_karyawan_id: pengiriman.driver_karyawan_id || '',
        tujuan_alamat: pengiriman.tujuan_alamat,
        waktu_muat: pengiriman.waktu_muat
            ? new Date(pengiriman.waktu_muat).toISOString().slice(0, 16)
            : '',
        catatan: pengiriman.catatan || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('production.pengiriman.update', pengiriman.id));
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('production.pengiriman.show', pengiriman.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ubah Pengiriman</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Ubah jadwal pengiriman #{pengiriman.id} — {pengiriman.session?.produk?.nama}.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2"><Truck className="w-4 h-4 text-gray-400"/> Armada Kendaraan</label>
                            <select value={data.armada_id} onChange={e => setData('armada_id', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300">
                                <option value="">-- Pilih Armada (Opsional) --</option>
                                {armadas.map(a => <option key={a.id} value={a.id}>{a.nopol} - {a.jenis_kendaraan} (Kapasitas: {a.kapasitas_tonase}T)</option>)}
                            </select>
                            {errors.armada_id && <p className="text-xs text-red-500 mt-1">{errors.armada_id}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2"><User className="w-4 h-4 text-gray-400"/> Supir / Driver</label>
                            <select value={data.driver_karyawan_id} onChange={e => setData('driver_karyawan_id', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300">
                                <option value="">-- Pilih Supir (Opsional) --</option>
                                {drivers.map(d => <option key={d.id} value={d.id}>{d.nama} ({d.jabatan})</option>)}
                            </select>
                            {errors.driver_karyawan_id && <p className="text-xs text-red-500 mt-1">{errors.driver_karyawan_id}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400"/> Tujuan Pengiriman *</label>
                            <input type="text" value={data.tujuan_alamat} onChange={e => setData('tujuan_alamat', e.target.value)} required placeholder="Misal: Proyek Gedung A Lt. 3" className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300" />
                            {errors.tujuan_alamat && <p className="text-xs text-red-500 mt-1">{errors.tujuan_alamat}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400"/> Waktu Muat *</label>
                            <input type="datetime-local" value={data.waktu_muat} onChange={e => setData('waktu_muat', e.target.value)} required className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300" />
                            {errors.waktu_muat && <p className="text-xs text-red-500 mt-1">{errors.waktu_muat}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Tambahan</label>
                        <textarea value={data.catatan} onChange={e => setData('catatan', e.target.value)} rows={3} placeholder="Instruksi jalan, rute khusus, dsb..." className="w-full border-gray-300 rounded-lg text-sm focus:ring-blue-300" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Link href={route('production.pengiriman.show', pengiriman.id)} className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}