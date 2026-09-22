import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Eye } from 'lucide-react';

export default function Show({ akunKas, summary, mutasis }) {
    const jenisLabel = akunKas.jenis_kas.replace('_', ' ');

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Detail Akun Kas & Bank</h2>}
        >
            <Head title={`${akunKas.nama}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <Link
                                href={route('finance.akun-kas.index')}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {akunKas.nama}
                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 capitalize">
                                        {jenisLabel}
                                    </span>
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {akunKas.unit_bisnis?.nama ?? '-'}
                                    {akunKas.akun_coa ? ` · COA: ${akunKas.akun_coa.kode}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-emerald-700">Total Masuk</p>
                                    <p className="text-lg font-bold text-emerald-900">
                                        Rp {Number(summary.total_masuk).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                                    <TrendingDown className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-red-700">Total Keluar</p>
                                    <p className="text-lg font-bold text-red-900">
                                        Rp {Number(summary.total_keluar).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-900 border border-gray-900 rounded-lg flex items-center gap-3">
                                <div className="p-3 bg-gray-800 text-white rounded-full">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-300">Saldo Saat Ini</p>
                                    <p className="text-lg font-bold text-white">
                                        Rp {Number(summary.saldo_saat_ini).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Mutasi Terakhir (20)</h3>
                            <Link
                                href={route('finance.akun-kas.mutasi', akunKas.id)}
                                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-900"
                            >
                                <Eye className="w-4 h-4" /> Lihat Semua Mutasi
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referensi</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {mutasis.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                Belum ada mutasi pada akun ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        mutasis.map((m) => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {m.tanggal}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                                    {m.kategori.replace('_', ' ')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {m.referensi ? m.referensi.kode_po ?? m.referensi.nama ?? '#' : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                    {m.tipe === 'masuk' ? (
                                                        <span className="text-emerald-600 font-medium">MASUK</span>
                                                    ) : (
                                                        <span className="text-red-600 font-medium">KELUAR</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                                                    Rp {Number(m.jumlah).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}