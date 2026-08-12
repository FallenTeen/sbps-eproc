import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Building2, ArrowRight, MapPin, Calendar } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index({ auth, proyekList = [] }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Portal Kontraktor</h2>}
        >
            <Head title="Portal Kontraktor" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Daftar Proyek Kontrak Klien</h3>
                        <p className="text-xs text-gray-500 mb-6">Pilih proyek untuk melihat progres produksi, RAB agregat, invoice, dan log komunikasi.</p>

                        {proyekList.length === 0 ? (
                            <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg">
                                Tidak ada proyek bertipe Kontrak Klien yang tersedia.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {proyekList.map((proyek) => (
                                    <div key={proyek.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                                                    {proyek.kode_proyek}
                                                </span>
                                                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 capitalize">
                                                    {proyek.status}
                                                </span>
                                            </div>

                                            <div>
                                                <h4 className="text-md font-bold text-gray-900">{proyek.nama}</h4>
                                                <p className="text-xs text-gray-500 font-medium">Klien: {proyek.client || '-'}</p>
                                            </div>

                                            <div className="text-xs text-gray-600 space-y-1 pt-2 border-t">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{proyek.lokasi || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>Mulai: {proyek.tanggal_mulai ? new Date(proyek.tanggal_mulai).toLocaleDateString('id-ID') : '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-4 border-t">
                                            <Link href={route('kontraktor.proyek.detail', proyek.id)}>
                                                <PrimaryButton className="w-full flex items-center justify-center gap-2">
                                                    Buka Portal Proyek <ArrowRight className="w-4 h-4" />
                                                </PrimaryButton>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
