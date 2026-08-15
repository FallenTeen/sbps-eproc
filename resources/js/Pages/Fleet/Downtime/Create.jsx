import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft } from 'lucide-react';

export default function Create({ serviceableTypes, serviceables, serviceableType, serviceableId }) {
    const { data, setData, post, errors, processing } = useForm({
        serviceable_type: serviceableType || '',
        serviceable_id: serviceableId || '',
        penyebab: '',
        kategori: 'kerusakan',
        catatan: '',
    });

    const availableServiceables = data.serviceable_type
        ? (serviceables?.[data.serviceable_type] || [])
        : [];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('fleet.downtime.store'));
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Mulai Downtime</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Unit *</label>
                        <select
                            value={data.serviceable_type}
                            onChange={(e) => setData('serviceable_type', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Tipe</option>
                            {(serviceableTypes || []).map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        {errors.serviceable_type && <p className="text-red-600 text-sm mt-1">{errors.serviceable_type}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                        <select
                            value={data.serviceable_id}
                            onChange={(e) => setData('serviceable_id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!data.serviceable_type}
                        >
                            <option value="">Pilih Unit</option>
                            {availableServiceables.map((item) => (
                                <option key={item.id} value={item.id}>{item.nama || item.kode_unit || item.plat_nomor}</option>
                            ))}
                        </select>
                        {errors.serviceable_id && <p className="text-red-600 text-sm mt-1">{errors.serviceable_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                        <select
                            value={data.kategori}
                            onChange={(e) => setData('kategori', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="kerusakan">Kerusakan</option>
                            <option value="menunggu_sparepart">Menunggu Sparepart</option>
                            <option value="lainnya">Lainnya</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Penyebab *</label>
                        <input
                            type="text"
                            value={data.penyebab}
                            onChange={(e) => setData('penyebab', e.target.value)}
                            placeholder="Jelaskan penyebab downtime..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.penyebab && <p className="text-red-600 text-sm mt-1">{errors.penyebab}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea
                            value={data.catatan}
                            onChange={(e) => setData('catatan', e.target.value)}
                            rows="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => window.history.back()} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={processing} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50">
                        {processing ? 'Menyimpan...' : 'Mulai Downtime'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}