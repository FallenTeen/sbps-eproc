import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeft } from 'lucide-react';

export default function Create({ unitBisnis }) {
    const { data, setData, post, errors, processing } = useForm({
        unit_bisnis_id: '',
        kode_proyek: '',
        nama: '',
        tipe_proyek: 'internal',
        client: '',
        lokasi: '',
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai_rencana: '',
        tanggal_selesai_aktual: '',
        status: 'aktif',
        catatan: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('core.proyek.store'));
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Tambah Proyek</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kode Proyek *</label>
                        <input
                            type="text"
                            value={data.kode_proyek}
                            onChange={(e) => setData('kode_proyek', e.target.value)}
                            placeholder="PRY-GCS-2026-001"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.kode_proyek && <p className="text-red-600 text-sm mt-1">{errors.kode_proyek}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Proyek *</label>
                        <input
                            type="text"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.nama && <p className="text-red-600 text-sm mt-1">{errors.nama}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Bisnis *</label>
                        <select
                            value={data.unit_bisnis_id}
                            onChange={(e) => setData('unit_bisnis_id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Unit Bisnis</option>
                            {unitBisnis.map((u) => (
                                <option key={u.id} value={u.id}>{u.nama}</option>
                            ))}
                        </select>
                        {errors.unit_bisnis_id && <p className="text-red-600 text-sm mt-1">{errors.unit_bisnis_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Proyek *</label>
                        <select
                            value={data.tipe_proyek}
                            onChange={(e) => setData('tipe_proyek', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="internal">Internal</option>
                            <option value="kontrak_klien">Kontrak Klien</option>
                        </select>
                        {errors.tipe_proyek && <p className="text-red-600 text-sm mt-1">{errors.tipe_proyek}</p>}
                    </div>

                    {data.tipe_proyek === 'kontrak_klien' && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                            <input
                                type="text"
                                value={data.client}
                                onChange={(e) => setData('client', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.client && <p className="text-red-600 text-sm mt-1">{errors.client}</p>}
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                        <input
                            type="text"
                            value={data.lokasi}
                            onChange={(e) => setData('lokasi', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
                        <input
                            type="date"
                            value={data.tanggal_mulai}
                            onChange={(e) => setData('tanggal_mulai', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.tanggal_mulai && <p className="text-red-600 text-sm mt-1">{errors.tanggal_mulai}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai Rencana</label>
                        <input
                            type="date"
                            value={data.tanggal_selesai_rencana}
                            onChange={(e) => setData('tanggal_selesai_rencana', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai Aktual</label>
                        <input
                            type="date"
                            value={data.tanggal_selesai_aktual}
                            onChange={(e) => setData('tanggal_selesai_aktual', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="draft">Draft</option>
                            <option value="aktif">Aktif</option>
                            <option value="selesai">Selesai</option>
                            <option value="dihentikan">Dihentikan</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea
                            value={data.catatan}
                            onChange={(e) => setData('catatan', e.target.value)}
                            rows="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Catatan tambahan tentang proyek..."
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </Layout>
    );
}
