import React from 'react';
import { useForm } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import PilihLokasiDariLink from '@/Components/PilihLokasiDariLink';
import { ArrowLeft } from 'lucide-react';

export default function Edit({ titik, proyeks }) {
    const { data, setData, put, errors, processing } = useForm({
        nama: titik.nama || '',
        latitude: titik.latitude ?? '',
        longitude: titik.longitude ?? '',
        radius_presensi_meter: titik.radius_presensi_meter ?? 100,
        status: titik.status || 'aktif',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('core.titik.update', titik.id));
    };

    const proyek = titik.proyek || proyeks.find((p) => String(p.id) === String(titik.proyek_id));

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Edit Titik: {titik.nama}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proyek</label>
                        <input
                            type="text"
                            value={proyek ? `${proyek.kode_proyek} - ${proyek.nama}` : titik.proyek_id}
                            readOnly
                            className="w-full border border-gray-200 bg-gray-100 rounded-md px-3 py-2 text-gray-600"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Titik *</label>
                        <input
                            type="text"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.nama && <p className="text-red-600 text-sm mt-1">{errors.nama}</p>}
                    </div>

                    <PilihLokasiDariLink
                        initialLatitude={titik.latitude}
                        initialLongitude={titik.longitude}
                        onConfirm={({ latitude, longitude }) => {
                            setData({
                                ...data,
                                latitude: latitude,
                                longitude: longitude,
                            });
                        }}
                    />
                    {errors.latitude && <p className="text-red-600 text-sm mt-1 md:col-span-2">{errors.latitude}</p>}
                    {errors.longitude && <p className="text-red-600 text-sm mt-1 md:col-span-2">{errors.longitude}</p>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Radius Presensi (meter)</label>
                        <input
                            type="number"
                            min="0"
                            value={data.radius_presensi_meter}
                            onChange={(e) => setData('radius_presensi_meter', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.radius_presensi_meter && <p className="text-red-600 text-sm mt-1">{errors.radius_presensi_meter}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                        {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status}</p>}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan...' : 'Update'}
                    </button>
                </div>
            </form>
        </Layout>
    );
}
