import React from 'react';
import { Link } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeft, Edit } from 'lucide-react';

const rupiah = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v || 0));

export default function Show({ rab, realisasi, perbandingan }) {
    const persen = Number(perbandingan?.persentase ?? 0);
    const over = persen > 100;

    return (
        <Layout title="Detail RAB">
            <div className="p-6 max-w-3xl space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={route('core.proyek.index')} className="text-gray-600 hover:text-gray-800">
                            <ArrowLeft size={18} />
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-800">Detail RAB</h1>
                    </div>
                    <Link
                        href={route('core.rab.edit', rab.id)}
                        className="inline-flex items-center gap-2 rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                    >
                        <Edit size={16} /> Ubah
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded bg-white p-5 text-sm shadow-sm">
                    <div>
                        <span className="block text-gray-500">Proyek</span>
                        <span className="font-medium">{rab.proyek?.nama ?? '-'}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Titik</span>
                        <span className="font-medium">{rab.titik?.nama ?? 'Level Proyek'}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Kategori</span>
                        <span className="font-medium">{rab.kategori}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Catatan</span>
                        <span className="font-medium">{rab.catatan ?? '-'}</span>
                    </div>
                </div>

                <div className="rounded bg-white p-5 shadow-sm">
                    <h2 className="mb-3 text-sm font-semibold text-gray-700">Rencana vs Realisasi</h2>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="block text-gray-500">Rencana</span>
                            <span className="text-base font-semibold">{rupiah(perbandingan?.rencana ?? rab.rencana)}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500">Realisasi</span>
                            <span className="text-base font-semibold">{rupiah(perbandingan?.realisasi ?? realisasi)}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500">Selisih</span>
                            <span className={`text-base font-semibold ${over ? 'text-red-600' : 'text-green-700'}`}>
                                {rupiah(perbandingan?.selisih)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs text-gray-500">
                            <span>Terpakai</span>
                            <span>{persen}%</span>
                        </div>
                        <div className="h-2 w-full rounded bg-gray-200">
                            <div
                                className={`h-2 rounded ${over ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, Math.max(0, persen))}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
