import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';

const KENDARAAN = ['tanpa_kendaraan', 'motor', 'mobil', 'truk', 'lainnya'];

export default function BukuTamu({ rows, filters }) {
    const { flash } = usePage().props;
    const [cari, setCari] = useState(filters?.cari ?? '');
    const [tanggal, setTanggal] = useState(filters?.tanggal ?? '');
    const [kendaraan, setKendaraan] = useState(filters?.kendaraan ?? '');

    const params = (extra = {}) => ({ cari, tanggal, kendaraan, ...extra });

    const submit = (e) => {
        e.preventDefault();
        router.get(route('security.buku-tamu.index'), params(), { preserveState: true });
    };

    const keluar = (id) => {
        router.post(route('security.buku-tamu.keluar', id), {}, { preserveScroll: true });
    };

    return (
        <Layout title="Buku Tamu">
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-800">Buku Tamu (Security)</h1>
                    <a
                        href={route('security.buku-tamu.export', params())}
                        className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        Export Excel
                    </a>
                </div>

                {flash?.success && <div className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">{flash.success}</div>}

                <form onSubmit={submit} className="flex flex-wrap gap-2">
                    <input className="w-full max-w-xs rounded border-gray-300 text-sm" placeholder="Cari nama / asal / telepon / plat"
                        value={cari} onChange={(e) => setCari(e.target.value)} />
                    <input type="date" className="rounded border-gray-300 text-sm" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
                    <select className="rounded border-gray-300 text-sm" value={kendaraan} onChange={(e) => setKendaraan(e.target.value)}>
                        <option value="">Semua kendaraan</option>
                        {KENDARAAN.map((k) => <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>)}
                    </select>
                    <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Filter</button>
                </form>

                <div className="overflow-x-auto rounded bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Masuk</th>
                                <th className="px-4 py-3">Nama</th>
                                <th className="px-4 py-3">Asal</th>
                                <th className="px-4 py-3">Kendaraan</th>
                                <th className="px-4 py-3">Keluar</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(rows?.data ?? []).map((t) => (
                                <tr key={t.id}>
                                    <td className="px-4 py-3">{t.waktu_masuk ?? '-'}</td>
                                    <td className="px-4 py-3 font-medium">{t.nama} {t.jumlah_orang ? `(${t.jumlah_orang} org)` : ''}</td>
                                    <td className="px-4 py-3">{t.asal ?? '-'}</td>
                                    <td className="px-4 py-3">{t.kendaraan ?? '-'} {t.plat_nomor ? `· ${t.plat_nomor}` : ''}</td>
                                    <td className="px-4 py-3">{t.waktu_keluar ?? <span className="text-amber-600">Belum keluar</span>}</td>
                                    <td className="px-4 py-3 text-right">
                                        {!t.waktu_keluar && (
                                            <button onClick={() => keluar(t.id)} className="rounded bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
                                                Tandai Keluar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {(rows?.data ?? []).length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Tidak ada data.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    paginator={rows}
                    onPageUrl={(url) => router.get(url, {}, { preserveState: true })}
                    onPerPageChange={(n) => router.get(route('security.buku-tamu.index'), params({ per_page: n }), { preserveState: true })}
                />
            </div>
        </Layout>
    );
}
