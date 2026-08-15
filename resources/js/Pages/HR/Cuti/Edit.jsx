import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft } from "lucide-react";

export default function Edit({ cuti }) {
    const { data, setData, put, errors, processing } = useForm({
        karyawan_id: cuti.karyawan_id,
        tipe: cuti.tipe,
        tanggal_mulai: cuti.tanggal_mulai,
        tanggal_selesai: cuti.tanggal_selesai,
        catatan: cuti.catatan || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("hr.cuti.update", cuti.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Cuti" />

            <div className="mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Edit Pengajuan Cuti</h1>
                <p className="mt-1 text-sm text-gray-500">{cuti.karyawan?.nama}</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Cuti *</label>
                    <select
                        value={data.tipe}
                        onChange={(e) => setData("tipe", e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    >
                        <option value="tahunan">Cuti Tahunan</option>
                        <option value="sakit">Sakit</option>
                        <option value="melahirkan">Melahirkan</option>
                        <option value="penting">Keperluan Penting</option>
                        <option value="lainnya">Lainnya</option>
                    </select>
                    {errors.tipe && <p className="text-red-600 text-sm mt-1">{errors.tipe}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
                        <input
                            type="date"
                            value={data.tanggal_mulai}
                            onChange={(e) => setData("tanggal_mulai", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.tanggal_mulai && <p className="text-red-600 text-sm mt-1">{errors.tanggal_mulai}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai *</label>
                        <input
                            type="date"
                            value={data.tanggal_selesai}
                            min={data.tanggal_mulai}
                            onChange={(e) => setData("tanggal_selesai", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.tanggal_selesai && <p className="text-red-600 text-sm mt-1">{errors.tanggal_selesai}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Alasan</label>
                    <textarea
                        value={data.catatan}
                        onChange={(e) => setData("catatan", e.target.value)}
                        rows="3"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                    {errors.catatan && <p className="text-red-600 text-sm mt-1">{errors.catatan}</p>}
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
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
                    >
                        {processing ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}