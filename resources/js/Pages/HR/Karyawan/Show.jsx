import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Users, 
    ArrowLeft, 
    Briefcase,
    MapPin,
    Calendar,
    Save,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TitikSelectorWithMap from '@/Components/TitikSelectorWithMap';

export default function Show({ auth, karyawan, titiks }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        titik_id: '',
        tanggal_mulai: new Date().toISOString().split('T')[0],
    });

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);

    const submitAssign = (e) => {
        e.preventDefault();
        post(route('hr.karyawan.assign-titik', karyawan.id), {
            onSuccess: () => reset(),
        });
    };

    const confirmDelete = (assignmentId) => {
        setAssignmentToDelete(assignmentId);
        setConfirmingDeletion(true);
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
        setAssignmentToDelete(null);
    };

    const deleteAssignment = (e) => {
        e.preventDefault();
        router.post(route('hr.karyawan.remove-titik', karyawan.id), {
            assignment_id: assignmentToDelete
        }, {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Detail Karyawan</h2>}
        >
            <Head title={`Detail Karyawan - ${karyawan.nama}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Action */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {karyawan.nama}
                                    {karyawan.alias ? (
                                        <span className="ml-2 text-sm font-normal text-indigo-600">
                                            alias "{karyawan.alias}"
                                        </span>
                                    ) : null}
                                </h3>
                                <p className="text-sm text-gray-500">{karyawan.jabatan}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href={route('hr.karyawan.edit', karyawan.id)}>
                                <SecondaryButton>Edit Data</SecondaryButton>
                            </Link>
                            <Link href={route('hr.karyawan.index')}>
                                <PrimaryButton className="bg-gray-600 hover:bg-gray-700">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Kiri: Profil & Info Dasar */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h4 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-indigo-500" />
                                    Informasi Kepegawaian
                                </h4>
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Tipe Karyawan</dt>
                                        <dd className="mt-1 text-sm text-gray-900 capitalize">{karyawan.tipe.replace('_', ' ')}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status Aktif</dt>
                                        <dd className="mt-1">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                karyawan.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {karyawan.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                                            </span>
                                        </dd>
                                    </div>
                                    {karyawan.tipe === 'tetap' && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Rate Gaji Pokok</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{formatCurrency(karyawan.rate_gaji_pokok)} / bulan</dd>
                                        </div>
                                    )}
                                    {karyawan.tipe === 'harian' && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Rate Harian</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{formatCurrency(karyawan.rate_harian)} / hari</dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">No. HP</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{karyawan.no_hp || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Akun Login</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{karyawan.user?.email || <span className="text-gray-400 italic">Belum ditautkan</span>}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h4 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Administrasi & Pajak</h4>
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status PTKP</dt>
                                        <dd className="mt-1 text-sm text-gray-900 uppercase">{karyawan.status_ptkp || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">NPWP</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{karyawan.npwp || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">BPJS Kesehatan</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{karyawan.no_bpjs_kesehatan || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">BPJS Ketenagakerjaan</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{karyawan.no_bpjs_ketenagakerjaan || '-'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Kanan: Riwayat Penugasan / Assignment */}
                        <div className="md:col-span-2 space-y-6">
                            
                            {/* Form Assign Titik Baru */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
                                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-500" />
                                    Penugasan Lokasi (Titik)
                                </h4>
                                <p className="text-sm text-gray-600 mb-4">
                                    Penugasan titik baru akan otomatis menutup/mengakhiri penugasan yang masih aktif saat ini.
                                </p>
                                
                                <form onSubmit={submitAssign} className="flex flex-col gap-4 bg-gray-50 p-4 rounded-md">
                                    <div className="w-full">
                                        <TitikSelectorWithMap
                                            id="titik_id"
                                            name="titik_id"
                                            titiks={titiks}
                                            value={data.titik_id}
                                            onChange={(val) => setData('titik_id', val)}
                                            error={errors.titik_id}
                                            label="Pilih Titik Lokasi"
                                            placeholder="-- Pilih Titik --"
                                            required={true}
                                            mapHeight="280px"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                                        <div className="w-full sm:w-48">
                                            <InputLabel htmlFor="tanggal_mulai" value="Tgl. Mulai Berlaku" />
                                            <input
                                                type="date"
                                                id="tanggal_mulai"
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                value={data.tanggal_mulai}
                                                onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.tanggal_mulai} className="mt-2" />
                                        </div>
                                        <PrimaryButton disabled={processing} className="h-[42px] mb-[2px]">
                                            <Save className="w-4 h-4 mr-2" /> Assign
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>

                            {/* Tabel Riwayat Assignment */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                    Riwayat Penugasan
                                </h4>
                                
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi / Titik</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {karyawan.assignments && karyawan.assignments.map((assignment) => (
                                                <tr key={assignment.id} className={assignment.status === 'aktif' ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {assignment.status === 'aktif' && <CheckCircle2 className="inline w-4 h-4 text-green-500 mr-1" />}
                                                            {assignment.titik?.nama}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {formatDate(assignment.tanggal_mulai)} - {assignment.tanggal_selesai ? formatDate(assignment.tanggal_selesai) : 'Sekarang'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            assignment.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {assignment.status === 'aktif' ? 'Aktif' : 'Selesai'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                        <button 
                                                            onClick={() => confirmDelete(assignment.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!karyawan.assignments || karyawan.assignments.length === 0) && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500 italic">
                                                        Belum ada riwayat penugasan untuk karyawan ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <Modal show={confirmingDeletion} onClose={closeModal}>
                <form onSubmit={deleteAssignment} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Hapus Riwayat Penugasan?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Apakah Anda yakin ingin menghapus data penugasan ini secara permanen?
                    </p>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>

                        <DangerButton className="ml-3" disabled={processing}>
                            Hapus Penugasan
                        </DangerButton>
                    </div>
                </form>
            </Modal>

        </AuthenticatedLayout>
    );
}
