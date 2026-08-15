import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft } from 'lucide-react';

export default function Create({ checkableType, checkableId, checkable }) {
    const { data, setData, post, errors, processing } = useForm({
        checkable_type: checkableType,
        checkable_id: checkableId,
        tanggal: new Date().toISOString().split('T')[0],
        kondisi_baik: true,
        item_bermasalah: '',
        dicatat_oleh_karyawan_id: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('fleet.checklist.store'));
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Checklist Harian</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded border">
                        <div className="text-sm font-medium">Unit: {checkable?.nama || checkable?.plat_nomor || '-'}</div>
                        <div className="text-sm text-gray-600">Tipe: {checkableType === 'armada' ? 'Armada' : 'Mesin Produksi'}</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) => setData('tanggal', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="kondisi_baik"
                            checked={data.kondisi_baik}
                            onChange={(e) => setData('kondisi_baik', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="kondisi_baik" className="text-sm font-medium text-gray-700">Kondisi Baik</label>
                    </div>

                    {!data.kondisi_baik && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Bermasalah *</label>
                            <textarea
                                value={data.item_bermasalah}
                                onChange={(e) => setData('item_bermasalah', e.target.value)}
                                rows="2"
                                placeholder="Jelaskan masalah yang ditemukan..."
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.item_bermasalah && <p className="text-red-600 text-sm mt-1">{errors.item_bermasalah}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Petugas *</label>
                        <select
                            value={data.dicatat_oleh_karyawan_id}
                            onChange={(e) => setData('dicatat_oleh_karyawan_id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Petugas</option>
                            {/* Daftar karyawan akan diisi dari backend */}
                        </select>
                        {errors.dicatat_oleh_karyawan_id && <p className="text-red-600 text-sm mt-1">{errors.dicatat_oleh_karyawan_id}</p>}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => window.history.back()} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}