import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Save } from "lucide-react";

export default function Create({ presensis }) {
    const [data, setData] = useState({
        presensi_id: "",
        kondisi_area: "",
        aktivitas_dilakukan: "",
        kendala: "",
        foto: "",
        catatan_tambahan: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route("attendance.formulir.store"), data, {
            onSuccess: () => setProcessing(false),
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Formulir Lapangan" />

            <div className="mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Buat Formulir Lapangan</h1>
                <p className="mt-1 text-sm text-gray-500">Laporan aktivitas harian di titik kerja</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Presensi *</label>
                    <select
                        value={data.presensi_id}
                        onChange={(e) => setData({ ...data, presensi_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    >
                        <option value="">Pilih Presensi</option>
                        {presensis.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.karyawan?.nama} — {new Date(p.check_in).toLocaleString("id-ID")}
                            </option>
                        ))}
                    </select>
                    {errors.presensi_id && <p className="text-red-600 text-sm mt-1">{errors.presensi_id}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi Area</label>
                    <textarea
                        value={data.kondisi_area}
                        onChange={(e) => setData({ ...data, kondisi_area: e.target.value })}
                        rows="2"
                        placeholder="Cuaca, kebersihan, keselamatan lokasi..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                    {errors.kondisi_area && <p className="text-red-600 text-sm mt-1">{errors.kondisi_area}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aktivitas Dilakukan *</label>
                    <textarea
                        value={data.aktivitas_dilakukan}
                        onChange={(e) => setData({ ...data, aktivitas_dilakukan: e.target.value })}
                        rows="3"
                        placeholder="Deskripsikan pekerjaan yang dilakukan"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                    {errors.aktivitas_dilakukan && <p className="text-red-600 text-sm mt-1">{errors.aktivitas_dilakukan}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kendala</label>
                    <textarea
                        value={data.kendala}
                        onChange={(e) => setData({ ...data, kendala: e.target.value })}
                        rows="2"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                    {errors.kendala && <p className="text-red-600 text-sm mt-1">{errors.kendala}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto (opsional)</label>
                    <input
                        type="text"
                        value={data.foto}
                        onChange={(e) => setData({ ...data, foto: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                    {errors.foto && <p className="text-red-600 text-sm mt-1">{errors.foto}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
                    <textarea
                        value={data.catatan_tambahan}
                        onChange={(e) => setData({ ...data, catatan_tambahan: e.target.value })}
                        rows="2"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                    {errors.catatan_tambahan && <p className="text-red-600 text-sm mt-1">{errors.catatan_tambahan}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {processing ? "Menyimpan..." : "Kirim Formulir"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}