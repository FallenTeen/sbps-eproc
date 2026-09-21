import React, { useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import PetaTitikProyek from '@/Components/PetaTitikProyek';
import { ArrowLeft, Edit, Trash2, MapPin } from 'lucide-react';

export default function Show({ titik }) {
    const { auth } = usePage().props;
    const roles = auth?.roles || [];

    const can = useMemo(() => ({
        update: () => {
            if (roles.includes('Owner')) return true;
            return ['Koordinator Procurement', 'Koordinator GCS', 'Koordinator CBP', 'Koordinator AMP', 'Koordinator SDM']
                .some((r) => roles.includes(r));
        },
        delete: () => roles.includes('Owner'),
    }), [roles]);

    const proyek = titik.proyek;
    const hasCoords = titik.latitude != null && titik.longitude != null;

    const handleDelete = () => {
        if (window.confirm('Yakin hapus titik ini?')) {
            router.delete(route('core.titik.destroy', titik.id));
        }
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('core.titik.index', titik.proyek_id)} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">{titik.nama}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    titik.status === 'nonaktif' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                }`}>
                    {titik.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
                </span>
                <div className="ml-auto flex gap-2">
                    {can.update() && (
                        <Link
                            href={route('core.titik.edit', titik.id)}
                            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm flex items-center gap-1"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Link>
                    )}
                    {can.delete() && (
                        <button
                            onClick={handleDelete}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4">Informasi Titik</h2>
                    <div className="space-y-3 text-sm">
                        <div><strong>Nama:</strong> {titik.nama}</div>
                        <div><strong>Proyek:</strong> {proyek ? `${proyek.kode_proyek} - ${proyek.nama}` : '-'}</div>
                        <div><strong>Status:</strong> {titik.status}</div>
                        <div className="flex items-center gap-2">
                            <strong>Koordinat:</strong>
                            {hasCoords ? (
                                <span className="font-mono">
                                    {Number(titik.latitude).toFixed(6)}, {Number(titik.longitude).toFixed(6)}
                                </span>
                            ) : (
                                <span className="text-gray-400 italic">Belum ada koordinat</span>
                            )}
                        </div>
                        <div><strong>Radius Presensi:</strong> {titik.radius_presensi_meter ?? 0} meter</div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Relasi</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 rounded p-3">
                                <div className="text-gray-500">RAB</div>
                                <div className="font-semibold">{titik.rab?.length ?? 0}</div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                                <div className="text-gray-500">Armada</div>
                                <div className="font-semibold">{titik.armadas?.length ?? 0}</div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                                <div className="text-gray-500">Mesin Produksi</div>
                                <div className="font-semibold">{titik.mesin_produksis?.length ?? 0}</div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                                <div className="text-gray-500">Karyawan</div>
                                <div className="font-semibold">{titik.karyawan_assignments?.length ?? 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Peta Lokasi
                    </h2>
                    {hasCoords ? (
                        <PetaTitikProyek
                            titiks={[titik]}
                            selectedTitikId={titik.id}
                            height="360px"
                            showDetailButton={false}
                        />
                    ) : (
                        <p className="text-gray-500 text-sm">
                            Titik ini belum memiliki koordinat. Gunakan Edit untuk menetapkan lokasi dari tautan Google Maps.
                        </p>
                    )}
                </div>
            </div>
        </Layout>
    );
}
