import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeft } from 'lucide-react';

const KATEGORI = [
    { value: 'bahan_baku', label: 'Bahan Baku' },
    { value: 'sparepart', label: 'Sparepart' },
    { value: 'sdm_tetap', label: 'SDM Tetap' },
    { value: 'sdm_kondisional', label: 'SDM Kondisional' },
    { value: 'lainnya', label: 'Lainnya' },
];

export default function Create({ proyeks, selectedProyek }) {
    const { data, setData, post, processing, errors } = useForm({
        proyek_id: selectedProyek ?? '',
        kategori: 'bahan_baku',
        rencana: '',
        catatan: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('core.rab.store'));
    };

    return (
        <Layout title="Tambah RAB">
            <div className="p-6 max-w-2xl space-y-4">
                <div className="flex items-center gap-2">
                    <Link href={route('core.proyek.index')} className="text-gray-600 hover:text-gray-800">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-800">Tambah RAB</h1>
                </div>

                <form onSubmit={submit} className="space-y-4 rounded bg-white p-5 shadow-sm">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Proyek</label>
                        <select
                            className="w-full rounded border-gray-300 text-sm"
                            value={data.proyek_id}
                            onChange={(e) => setData('proyek_id', e.target.value)}
                        >
                            <option value="">-- Pilih proyek --</option>
                            {proyeks.map((p) => (
                                <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                        </select>
                        {errors.proyek_id && <p className="mt-1 text-xs text-red-600">{errors.proyek_id}</p>}
                        <p className="mt-1 text-xs text-gray-500">RAB pada level proyek (titik kosong) berlaku untuk seluruh titik proyek.</p>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
                        <select
                            className="w-full rounded border-gray-300 text-sm"
                            value={data.kategori}
                            onChange={(e) => setData('kategori', e.target.value)}
                        >
                            {KATEGORI.map((k) => (
                                <option key={k.value} value={k.value}>{k.label}</option>
                            ))}
                        </select>
                        {errors.kategori && <p className="mt-1 text-xs text-red-600">{errors.kategori}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Rencana (Rp)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full rounded border-gray-300 text-sm"
                            value={data.rencana}
                            onChange={(e) => setData('rencana', e.target.value)}
                        />
                        {errors.rencana && <p className="mt-1 text-xs text-red-600">{errors.rencana}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Catatan</label>
                        <textarea
                            className="w-full rounded border-gray-300 text-sm"
                            rows={3}
                            value={data.catatan}
                            onChange={(e) => setData('catatan', e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Link href={route('core.proyek.index')} className="rounded border px-4 py-2 text-sm">
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
