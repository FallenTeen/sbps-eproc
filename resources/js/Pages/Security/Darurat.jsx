import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';

const tingkatColor = (t) =>
    ['kritis', 'darurat'].includes(t) ? 'bg-red-100 text-red-700'
        : t === 'siaga' ? 'bg-orange-100 text-orange-700'
            : t === 'tinggi' ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600';

export default function Darurat({ rows, filters }) {
    const { flash } = usePage().props;
    const [status, setStatus] = useState(filters?.status ?? '');
    const [openId, setOpenId] = useState(null);
    const [form, setForm] = useState({ status: 'ditangani', catatan_penanganan: '' });

    const submitFilter = (e) => {
        e.preventDefault();
        router.get(route('security.darurat.index'), { status }, { preserveState: true });
    };

    const tangani = (e, id) => {
        e.preventDefault();
        router.post(route('security.darurat.tangani', id), form, {
            preserveScroll: true,
            onSuccess: () => setOpenId(null),
        });
    };

    return (
        <Layout title="Laporan Darurat">
            <div className="p-6 space-y-4">
                <h1 className="text-xl font-semibold text-gray-800">Laporan Darurat (Security)</h1>
                {flash?.success && <div className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">{flash.success}</div>}

                <form onSubmit={submitFilter} className="flex gap-2">
                    <select className="rounded border-gray-300 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Semua status</option>
                        <option value="baru">Baru</option>
                        <option value="ditangani">Ditangani</option>
                        <option value="selesai">Selesai</option>
                    </select>
                    <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Filter</button>
                </form>

                <div className="space-y-3">
                    {(rows?.data ?? []).map((d) => (
                        <div key={d.id} className="rounded bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800">{d.judul}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tingkatColor(d.tingkat)}`}>{d.tingkat}</span>
                                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{d.status}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">{d.deskripsi}</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {d.kategori} · {d.lokasi_ruangan} · pelapor {d.pelapor?.name ?? '-'} · {d.created_at}
                                    </p>
                                    {d.catatan_penanganan && (
                                        <p className="mt-1 text-xs text-emerald-700">Penanganan: {d.catatan_penanganan} ({d.penangan?.name ?? '-'})</p>
                                    )}
                                </div>
                                {d.status !== 'selesai' && (
                                    <button onClick={() => { setOpenId(d.id); setForm({ status: 'ditangani', catatan_penanganan: d.catatan_penanganan ?? '' }); }}
                                        className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                                        Tindak Lanjut
                                    </button>
                                )}
                            </div>
                            {openId === d.id && (
                                <form onSubmit={(e) => tangani(e, d.id)} className="mt-3 grid grid-cols-1 gap-2 border-t pt-3 md:grid-cols-4">
                                    <select className="rounded border-gray-300 text-sm" value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                        <option value="ditangani">Ditangani</option>
                                        <option value="selesai">Selesai</option>
                                    </select>
                                    <input className="rounded border-gray-300 text-sm md:col-span-2" placeholder="Catatan penanganan"
                                        value={form.catatan_penanganan} onChange={(e) => setForm({ ...form, catatan_penanganan: e.target.value })} />
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setOpenId(null)} className="rounded border px-3 py-1.5 text-xs">Batal</button>
                                        <button className="rounded bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700">Simpan</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ))}
                    {(rows?.data ?? []).length === 0 && <p className="text-sm text-gray-500">Tidak ada laporan.</p>}
                </div>

                <Pagination
                    paginator={rows}
                    onPageUrl={(url) => router.get(url, {}, { preserveState: true })}
                    onPerPageChange={(n) => router.get(route('security.darurat.index'), { per_page: n }, { preserveState: true })}
                />
            </div>
        </Layout>
    );
}
