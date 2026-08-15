import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft } from 'lucide-react';

export default function Create({ serviceableTypes, serviceables, serviceableType, serviceableId }) {
    const { data, setData, post, errors, processing } = useForm({
        serviceable_type: serviceableType || '',
        serviceable_id: serviceableId || '',
        tanggal: new Date().toISOString().split('T')[0],
        liter: '',
        biaya: '',
        jam_operasional_saat_isi: '',
        purchase_order_id: '',
    });

    const availableServiceables = data.serviceable_type
        ? (serviceables?.[data.serviceable_type] || [])
        : [];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('fleet.bbm.store'));
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Catat BBM</h1>
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
                                <option key={item.id} value={item.id}>
                                    {item.nama || item.kode_unit || item.plat_nomor}
                                </option>
                            ))}
                        </select>
                        {errors.serviceable_id && <p className="text-red-600 text-sm mt-1">{errors.serviceable_id}</p>}
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Liter *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.liter}
                            onChange={(e) => setData('liter', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                        />
                        {errors.liter && <p className="text-red-600 text-sm mt-1">{errors.liter}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Biaya</label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.biaya}
                            onChange={(e) => setData('biaya', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jam Operasional Saat Isi</label>
                        <input
                            type="number"
                            step="0.1"
                            value={data.jam_operasional_saat_isi}
                            onChange={(e) => setData('jam_operasional_saat_isi', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referensi PO (opsional)</label>
                        <select
                            value={data.purchase_order_id}
                            onChange={(e) => setData('purchase_order_id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Tidak ada PO</option>
                            {/* Daftar PO akan diisi dari backend */}
                        </select>
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