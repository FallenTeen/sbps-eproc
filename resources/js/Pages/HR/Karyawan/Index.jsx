import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Users, 
    Plus, 
    Search, 
    Filter, 
    Edit, 
    Trash2, 
    Briefcase,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';

export default function Index({ auth, karyawans, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [tipe, setTipe] = useState(filters.tipe || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('hr.karyawan.index'), {
            search,
            tipe,
            status
        }, { preserveState: true, replace: true });
    };

    const clearFilter = () => {
        setSearch('');
        setTipe('');
        setStatus('');
        router.get(route('hr.karyawan.index'));
    };

    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Karyawan</h2>}
        >
            <Head title="Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header Action & Filters */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3 w-full sm:w-auto">
                            <div>
                                <InputLabel value="Cari" />
                                <TextInput
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Nama / Jabatan"
                                    className="block w-full"
                                />
                            </div>
                            <div>
                                <InputLabel value="Tipe" />
                                <select 
                                    value={tipe} 
                                    onChange={e => setTipe(e.target.value)}
                                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm block w-full"
                                >
                                    <option value="">Semua Tipe</option>
                                    <option value="tetap">Tetap</option>
                                    <option value="harian">Harian</option>
                                    <option value="borongan_rit">Borongan Rit</option>
                                </select>
                            </div>
                            <div>
                                <InputLabel value="Status" />
                                <select 
                                    value={status} 
                                    onChange={e => setStatus(e.target.value)}
                                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm block w-full"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Non Aktif</option>
                                </select>
                            </div>
                            <PrimaryButton type="submit" className="h-[42px]">
                                <Search className="w-4 h-4 mr-2" />
                                Filter
                            </PrimaryButton>
                            {(search || tipe || status) && (
                                <button 
                                    type="button" 
                                    onClick={clearFilter}
                                    className="h-[42px] px-4 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Reset
                                </button>
                            )}
                        </form>

                        <Link href={route('hr.karyawan.create')}>
                            <PrimaryButton>
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Karyawan
                            </PrimaryButton>
                        </Link>
                    </div>

                    {/* Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karyawan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe & Jabatan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Gaji</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment Terkini</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {karyawans.data.map((k) => (
                                        <tr key={k.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-indigo-600" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {k.nama}
                                                            {k.alias ? (
                                                                <span className="ml-1 text-xs font-normal text-indigo-600">
                                                                    alias "{k.alias}"
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {k.no_hp || k.user?.email || '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{k.jabatan}</div>
                                                <div className="text-xs text-gray-500 capitalize">{k.tipe.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {k.tipe === 'tetap' && formatCurrency(k.rate_gaji_pokok) + ' / bulan'}
                                                    {k.tipe === 'harian' && formatCurrency(k.rate_harian) + ' / hari'}
                                                    {k.tipe === 'borongan_rit' && 'Sesuai Tarif Rute'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {k.assignments && k.assignments.length > 0 ? (
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                                                        {k.assignments[0].titik.nama}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">Belum ditugaskan</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    k.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {k.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link 
                                                    href={route('hr.karyawan.show', k.id)} 
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    Detail
                                                </Link>
                                                <Link 
                                                    href={route('hr.karyawan.edit', k.id)} 
                                                    className="text-amber-600 hover:text-amber-900"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {karyawans.data.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                Tidak ada data karyawan ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination Component - Standard implementation */}
                        {karyawans.links && karyawans.links.length > 3 && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex flex-wrap -mb-1">
                                    {karyawans.links.map((link, k) => (
                                        <Link
                                            key={k}
                                            href={link.url}
                                            className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${
                                                link.active ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white'
                                            } ${!link.url ? 'text-gray-400 hover:bg-transparent border-transparent' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
