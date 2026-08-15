import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Edit } from 'lucide-react';

export default function Show({ unitBisnis, stats }) {
    return (
        <AuthenticatedLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('core.unit-bisnis.index')} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Detail Unit Bisnis</h1>
                <Link
                    href={route('core.unit-bisnis.edit', unitBisnis.id)}
                    className="ml-auto px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm flex items-center gap-1"
                >
                    <Edit className="w-4 h-4" />
                    Edit
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-2 gap-4">
                    <div><strong>Kode:</strong> {unitBisnis.kode}</div>
                    <div><strong>Nama:</strong> {unitBisnis.nama}</div>
                    <div className="col-span-2"><strong>Deskripsi:</strong> {unitBisnis.deskripsi || '-'}</div>
                    <div>
                        <strong>Status:</strong>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${unitBisnis.aktif ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {unitBisnis.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded p-4 text-center">
                        <div className="text-2xl font-bold">{stats.proyek || 0}</div>
                        <div className="text-sm text-gray-500">Proyek</div>
                    </div>
                    <div className="bg-gray-50 rounded p-4 text-center">
                        <div className="text-2xl font-bold">{stats.armada || 0}</div>
                        <div className="text-sm text-gray-500">Armada</div>
                    </div>
                    <div className="bg-gray-50 rounded p-4 text-center">
                        <div className="text-2xl font-bold">{stats.mesin || 0}</div>
                        <div className="text-sm text-gray-500">Mesin Produksi</div>
                    </div>
                    <div className="bg-gray-50 rounded p-4 text-center">
                        <div className="text-2xl font-bold">{stats.akun_kas || 0}</div>
                        <div className="text-sm text-gray-500">Akun Kas/Bank</div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}