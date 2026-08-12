import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, CheckSquare, Square, Calculator } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import axios from 'axios';

export default function Create({ auth, unitBisnisList = [], proyekList = [] }) {
    const [unbilledItems, setUnbilledItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState([]);

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        unit_bisnis_id: unitBisnisList.length > 0 ? unitBisnisList[0].id : '',
        proyek_id: '',
        sumber_tagihan: 'ritase',
        item_ids: [],
        tanggal_terbit: todayStr,
        tanggal_jatuh_tempo: defaultDueDate,
        catatan: '',
    });

    const filteredProyek = proyekList.filter(p => !data.unit_bisnis_id || p.unit_bisnis_id == data.unit_bisnis_id);

    // Fetch unbilled items when filters change
    useEffect(() => {
        if (!data.unit_bisnis_id) return;
        setLoadingItems(true);
        axios.get(route('finance.invoice.unbilled-items'), {
            params: {
                unit_bisnis_id: data.unit_bisnis_id,
                proyek_id: data.proyek_id,
                sumber_tagihan: data.sumber_tagihan,
            }
        }).then(res => {
            if (res.data.success) {
                setUnbilledItems(res.data.items || []);
                // Select all by default
                const allIds = (res.data.items || []).map(i => i.id);
                setSelectedItemIds(allIds);
                setData('item_ids', allIds);
            }
        }).catch(err => {
            console.error('Error fetching unbilled items:', err);
            setUnbilledItems([]);
        }).finally(() => {
            setLoadingItems(false);
        });
    }, [data.unit_bisnis_id, data.proyek_id, data.sumber_tagihan]);

    const toggleSelectItem = (id) => {
        let updated;
        if (selectedItemIds.includes(id)) {
            updated = selectedItemIds.filter(i => i !== id);
        } else {
            updated = [...selectedItemIds, id];
        }
        setSelectedItemIds(updated);
        setData('item_ids', updated);
    };

    const toggleSelectAll = () => {
        if (selectedItemIds.length === unbilledItems.length) {
            setSelectedItemIds([]);
            setData('item_ids', []);
        } else {
            const all = unbilledItems.map(i => i.id);
            setSelectedItemIds(all);
            setData('item_ids', all);
        }
    };

    const selectedItems = unbilledItems.filter(i => selectedItemIds.includes(i.id));
    const totalEstimasi = selectedItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

    const submit = (e) => {
        e.preventDefault();
        post(route('finance.invoice.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('finance.invoice.index')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Buat Invoice Baru</h2>
                </div>
            }
        >
            <Head title="Buat Invoice" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-6">
                        
                        {/* Section 1: Header Information */}
                        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Utama Invoice</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <InputLabel htmlFor="unit_bisnis_id" value="Unit Bisnis" />
                                    <select
                                        id="unit_bisnis_id"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={data.unit_bisnis_id}
                                        onChange={(e) => setData('unit_bisnis_id', e.target.value)}
                                        required
                                    >
                                        <option value="">-- Pilih Unit Bisnis --</option>
                                        {unitBisnisList.map((ub) => (
                                            <option key={ub.id} value={ub.id}>{ub.nama}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.unit_bisnis_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="proyek_id" value="Proyek / Klien (Opsional)" />
                                    <select
                                        id="proyek_id"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={data.proyek_id}
                                        onChange={(e) => setData('proyek_id', e.target.value)}
                                    >
                                        <option value="">-- Pilih Proyek (Opsional) --</option>
                                        {filteredProyek.map((p) => (
                                            <option key={p.id} value={p.id}>{p.nama}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.proyek_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="sumber_tagihan" value="Sumber Tagihan" />
                                    <select
                                        id="sumber_tagihan"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                                        value={data.sumber_tagihan}
                                        onChange={(e) => setData('sumber_tagihan', e.target.value)}
                                        required
                                    >
                                        <option value="ritase">Ritase Armada</option>
                                        <option value="sewa_alat">Sewa Alat Jam</option>
                                        <option value="produksi">Sesi Produksi</option>
                                    </select>
                                    <InputError message={errors.sumber_tagihan} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <InputLabel htmlFor="tanggal_jatuh_tempo" value="Tanggal Jatuh Tempo" />
                                    <TextInput
                                        id="tanggal_jatuh_tempo"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.tanggal_jatuh_tempo}
                                        onChange={(e) => setData('tanggal_jatuh_tempo', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.tanggal_jatuh_tempo} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="catatan" value="Catatan / Keterangan Invoice" />
                                    <TextInput
                                        id="catatan"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.catatan}
                                        onChange={(e) => setData('catatan', e.target.value)}
                                        placeholder="Catatan tambahan untuk invoice ini"
                                    />
                                    <InputError message={errors.catatan} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Items Review */}
                        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Pilih Item Belum Ditagih</h3>
                                    <p className="text-xs text-gray-500">Pilih item dari {data.sumber_tagihan.replace('_', ' ')} yang akan dimasukkan ke invoice ini</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500">Estimasi Total Selected</span>
                                    <p className="text-lg font-bold text-indigo-600">
                                        Rp {totalEstimasi.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            <InputError message={errors.item_ids} className="mt-2" />

                            {loadingItems ? (
                                <div className="py-8 text-center text-gray-500">Memuat data item belum ditagih...</div>
                            ) : unbilledItems.length === 0 ? (
                                <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                                    Tidak ditemukan transaksi {data.sumber_tagihan.replace('_', ' ')} yang belum ditagih untuk filter ini.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-center w-12">
                                                    <button
                                                        type="button"
                                                        onClick={toggleSelectAll}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        {selectedItemIds.length === unbilledItems.length ? (
                                                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                        ) : (
                                                            <Square className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi Item</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Satuan (Rp)</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal (Rp)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {unbilledItems.map((item) => {
                                                const isSelected = selectedItemIds.includes(item.id);
                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-indigo-50/40' : ''}`}
                                                        onClick={() => toggleSelectItem(item.id)}
                                                    >
                                                        <td className="px-4 py-4 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => {}} // handled by tr click
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                            {item.deskripsi}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700 text-right">
                                                            {item.jumlah}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700 text-right">
                                                            Rp {Number(item.harga_satuan).toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-right text-gray-900">
                                                            Rp {Number(item.subtotal).toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Submit Footer */}
                        <div className="flex items-center justify-end space-x-3 bg-white p-4 rounded-lg shadow-sm">
                            <Link href={route('finance.invoice.index')}>
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing || selectedItemIds.length === 0}>
                                Buat Invoice ({selectedItemIds.length} Item Selected)
                            </PrimaryButton>
                        </div>

                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
