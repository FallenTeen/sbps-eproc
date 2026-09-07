import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Calendar, CheckCircle, Trash, Printer, XMark } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const STATUS_COLOR = {
    baik:   'bg-green-100 text-green-800',
    rusak:  'bg-red-100 text-red-800',
};

function StatCard({ label, value, sub, color = 'blue' }) {
    const colors = {
        blue:   'from-blue-600 to-blue-700',
        green:  'from-green-600 to-green-700',
        amber:  'from-amber-500 to-amber-700',
        purple: 'from-purple-600 to-purple-700',
    };
    return (
        <div className={`rounded-xl bg-gradient-to-br ${colors[color]} text-white p-4 shadow-md text-sm`}
            style={{ maxWidth: '200px' }}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
        </div>
    );
}

export default function SewaAlatSerahTerima({ auth, sewa, berangkat, kembali, pemakaian, defaultItems, can }) {
    const { flash } = usePage().props;
    const [showFlash, setShowFlash] = useState(!!flash?.success);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTipe, setModalTipe] = useState('berangkat');
    const [formOdo, setFormOdo] = useState('');
    const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [formCatatan, setFormCatatan] = useState('');
    const [formDitandatangani, setFormDitandatangani] = useState('');
    const [formItems, setFormItems] = useState([]);
    const [formFoto, setFormFoto] = useState([]);

    useEffect(() => {
        if (modalTipe === 'berangkat' && berangkat) {
            setFormOdo(berangkat.odo_atau_hm ?? '');
            setFormTanggal(berangkat.tanggal?.format('YYYY-MM-DD') ?? new Date().toISOString().split('T')[0]);
            setFormCatatan(berangkat?.catatan ?? '');
            setFormDitandatangani(berangkat?.ditandatangani_oleh?.name ?? '');
            setFormItems(berangkat?.details?.map(d => ({ item: d.item, kondisi: d.kondisi, catatan: d.catatan })) ?? []);
            setFormFoto(berangkat?.foto_kondisi ?? []);
        } else if (modalTipe === 'kembali' && kembali) {
            setFormOdo(kembali.odo_atau_hm ?? '');
            setFormTanggal(kembali.tanggal?.format('YYYY-MM-DD') ?? new Date().toISOString().split('T')[0]);
            setFormCatatan(kembali?.catatan ?? '');
            setFormDitandatangani(kembali?.ditandatangani_oleh?.name ?? '');
            setFormItems(kembali?.details?.map(d => ({ item: d.item, kondisi: d.kondisi, catatan: d.catatan })) ?? []);
            setFormFoto(kembali?.foto_kondisi ?? []);
        } else {
            setFormItems(defaultItems.map(item => ({ item, kondisi: 'baik', catatan: '' })));
        }
    }, [modalTipe, berangkat, kembali]);

    const closeModal = () => {
        setModalOpen(false);
        setModalTipe('berangkat');
        setFormOdo('');
        setFormTanggal(new Date().toISOString().split('T')[0]);
        setFormCatatan('');
        setFormDitandatangani('');
        setFormItems(defaultItems.map(item => ({ item, kondisi: 'baik', catatan: '' })));
        setFormFoto([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const itemsWithFoto = formItems.map((it, i) => ({
            item: it.item,
            kondisi: it.kondisi,
            catatan: it.catatan,
        }));

        const payload = {
            tipe: modalTipe,
            odo_atau_hm: parseFloat(formOdo) || null,
            tanggal: formTanggal,
            catatan: formCatatan ?? null,
            ditandatangani_oleh: formDitandatangani ?? null,
            items: itemsWithFoto,
            foto_kondisi: formFoto,
        };

        await router.post(route('sewa-alat.serah-terima.store', sewa.id), payload);
        closeModal();
        router.visit(route('fleet.sewa-alat.serah-terima.show', sewa.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Checklist Serah Terima — ${sewa.armada?.kode_unit}`} />

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Checklist Serah Terima</h1>
                <div>
                    <StatCard label="Pemakaian HM" value={pemakaian > 0 ? pemakaian + ' HM' : '—'} color="blue" />
                    <StatCard label="Status" value={sewa.status} color="purple" />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Arma" value={`${sewa.armada?.kode_unit} / ${sewa.armada?.plat_nomor}`} color="blue" />
                <StatCard label="Penyewa" value={sewa.penyewa_nama ?? '-'} color="purple" />
                <StatCard label="HM Awal" value={sewa.hm_awal ?? '–'} color="green" />
                <StatCard label="HM Akhir" value={sewa.hm_akhir ?? '–'} color="green" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-800">Berangkat</h2>
                </div>
                <div className={`p-5 ${berangkat ? '' : 'text-slate-400 opacity-50'}`}
                    style={{ minHeight: berangkat ? '200px' : '100px' }}>
                    {berangkat ? (
                        <div>
                            <p className="text-sm text-slate-600 mb-2">Tanggal: {berangkat.tanggal ? berangkat.tanggal.format('d F Y') : '—'}</p>
                            <p className="text-sm text-slate-600 mb-2">Odo / HM: {berangkat.odo_atau_hm ?? '—'} HM</p>
                            <p className="text-sm text-slate-600 mb-2">Penyewa: {(berangkat?.data_penyewa?.nama ?? '-') + ' - ' + (berangkat?.data_penyewa?.pt ?? '')}</p>
                            <p className="text-sm text-slate-600 mb-2">Ditandatangani Oleh: {berangkat?.dicatatOleh?.name ?? '-'}</p>
                            <p className="text-sm text-slate-600 mb-2">Catatan: {berangkat?.catatan ?? '-'}</p>
                            <p className="text-xs text-slate-500">Item checklist: {berangkat?.details?.length ?? 0} item</p>
                            {berangkat?.foto_kondisi?.length > 0 && (
                                <p className="text-xs text-slate-500">Foto: {berangkat.foto_kondisi.map(f => f.split('/').pop()).join(', ')}</p>
                            )}
                            <button
                                onClick={() => setModalTipe('berangkat')}
                                className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200">
                                <Plus className="w-3.5 h-3.5" /> Ubah Checklist Berangkat
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 opacity-70">Belum ada checklist berangkat. <button
                                onClick={() => setModalTipe('berangkat')}
                                className="ml-1 text-blue-600 underline underline-offset-2 hover:text-blue-800">
                                Isi Checklist Berangkat
                        </button></p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-800">Kembali</h2>
                </div>
                <div className={`p-5 ${kembali ? '' : 'text-slate-400 opacity-50'}`}
                    style={{ minHeight: kembali ? '200px' : '100px' }}>
                    {kembali ? (
                        <div>
                            <p className="text-sm text-slate-600 mb-2">Tanggal: {kembali.tanggal ? kembali.tanggal.format('d F Y') : '—'}</p>
                            <p className="text-sm text-slate-600 mb-2">Odo / HM: {kembali.odo_atau_hm ?? '—'} HM</p>
                            <p className="text-sm text-slate-600 mb-2">Pemakaian: {pemakaian > 0 ? pemakaian.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' HM' : '—'}</p>
                            <p className="text-sm text-slate-600 mb-2">Penyewa: {(kembali.data_penyewa?.nama ?? '-') + ' - ' + (kembali.data_penyewa?.pt ?? '')}</p>
                            <p className="text-sm text-slate-600 mb-2">Ditandatangani Oleh: {kembali.dicatatOleh?.name ?? '-'}</p>
                            <p className="text-sm text-slate-600 mb-2">Catatan: {kembali?.catatan ?? '-'}</p>
                            <p className="text-xs text-slate-500">Item checklist: {kembali.details?.length ?? 0} item</p>
                            {kembali?.foto_kondisi?.length > 0 && (
                                <p className="text-xs text-slate-500">Foto: {kembali.foto_kondisi.map(f => f.split('/').pop()).join(', ')}</p>
                            )}
                            <button
                                onClick={() => setModalTipe('kembali')}
                                className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200">
                                <Plus className="w-3.5 h-3.5" /> Ubah Checklist Kembali
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 opacity-70">Belum ada checklist kembali. <button
                                onClick={() => setModalTipe('kembali')}
                                className="ml-1 text-blue-600 underline underline-offset-2 hover:text-blue-800">
                                Isi Checklist Kembali
                        </button></p>
                    )}
                </div>
            </div>

            {berangkat && kembali && (
                <div className="mt-6">
                    <Link href={route('sewa-alat.serah-terima.print', sewa.id)}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                        <Printer className="w-3.5 h-3.5" /> Cetak PDF
                    </Link>
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl relative">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">{modalTipe === 'berangkat' ? 'Isi Checklist Berangkat' : 'Isi Checklist Kembali'}</h2>
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                            <XMark className="w-4 h-4" />
                        </button>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="hidden"
                                name="tipe"
                                value={modalTipe}
                                readOnly
                            />
                            <input
                                type="hidden"
                                name="sewa_id"
                                value={sewa.id}
                                readOnly
                            />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Odo / HM</label>
                                <input
                                    type="number"
                                    name="odo_atau_hm"
                                    value={formOdo}
                                    onChange={(e) => setFormOdo(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                />
                                <small className="text-xs text-slate-500">Nilai HM (sebelum sewa).</small>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    name="tanggal"
                                    value={formTanggal}
                                    onChange={(e) => setFormTanggal(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                                <textarea
                                    name="catatan"
                                    value={formCatatan}
                                    onChange={(e) => setFormCatatan(e.target.value)}
                                    rows={3}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tandatangani Oleh</label>
                                <input
                                    type="text"
                                    name="ditandatangani_oleh"
                                    value={formDitandatangani}
                                    onChange={(e) => setFormDitandatangani(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Item Checklist</label>
                                <div className="space-y-2">
                                    {defaultItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`kondisi_${idx}`}
                                                value="baik"
                                                checked={formItems[idx]?.kondisi === 'baik'}
                                                onChange={() => {
                                                    const newItems = [...formItems];
                                                    newItems[idx] = { ...newItems[idx], kondisi: 'baik' };
                                                    setFormItems(newItems);
                                                }}
                                            />
                                            <span className="flex-1">{item}</span>
                                            <input
                                                type="radio"
                                                name={`kondisi_${idx}`}
                                                value="rusak"
                                                checked={formItems[idx]?.kondisi === 'rusak'}
                                                onChange={() => {
                                                    const newItems = [...formItems];
                                                    newItems[idx] = { ...newItems[idx], kondisi: 'rusak' };
                                                    setFormItems(newItems);
                                                }}
                                            />
                                            <span></span>
                                            <input
                                                type="text"
                                                name={`item_catatan_${idx}`}
                                                value={formItems[idx]?.catatan ?? ''}
                                                onChange={(e) => {
                                                    const newItems = [...formItems];
                                                    newItems[idx] = { ...newItems[idx], catatan: e.target.value };
                                                    setFormItems(newItems);
                                                }}
                                                className="ml-2 flex-1 text-sm border rounded w-full p-1"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Foto Kondisi</label>
                                <input
                                    type="file"
                                    name="foto_kondisi"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => setFormFoto(Array.from(e.target.files))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Maksimal 6 foto.</p>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={closeModal}
                                    className="px-4 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">
                                    Batal
                                </button>
                                <button type="submit"
                                    className="px-4 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">
                                    Simpan Checklist
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
