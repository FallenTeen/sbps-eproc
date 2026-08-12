import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Calendar, Wallet } from 'lucide-react';

export default function Mutasi({ auth, akunKas, mutasis = [], filter = {}, summary = {} }) {
    
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        router.get(route('finance.akun-kas.mutasi', akunKas.id), {
            ...filter,
            [name]: value
        }, { preserveState: true });
    };

    const months = [
        { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
        { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
        { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
        { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    const renderReferensi = (mutasi) => {
        if (!mutasi.referensi_type) return <span className="text-gray-400">-</span>;
        const typeName = mutasi.referensi_type.split('\\').pop();
        const shortId = mutasi.referensi_id ? mutasi.referensi_id.substring(0, 8) : '';

        if (typeName === 'TransferAntarKas') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                    Transfer #{shortId}
                </span>
            );
        }
        if (typeName === 'PembayaranKlien') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                    Pembayaran Klien #{shortId}
                </span>
            );
        }
        if (typeName === 'Pembayaran') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                    Pembayaran PO #{shortId}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                {typeName} #{shortId}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('finance.akun-kas.index')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detail Mutasi Kas: {akunKas.nama} ({akunKas.jenis_kas.replace('_', ' ').toUpperCase()})
                    </h2>
                </div>
            }
        >
            <Head title={`Mutasi - ${akunKas.nama}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-400">
                            <div className="text-sm text-gray-500 font-medium mb-1 flex items-center">
                                <Wallet className="w-4 h-4 mr-1 text-gray-400" /> Saldo Awal Akun
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                                Rp {Number(summary.saldo_awal_akun || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                            <div className="text-sm text-green-600 font-medium mb-1 flex items-center">
                                <ArrowDownRight className="w-4 h-4 mr-1" /> Total Kas Masuk
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                                Rp {Number(summary.total_masuk || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                            <div className="text-sm text-red-600 font-medium mb-1 flex items-center">
                                <ArrowUpRight className="w-4 h-4 mr-1" /> Total Kas Keluar
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                                Rp {Number(summary.total_keluar || 0).toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                            <div className="text-sm text-indigo-600 font-medium mb-1 flex items-center">
                                <Wallet className="w-4 h-4 mr-1" /> Saldo Saat Ini
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                                Rp {Number(summary.saldo_saat_ini || 0).toLocaleString('id-ID')}
                            </div>
                        </div>
                    </div>

                    {/* Filter & Mutasi Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Riwayat Mutasi Kas</h3>
                            
                            <div className="flex items-center space-x-3 w-full sm:w-auto">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-600">Periode:</span>
                                </div>
                                <select
                                    name="bulan"
                                    className="border-gray-300 rounded-md shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={filter.bulan || ''}
                                    onChange={handleFilterChange}
                                >
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                                <select
                                    name="tahun"
                                    className="border-gray-300 rounded-md shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={filter.tahun || ''}
                                    onChange={handleFilterChange}
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referensi</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {mutasis.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                Tidak ada transaksi mutasi pada periode yang dipilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        mutasis.map((mutasi) => (
                                            <tr key={mutasi.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {new Date(mutasi.tanggal).toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                                    {mutasi.kategori ? mutasi.kategori.replace('_', ' ') : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {mutasi.tipe === 'masuk' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                            Masuk
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                            Keluar
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                                                    <span className={mutasi.tipe === 'masuk' ? 'text-green-600' : 'text-red-600'}>
                                                        {mutasi.tipe === 'masuk' ? '+' : '-'} Rp {Number(mutasi.jumlah).toLocaleString('id-ID')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {renderReferensi(mutasi)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {mutasi.catatan || '-'}
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
