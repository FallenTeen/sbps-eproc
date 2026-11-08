import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';

const emptyForm = { nama: '', periode: 'harian', jam_mulai: '', jam_selesai: '', aktif: true, itemsText: '' };

export default function ChecklistTemplates({ templates, runs }) {
    const { flash } = usePage().props;
    const [form, setForm] = useState(emptyForm);

    const submit = (e) => {
        e.preventDefault();
        const items = form.itemsText.split('\n').map((s) => s.trim()).filter(Boolean).map((teks) => ({ teks }));
        router.post(route('security.checklist-template.store'), {
            nama: form.nama,
            periode: form.periode,
            jam_mulai: form.jam_mulai || null,
            jam_selesai: form.jam_selesai || null,
            aktif: form.aktif,
            items,
        }, { onSuccess: () => setForm(emptyForm) });
    };

    const hapus = (id) => {
        if (window.confirm('Hapus template ini?')) {
            router.delete(route('security.checklist-template.destroy', id));
        }
    };

    const toggleAktif = (t) => {
        router.put(route('security.checklist-template.update', t.id), {
            nama: t.nama,
            periode: t.periode,
            jam_mulai: t.jam_mulai,
            jam_selesai: t.jam_selesai,
            aktif: !t.aktif,
            items: (t.items ?? []).map((i) => ({ teks: i.teks })),
        }, { preserveScroll: true });
    };

    return (
        <Layout title="Checklist Kantor">
            <div className="p-6 space-y-5">
                <h1 className="text-xl font-semibold text-gray-800">Template Checklist Pemantauan Kantor (Security)</h1>
                {flash?.success && <div className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">{flash.success}</div>}

                <form onSubmit={submit} className="space-y-3 rounded bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-700">Tambah Template</h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500">Nama</label>
                            <input required className="w-full rounded border-gray-300 text-sm" value={form.nama}
                                onChange={(e) => setForm({ ...form, nama: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">Periode</label>
                            <select className="w-full rounded border-gray-300 text-sm" value={form.periode}
                                onChange={(e) => setForm({ ...form, periode: e.target.value })}>
                                <option value="harian">Harian</option>
                                <option value="malam">Malam</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <div>
                                <label className="block text-xs text-gray-500">Jam mulai</label>
                                <input type="time" className="rounded border-gray-300 text-sm" value={form.jam_mulai}
                                    onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">Jam selesai</label>
                                <input type="time" className="rounded border-gray-300 text-sm" value={form.jam_selesai}
                                    onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} />
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs text-gray-500">Item (satu per baris)</label>
                            <textarea rows={4} className="w-full rounded border-gray-300 text-sm" value={form.itemsText}
                                onChange={(e) => setForm({ ...form, itemsText: e.target.value })}
                                placeholder={'Pintu utama terkunci\nCCTV berfungsi\nLampu koridor menyala'} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} /> Aktif
                        </label>
                        <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Simpan Template</button>
                    </div>
                </form>

                <div className="space-y-3">
                    {templates.map((t) => (
                        <div key={t.id} className="rounded bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-medium text-gray-800">{t.nama}</span>
                                    <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t.periode}</span>
                                    {t.jam_mulai && <span className="ml-2 text-xs text-gray-500">{t.jam_mulai}–{t.jam_selesai ?? '?'}</span>}
                                    {!t.aktif && <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Nonaktif</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleAktif(t)} className="rounded border px-3 py-1.5 text-xs">
                                        {t.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                                    </button>
                                    <button onClick={() => hapus(t.id)} className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Hapus</button>
                                </div>
                            </div>
                            <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
                                {(t.items ?? []).map((i) => <li key={i.id}>{i.teks}</li>)}
                            </ul>
                        </div>
                    ))}
                    {templates.length === 0 && <p className="text-sm text-gray-500">Belum ada template.</p>}
                </div>

                <div className="rounded bg-white p-4 shadow-sm">
                    <h2 className="mb-2 text-sm font-semibold text-gray-700">Run Terbaru (dari mobile)</h2>
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-xs uppercase text-gray-500">
                            <tr><th className="py-2">Tanggal</th><th className="py-2">Periode</th><th className="py-2">Petugas</th><th className="py-2">Jumlah Item</th></tr>
                        </thead>
                        <tbody>
                            {runs.map((r) => (
                                <tr key={r.id} className="border-t">
                                    <td className="py-2">{r.tanggal}</td>
                                    <td className="py-2">{r.periode}</td>
                                    <td className="py-2">{r.security?.name ?? '-'}</td>
                                    <td className="py-2">{Array.isArray(r.items) ? r.items.length : 0}</td>
                                </tr>
                            ))}
                            {runs.length === 0 && <tr><td colSpan={4} className="py-3 text-center text-gray-500">Belum ada run.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
