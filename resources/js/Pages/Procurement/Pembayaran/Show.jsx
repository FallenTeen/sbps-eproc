import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Printer } from 'lucide-react';

export default function Show({ pembayaran }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('procurement.pembayaran.index')} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Detail Pembayaran</h1>
                <button
                    onClick={() => window.open(route('procurement.pembayaran.print', pembayaran.id), '_blank')}
                    className="ml-auto px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center gap-1"
                >
                    <Printer className="w-4 h-4" />
                    Cetak
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                    <div><strong>PO:</strong> {pembayaran.purchase_order?.kode_po || '-'}</div>
                    <div><strong>Jumlah:</strong> {formatCurrency(pembayaran.jumlah)}</div>
                    <div><strong>Metode:</strong> {pembayaran.metode}</div>
                    <div><strong>Akun Kas/Bank:</strong> {pembayaran.akun_kas_bank?.nama || '-'}</div>
                    <div><strong>Tanggal:</strong> {new Date(pembayaran.tanggal).toLocaleDateString('id-ID')}</div>
                    <div><strong>Dicatat Oleh:</strong> {pembayaran.dicatat_oleh?.name || '-'}</div>
                    <div className="col-span-2"><strong>Catatan:</strong> {pembayaran.catatan || '-'}</div>
                </div>

                {/* Mutasi Kas terkait */}
                {pembayaran.mutasi_kas_bank && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border">
                        <h3 className="font-medium text-sm mb-2">Mutasi Kas Terkait</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>Akun:</strong> {pembayaran.mutasi_kas_bank.akun_kas_bank?.nama}</div>
                            <div><strong>Tipe:</strong> {pembayaran.mutasi_kas_bank.tipe === 'keluar' ? '⬇️ Keluar' : '⬆️ Masuk'}</div>
                            <div><strong>Kategori:</strong> {pembayaran.mutasi_kas_bank.kategori}</div>
                            <div><strong>Tanggal:</strong> {new Date(pembayaran.mutasi_kas_bank.tanggal).toLocaleDateString('id-ID')}</div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}