import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';

export default function TaraMaster({ rows, filters }) {
    const { flash } = usePage().props;
    const [cari, setCari] = useState(filters?.cari ?? '');
    const [editId, setEditId] = useState(null);
    const [tara, setTara] = useState('');

    const submitFilter = (e) => {
        e.preventDefault();
        router.get(route('logistik.tara-master.index'), { cari }, { preserveState: true });
    };

    const save = (e, armada) => {
        e.preventDefault();
        router.put(route('logistik.tara-master.update', armada.id), { tara_master_kg: tara }, {
            preserveScroll: true,
            onSuccess: () => setEditId(null),
        });
    };

    return (
        <Layout title="Tara Master">
            <div className="p-6 space-y-4">
                <h1 className="text-xl font-semibold text-gray-800">Tara Master Armada (Logistik)</h1>
                <p className="text-sm text-gray-500">Tara default (kg) dipakai sebagai berat kosong saat penimbangan; dapat ditimpa per ritase dengan opsi timbang ulang.</p>

                {flash?.success && <div className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">{flash.success}</div>}

                <form onSubmit={submitFilter} className="flex gap-2">
                    <input
                        className="w-full max-w-sm rounded border-gray-300 text-sm"
                        placeholder="Cari plat / kode unit"
                        value={cari}
                        onChange={(e) => setCari(e.target.value)}
                    />
                    <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Cari</button>
                </form>

                <div className="overflow-x-auto rounded bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Plat</th>
                                <th className="px-4 py-3">Kode Unit</th>
                                <th className="px-4 py-3">Jenis</th>
                                <th className="px-4 py-3">Tara Master (kg)</th>
                                <th className="px-4 py-3">Diperbarui</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(rows?.data ?? []).map((a) => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3 font-medium">{a.plat_nomor}</td>
                                    <td className="px-4 py-3">{a.kode_unit ?? '-'}</td>
                                    <td className="px-4 py-3">{a.jenis ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {editId === a.id ? (
                                            <input type="number" step="0.01" className="w-32 rounded border-gray-300 text-sm"
                                                value={tara} onChange={(e) => setTara(e.target.value)} />
                                        ) : (
                                            Number(a.tara_master_kg ?? 0).toLocaleString('id-ID')
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{a.tara_diperbarui_pada ?? '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        {editId === a.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={(e) => save(e, a)} className="rounded bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700">Simpan</button>
                                                <button onClick={() => setEditId(null)} className="rounded border px-3 py-1.5 text-xs">Batal</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditId(a.id); setTara(a.tara_master_kg ?? ''); }}
                                                className="rounded bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                                            >
                                                Ubah
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    paginator={rows}
                    onPageUrl={(url) => router.get(url, {}, { preserveState: true })}
                    onPerPageChange={(n) => router.get(route('logistik.tara-master.index'), { per_page: n }, { preserveState: true })}
                />
            </div>
        </Layout>
    );
}
