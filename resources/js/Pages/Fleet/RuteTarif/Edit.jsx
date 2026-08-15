import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Edit({ ruteTarif, unitBisnis }) {
    const { data, setData, put, errors, processing } = useForm({
        unit_bisnis_id: ruteTarif.unit_bisnis_id,
        lokasi_asal: ruteTarif.lokasi_asal,
        lokasi_tujuan: ruteTarif.lokasi_tujuan,
        jarak_km: ruteTarif.jarak_km,
        tarif_per_rit: ruteTarif.tarif_per_rit,
        indeks_liter_solar_per_km: ruteTarif.indeks_liter_solar_per_km || "",
        berlaku_dari: ruteTarif.berlaku_dari,
        berlaku_sampai: ruteTarif.berlaku_sampai || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("fleet.rute-tarif.update", ruteTarif.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Rute Tarif" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Rute Tarif</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {ruteTarif.lokasi_asal} → {ruteTarif.lokasi_tujuan}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Bisnis *</label>
                        <select
                            value={data.unit_bisnis_id}
                            onChange={(e) => setData("unit_bisnis_id", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Pilih Unit</option>
                            {unitBisnis.map((u) => (
                                <option key={u.id} value={u.id}>{u.nama}</option>
                            ))}
                        </select>
                        {errors.unit_bisnis_id && <p className="text-red-600 text-sm mt-1">{errors.unit_bisnis_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Asal *</label>
                        <input
                            type="text"
                            value={data.lokasi_asal}
                            onChange={(e) => setData("lokasi_asal", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.lokasi_asal && <p className="text-red-600 text-sm mt-1">{errors.lokasi_asal}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Tujuan *</label>
                        <input
                            type="text"
                            value={data.lokasi_tujuan}
                            onChange={(e) => setData("lokasi_tujuan", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.lokasi_tujuan && <p className="text-red-600 text-sm mt-1">{errors.lokasi_tujuan}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jarak (km) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.jarak_km}
                            onChange={(e) => setData("jarak_km", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.jarak_km && <p className="text-red-600 text-sm mt-1">{errors.jarak_km}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarif / Rit *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.tarif_per_rit}
                            onChange={(e) => setData("tarif_per_rit", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.tarif_per_rit && <p className="text-red-600 text-sm mt-1">{errors.tarif_per_rit}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Indeks Liter Solar / km</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={data.indeks_liter_solar_per_km}
                            onChange={(e) => setData("indeks_liter_solar_per_km", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Dari *</label>
                        <input
                            type="date"
                            value={data.berlaku_dari}
                            onChange={(e) => setData("berlaku_dari", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.berlaku_dari && <p className="text-red-600 text-sm mt-1">{errors.berlaku_dari}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Sampai</label>
                        <input
                            type="date"
                            value={data.berlaku_sampai}
                            onChange={(e) => setData("berlaku_sampai", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
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
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
                    >
                        {processing ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}