import Layout from '@/Components/Layout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';

export default function Create({ proyeks, suppliers, bahanBakus }) {
    const { data, setData, post, errors } = useForm({
        proyek_id: '',
        titik_id: '',
        supplier_id: '',
        tanggal_pesan: '',
        tanggal_diperlukan: '',
        catatan: '',
        items: [{ bahan_baku_id: '', jumlah: 0, harga_satuan_snapshot: 0 }],
    });

    const addItem = () => {
        setData('items', [...data.items, { bahan_baku_id: '', jumlah: 0, harga_satuan_snapshot: 0 }]);
    };

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('procurement.purchase-orders.store'));
    };

    return (
        <Layout>
            <h1 className="text-2xl font-bold mb-4">Buat Purchase Order</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block">Proyek</label>
                        <select value={data.proyek_id} onChange={e => setData('proyek_id', e.target.value)} className="w-full border rounded p-2">
                            <option value="">Pilih Proyek</option>
                            {proyeks.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                        {errors.proyek_id && <div className="text-red-600">{errors.proyek_id}</div>}
                    </div>
                    <div>
                        <label className="block">Supplier</label>
                        <select value={data.supplier_id} onChange={e => setData('supplier_id', e.target.value)} className="w-full border rounded p-2">
                            <option value="">Pilih Supplier</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                        </select>
                        {errors.supplier_id && <div className="text-red-600">{errors.supplier_id}</div>}
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block">Tanggal Pesan</label>
                    <input type="date" value={data.tanggal_pesan} onChange={e => setData('tanggal_pesan', e.target.value)} className="border rounded p-2 w-full" />
                </div>

                <div className="mt-4">
                    <label className="block">Catatan</label>
                    <textarea value={data.catatan} onChange={e => setData('catatan', e.target.value)} className="border rounded p-2 w-full" rows="3"></textarea>
                </div>

                <div className="mt-6">
                    <h3 className="font-semibold">Item PO</h3>
                    {data.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-end border-b py-2">
                            <div>
                                <label>Bahan Baku</label>
                                <select value={item.bahan_baku_id} onChange={e => {
                                    const newItems = [...data.items];
                                    newItems[index].bahan_baku_id = e.target.value;
                                    setData('items', newItems);
                                }} className="w-full border rounded p-1">
                                    <option value="">Pilih</option>
                                    {bahanBakus.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
                                </select>
                            </div>
                            <div>
                                <label>Jumlah</label>
                                <input type="number" step="0.01" value={item.jumlah} onChange={e => {
                                    const newItems = [...data.items];
                                    newItems[index].jumlah = parseFloat(e.target.value);
                                    setData('items', newItems);
                                }} className="w-full border rounded p-1" />
                            </div>
                            <div>
                                <label>Harga Satuan</label>
                                <input type="number" step="0.01" value={item.harga_satuan_snapshot} onChange={e => {
                                    const newItems = [...data.items];
                                    newItems[index].harga_satuan_snapshot = parseFloat(e.target.value);
                                    setData('items', newItems);
                                }} className="w-full border rounded p-1" />
                            </div>
                            <div>
                                <button type="button" onClick={() => removeItem(index)} className="text-red-600">Hapus</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addItem} className="mt-2 text-blue-600">+ Tambah Item</button>
                </div>

                <div className="mt-6">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Simpan PO</button>
                </div>
            </form>
        </Layout>
    );
}
