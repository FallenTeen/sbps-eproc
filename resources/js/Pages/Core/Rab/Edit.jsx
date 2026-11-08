import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeft } from 'lucide-react';

export default function Edit({ rab, proyeks }) {
    const { data, setData, put, processing, errors } = useForm({
        rencana: rab.rencana ?? '',
        catatan: rab.catatan ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('core.rab.update', rab.id));
    };

    return (
        <Layout title="Ubah RAB">
            <div className="p-6 max-w-2xl space-y-4">
                <div className="flex items-center gap-2">
                    <Link href={route('core.rab.show', rab.id)} className="text-gray-600 hover:text-gray-800">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-800">Ubah RAB</h1>
                </div>

                <form onSubmit={submit} className="space-y-4 rounded bg-white p-5 shadow-sm">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="block text-gray-500">Proyek</span>
                            <span className="font-medium">{rab.proyek?.nama ?? '-'}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500">Kategori</span>
                            <span className="font-medium">{rab.kategori}</span>
                        </div>
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
                        <Link href={route('core.rab.show', rab.id)} className="rounded border px-4 py-2 text-sm">
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
