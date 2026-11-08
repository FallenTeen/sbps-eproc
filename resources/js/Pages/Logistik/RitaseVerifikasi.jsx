import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import Pagination from '@/Components/Pagination';

const statusBadge = (status) =>
    status === 'terverifikasi'
        ? <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-semibold text-green-800">Terverifikasi</span>
        : <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">Menunggu</span>;

export default function RitaseVerifikasi({ rows, filters }) {
    const { flash } = usePage().props;
    const [cari, setCari] = useState(filters?.cari ?? '');
    const [openId, setOpenId] = useState(null);
    const [form, setForm] = useState({
        jumlah_verifikasi: '', berat_kosong_kg: '', berat_isi_kg: '', berat_netto_kg: '', tara_sumber: 'master', nomor_tiket: '', catatan: '',
    });

    const submitFilter = (e) => {
        e.preventDefault();
        router.get(route('logistik.ritase-verifikasi.index'), { cari }, { preserveState: true });
    };

    const openForm = (r) => {
        setOpenId(r.id);
        setForm({
            jumlah_verifikasi: r.verifikasi_logistik?.jumlah_verifikasi ?? (r.muatan?.jumlah_driver ?? r.jumlah_rit ?? ''),
            berat_kosong_kg: r.timbang?.berat_kosong_kg ?? r.armada?.tara_master_kg ?? '',
            berat_isi_kg: r.timbang?.berat_isi_kg ?? '',
            berat_netto_kg: r.timbang?.berat_netto_kg ?? '',
            tara_sumber: 'master',
            nomor_tiket: r.timbang?.nomor_tiket ?? '',
            catatan: '',
        });
    };

    const submitVerifikasi = (e, id) => {
        e.preventDefault();
        router.post(route('logistik.ritase-verifikasi.verifikasi', id), form, {
            preserveScroll: true,
            onSuccess: () => setOpenId(null),
        });
    };

    return (
        <Layout title="Antrean Verifikasi Ritase">
            <div className="p-6 space-y-4">
                <h1 className="text-xl font-semibold text-gray-800">Antrean Verifikasi Ritase (Logistik)</h1>

                {flash?.success && <div className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">{flash.success}</div>}

                <form onSubmit={submitFilter} className="flex gap-2">
                    <input
                        className="w-full max-w-sm rounded border-gray-300 text-sm"
                        placeholder="Cari plat / kategori / material"
                        value={cari}
                        onChange={(e) => setCari(e.target.value)}
                    />
                    <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Cari</button>
                </form>

                <div className="overflow-x-auto rounded bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Armada</th>
                                <th className="px-4 py-3">Driver</th>
                                <th className="px-4 py-3">Muatan (driver)</th>
                                <th className="px-4 py-3">Wajib Timbang</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(rows?.data ?? []).map((r) => (
                                <React.Fragment key={r.id}>
                                    <tr>
                                        <td className="px-4 py-3">{r.tanggal ?? '-'}</td>
                                        <td className="px-4 py-3 font-medium">{r.armada?.plat_nomor ?? '-'}</td>
                                        <td className="px-4 py-3">{r.driver?.nama ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            {r.muatan?.jumlah_driver ?? r.jumlah_rit} {r.muatan?.satuan ?? r.satuan_volume ?? ''}
                                            {r.ada_selisih && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Selisih</span>}
                                        </td>
                                        <td className="px-4 py-3">{r.wajib_jembatan_timbang ? 'Ya' : 'Tidak'}</td>
                                        <td className="px-4 py-3">{statusBadge(r.verifikasi_logistik?.status ?? 'menunggu')}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => (openId === r.id ? setOpenId(null) : openForm(r))}
                                                className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                                            >
                                                {openId === r.id ? 'Tutup' : 'Verifikasi'}
                                            </button>
                                        </td>
                                    </tr>
                                    {openId === r.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={7} className="px-4 py-4">
                                                <form onSubmit={(e) => submitVerifikasi(e, r.id)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                                    <div>
                                                        <label className="block text-xs text-gray-500">Jumlah verifikasi</label>
                                                        <input type="number" step="0.01" required className="w-full rounded border-gray-300 text-sm"
                                                            value={form.jumlah_verifikasi} onChange={(e) => setForm({ ...form, jumlah_verifikasi: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500">Berat kosong (kg)</label>
                                                        <input type="number" step="0.01" required className="w-full rounded border-gray-300 text-sm"
                                                            value={form.berat_kosong_kg} onChange={(e) => setForm({ ...form, berat_kosong_kg: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500">Berat isi (kg)</label>
                                                        <input type="number" step="0.01" required className="w-full rounded border-gray-300 text-sm"
                                                            value={form.berat_isi_kg} onChange={(e) => setForm({ ...form, berat_isi_kg: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500">Berat netto (kg)</label>
                                                        <input type="number" step="0.01" required className="w-full rounded border-gray-300 text-sm"
                                                            value={form.berat_netto_kg} onChange={(e) => setForm({ ...form, berat_netto_kg: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500">Tara sumber</label>
                                                        <select className="w-full rounded border-gray-300 text-sm" value={form.tara_sumber}
                                                            onChange={(e) => setForm({ ...form, tara_sumber: e.target.value })}>
                                                            <option value="master">Master</option>
                                                            <option value="timbang_ulang">Timbang ulang</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500">No. tiket</label>
                                                        <input className="w-full rounded border-gray-300 text-sm" value={form.nomor_tiket}
                                                            onChange={(e) => setForm({ ...form, nomor_tiket: e.target.value })} />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs text-gray-500">Catatan</label>
                                                        <input className="w-full rounded border-gray-300 text-sm" value={form.catatan}
                                                            onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
                                                    </div>
                                                    <div className="md:col-span-4 flex justify-end">
                                                        <button className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                                                            Simpan Verifikasi
                                                        </button>
                                                    </div>
                                                </form>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {(rows?.data ?? []).length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Tidak ada antrean.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    paginator={rows}
                    onPageUrl={(url) => router.get(url, {}, { preserveState: true })}
                    onPerPageChange={(n) => router.get(route('logistik.ritase-verifikasi.index'), { per_page: n }, { preserveState: true })}
                />
            </div>
        </Layout>
    );
}
