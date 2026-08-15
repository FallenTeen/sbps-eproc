import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft } from 'lucide-react';

export default function Create({ akunKasList }) {
    const { auth } = usePage().props;
    const { data, setData, post, errors, processing } = useForm({
        dari_akun_kas_bank_id: '',
        ke_akun_kas_bank_id: '',
        jumlah: '',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('finance.transfer-kas.store'));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Transfer Antar Kas</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dari Akun *</label>
                        <select
                            value={data.dari_akun_kas_bank_id}
                            onChange={(e) => setData('dari_akun_kas_bank_id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Akun Sumber</option>
                            {akunKasList?.map((akun) => (
                                <option key={akun.id} value={akun.id}>{akun.nama} ({formatCurrency(akun.saldo || 0)})</option>
                            ))}
                        </select>
                        {errors.dari_akun_kas_bank_id && <p className="text-red-600 text-sm mt-1">{errors.dari_akun_kas_bank_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ke Akun *</label>
                        <select
                            value={data.ke_akun_kas_bank_id}
                            onChange={(e) => setData('ke_akun_kas_bank_id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Akun Tujuan</option>
                            {akunKasList?.map((akun) => (
                                <option key={akun.id} value={akun.id}>{akun.nama}</option>
                            ))}
                        </select>
                        {errors.ke_akun_kas_bank_id && <p className="text-red-600 text-sm mt-1">{errors.ke_akun_kas_bank_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.jumlah}
                            onChange={(e) => setData('jumlah', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                        />
                        {errors.jumlah && <p className="text-red-600 text-sm mt-1">{errors.jumlah}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input type="date" value={data.tanggal} onChange={(e) => setData('tanggal', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea value={data.catatan} onChange={(e) => setData('catatan', e.target.value)} rows="3" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => window.history.back()} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">
                        {processing ? 'Memproses...' : 'Transfer'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}