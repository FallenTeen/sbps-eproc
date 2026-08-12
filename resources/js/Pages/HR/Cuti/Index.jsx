import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Calendar,
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    FileText
} from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function Index({ auth, cutis, karyawan, filters }) {
    const [showingAddModal, setShowingAddModal] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        karyawan_id: '',
        tipe: 'tahunan',
        tanggal_mulai: '',
        tanggal_selesai: '',
        catatan: '',
    });

    const submitAdd = (e) => {
        e.preventDefault();
        post(route('hr.cuti.store'), {
            onSuccess: () => {
                setShowingAddModal(false);
                reset();
            },
        });
    };

    const handleApprove = (id) => {
        if (confirm('Apakah Anda yakin ingin menyetujui cuti ini?')) {
            router.post(route('hr.cuti.approve', id), {}, { preserveScroll: true });
        }
    };

    const handleReject = (id) => {
        const catatan = prompt('Alasan penolakan (opsional):');
        if (catatan !== null) {
            router.post(route('hr.cuti.reject', id), { catatan }, { preserveScroll: true });
        }
    };

    const handleFilterChange = (e) => {
        router.get(route('hr.cuti.index'), { status: e.target.value }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Pengajuan Cuti Karyawan</h2>}
        >
            <Head title="Manajemen Cuti" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header Action */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                            <select 
                                value={filters.status} 
                                onChange={handleFilterChange}
                                className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            >
                                <option value="all">Semua Status</option>
                                <option value="diajukan">Menunggu Approval (Diajukan)</option>
                                <option value="disetujui">Disetujui</option>
                                <option value="ditolak">Ditolak</option>
                            </select>
                        </div>
                        <PrimaryButton onClick={() => setShowingAddModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajukan Cuti Baru
                        </PrimaryButton>
                    </div>

                    {/* Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karyawan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe Cuti</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {cutis.map((cuti) => (
                                        <tr key={cuti.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{cuti.karyawan?.nama}</div>
                                                <div className="text-xs text-gray-500 capitalize">{cuti.karyawan?.tipe?.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap capitalize text-sm text-gray-900">
                                                {cuti.tipe}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {cuti.tanggal_mulai} s/d {cuti.tanggal_selesai}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full flex items-center w-fit gap-1 ${
                                                    cuti.status === 'disetujui' ? 'bg-green-100 text-green-800' : 
                                                    cuti.status === 'ditolak' ? 'bg-red-100 text-red-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {cuti.status === 'disetujui' ? <CheckCircle2 className="w-3 h-3"/> : 
                                                     cuti.status === 'ditolak' ? <XCircle className="w-3 h-3" /> :
                                                     <Clock className="w-3 h-3"/>}
                                                    {cuti.status.charAt(0).toUpperCase() + cuti.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {cuti.status === 'diajukan' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleApprove(cuti.id)} 
                                                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-xs font-bold"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReject(cuti.id)} 
                                                            className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-xs font-bold"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">
                                                        Oleh {cuti.disetujui_oleh?.name || 'Sistem'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {cutis.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                Tidak ada data cuti yang sesuai filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal Tambah Cuti */}
            <Modal show={showingAddModal} onClose={() => setShowingAddModal(false)}>
                <form onSubmit={submitAdd} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center mb-6">
                        <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                        Pengajuan Cuti Baru
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="karyawan_id" value="Karyawan" />
                            <select
                                id="karyawan_id"
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.karyawan_id}
                                onChange={(e) => setData('karyawan_id', e.target.value)}
                                required
                            >
                                <option value="">-- Pilih Karyawan --</option>
                                {karyawan.map(k => (
                                    <option key={k.id} value={k.id}>{k.nama} ({k.tipe})</option>
                                ))}
                            </select>
                            <InputError message={errors.karyawan_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="tipe" value="Tipe Cuti" />
                            <select
                                id="tipe"
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.tipe}
                                onChange={(e) => setData('tipe', e.target.value)}
                                required
                            >
                                <option value="tahunan">Cuti Tahunan</option>
                                <option value="sakit">Sakit</option>
                                <option value="melahirkan">Melahirkan</option>
                                <option value="penting">Keperluan Penting</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                            <InputError message={errors.tipe} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="tanggal_mulai" value="Tanggal Mulai" />
                                <input
                                    id="tanggal_mulai"
                                    type="date"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.tanggal_mulai}
                                    onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                    required
                                />
                                <InputError message={errors.tanggal_mulai} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="tanggal_selesai" value="Tanggal Selesai" />
                                <input
                                    id="tanggal_selesai"
                                    type="date"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.tanggal_selesai}
                                    min={data.tanggal_mulai}
                                    onChange={(e) => setData('tanggal_selesai', e.target.value)}
                                    required
                                />
                                <InputError message={errors.tanggal_selesai} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="catatan" value="Catatan / Alasan" />
                            <textarea
                                id="catatan"
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                rows="3"
                                value={data.catatan}
                                onChange={(e) => setData('catatan', e.target.value)}
                            />
                            <InputError message={errors.catatan} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => setShowingAddModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton className="ml-3" disabled={processing}>Ajukan Cuti</PrimaryButton>
                    </div>
                </form>
            </Modal>

        </AuthenticatedLayout>
    );
}
