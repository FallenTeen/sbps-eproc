import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const BAGIAN_DEFAULT = ['Ban', 'Rem', 'Lampu', 'Oli mesin', 'Air radiator', 'Body', 'Kabin'];

const KONDISI_OPTIONS = [
    { value: 'baik', label: 'Baik' },
    { value: 'perlu_perhatian', label: 'Perlu Perhatian' },
    { value: 'rusak', label: 'Rusak' },
];

export default function Create({ checkableType, checkableId, checkable, karyawans = [], stokSolarOptions = [] }) {
    const isArmada = checkableType === 'armada';

    const initialItems = isArmada
        ? BAGIAN_DEFAULT.map((bagian) => ({ bagian, kondisi: 'baik', catatan: '' }))
        : [];

    const { data, setData, post, errors, processing } = useForm({
        checkable_type: checkableType,
        checkable_id: checkableId,
        tanggal: new Date().toISOString().split('T')[0],
        kondisi_baik: true,
        item_bermasalah: '',
        dicatat_oleh_karyawan_id: '',
        stok_solar: '',
        odo_pagi: '',
        jam_mulai_operasi: '',
        items: initialItems,
    });

    const updateItem = (idx, key, value) => {
        const next = data.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it));
        setData('items', next);
    };

    const addItem = () => setData('items', [...data.items, { bagian: '', kondisi: 'baik', catatan: '' }]);
    const removeItem = (idx) => setData('items', data.items.filter((_, i) => i !== idx));

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('fleet.checklist-harian.store'));
    };

    const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500';

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Checklist Harian {isArmada ? 'Awal' : ''}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-3xl">
                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded border">
                        <div className="text-sm font-medium">Unit: {checkable?.nama || checkable?.plat_nomor || checkable?.kode_unit || '-'}</div>
                        <div className="text-sm text-gray-600">Tipe: {isArmada ? 'Armada' : 'Mesin Produksi'}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Petugas *</label>
                            <select value={data.dicatat_oleh_karyawan_id} onChange={(e) => setData('dicatat_oleh_karyawan_id', e.target.value)} className={inputCls}>
                                <option value="">Pilih Petugas</option>
                                {karyawans.map((k) => (
                                    <option key={k.id} value={k.id}>{k.nama}{k.jabatan ? ` — ${k.jabatan}` : ''}</option>
                                ))}
                            </select>
                            {errors.dicatat_oleh_karyawan_id && <p className="text-red-600 text-sm mt-1">{errors.dicatat_oleh_karyawan_id}</p>}
                        </div>
                    </div>

                    {isArmada ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok Solar</label>
                                    <select value={data.stok_solar} onChange={(e) => setData('stok_solar', e.target.value)} className={inputCls}>
                                        <option value="">-</option>
                                        {stokSolarOptions.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ODO / HM Pagi</label>
                                    <input type="number" step="0.01" value={data.odo_pagi} onChange={(e) => setData('odo_pagi', e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai Operasi</label>
                                    <input type="time" value={data.jam_mulai_operasi} onChange={(e) => setData('jam_mulai_operasi', e.target.value)} className={inputCls} />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Kondisi per Bagian</label>
                                    <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Tambah
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {data.items.map((it, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={it.bagian}
                                                onChange={(e) => updateItem(idx, 'bagian', e.target.value)}
                                                placeholder="Bagian"
                                                className={`${inputCls} flex-1`}
                                            />
                                            <select value={it.kondisi} onChange={(e) => updateItem(idx, 'kondisi', e.target.value)} className={`${inputCls} w-40`}>
                                                {KONDISI_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={it.catatan}
                                                onChange={(e) => updateItem(idx, 'catatan', e.target.value)}
                                                placeholder="Catatan"
                                                className={`${inputCls} flex-1`}
                                            />
                                            <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="kondisi_baik"
                                    checked={data.kondisi_baik}
                                    onChange={(e) => setData('kondisi_baik', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="kondisi_baik" className="text-sm font-medium text-gray-700">Kondisi Baik</label>
                            </div>

                            {!data.kondisi_baik && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Bermasalah *</label>
                                    <textarea
                                        value={data.item_bermasalah}
                                        onChange={(e) => setData('item_bermasalah', e.target.value)}
                                        rows="2"
                                        placeholder="Jelaskan masalah yang ditemukan..."
                                        className={inputCls}
                                    />
                                    {errors.item_bermasalah && <p className="text-red-600 text-sm mt-1">{errors.item_bermasalah}</p>}
                                </div>
                            )}
                        </>
                    )}
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
