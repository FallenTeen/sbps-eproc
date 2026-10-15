import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { Users, Plus, Briefcase } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index({ auth, karyawans, filters, sort, direction }) {
    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const columns = [
        {
            key: 'nama',
            label: 'Karyawan',
            type: 'text',
            placeholder: 'Nama / email',
            render: (k) => (
                <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                            {k.nama}
                            {k.alias ? (
                                <span className="ml-1 text-xs font-normal text-indigo-600">alias "{k.alias}"</span>
                            ) : null}
                        </div>
                        <div className="text-xs text-gray-500">{k.no_hp || k.user?.email || '-'}</div>
                    </div>
                </div>
            ),
        },
        { key: 'jabatan', label: 'Jabatan', type: 'text' },
        {
            key: 'tipe',
            label: 'Tipe',
            type: 'select',
            options: [
                { value: 'tetap', label: 'Tetap' },
                { value: 'harian', label: 'Harian' },
                { value: 'borongan_rit', label: 'Borongan Rit' },
            ],
            render: (k) => <span className="capitalize text-sm text-gray-900">{k.tipe.replace('_', ' ')}</span>,
        },
        {
            key: 'gaji',
            label: 'Rate Gaji',
            search: false,
            sortable: false,
            render: (k) => (
                <div className="text-sm text-gray-900">
                    {k.tipe === 'tetap' && formatCurrency(k.rate_gaji_pokok) + ' / bulan'}
                    {k.tipe === 'harian' && formatCurrency(k.rate_harian) + ' / hari'}
                    {k.tipe === 'borongan_rit' && 'Sesuai Tarif Rute'}
                </div>
            ),
        },
        {
            key: 'assignment',
            label: 'Assignment Terkini',
            search: false,
            sortable: false,
            render: (k) =>
                k.assignments && k.assignments.length > 0 ? (
                    <div className="flex items-center text-sm text-gray-900">
                        <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                        {k.assignments[0].titik.nama}
                    </div>
                ) : (
                    <span className="text-sm text-gray-400 italic">Belum ditugaskan</span>
                ),
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Non Aktif' },
            ],
            render: (k) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    k.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {k.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                </span>
            ),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName: 'px-4 py-3 whitespace-nowrap text-right text-sm font-medium',
            render: (k) => (
                <>
                    <Link href={route('hr.karyawan.show', k.id)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                        Detail
                    </Link>
                    <Link href={route('hr.karyawan.edit', k.id)} className="text-amber-600 hover:text-amber-900">
                        Edit
                    </Link>
                </>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Karyawan</h2>}
        >
            <Head title="Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-end items-center">
                        <Link href={route('hr.karyawan.create')}>
                            <PrimaryButton>
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Karyawan
                            </PrimaryButton>
                        </Link>
                    </div>

                    <DataTable
                        routeName="hr.karyawan.index"
                        columns={columns}
                        rows={karyawans}
                        filters={filters}
                        sort={sort}
                        direction={direction}
                        emptyMessage="Tidak ada data karyawan ditemukan."
                    />

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
