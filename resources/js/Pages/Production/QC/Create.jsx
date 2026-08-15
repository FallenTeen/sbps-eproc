import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft } from "lucide-react";

export default function Create({ sessions }) {
    const [data, setData] = useState({
        production_session_id: "",
        jenis_uji: "slump_test",
        nilai_slump: "",
        tanggal_uji_tekan_rencana: "",
        catatan: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route("production.qc.store"), data, {
            preserveScroll: true,
            onSuccess: () => setProcessing(false),
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Catat Sample QC" />

            <div className="mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Catat Sample QC</h1>
                <p className="mt-1 text-sm text-gray-500">Buat sampel uji mutu dari sesi produksi</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sesi Produksi *</label>
                    <select
                        value={data.production_session_id}
                        onChange={(e) => setData({ ...data, production_session_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    >
                        <option value="">Pilih Sesi</option>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.kode_sesi} — {s.produk?.nama} ({s.status})
                            </option>
                        ))}
                    </select>
                    {errors.production_session_id && <p className="text-red-600 text-sm mt-1">{errors.production_session_id}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Uji *</label>
                    <select
                        value={data.jenis_uji}
                        onChange={(e) => setData({ ...data, jenis_uji: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                    >
                        <option value="slump_test">Slump Test</option>
                        <option value="uji_tekan">Uji Tekan</option>
                    </select>
                    {errors.jenis_uji && <p className="text-red-600 text-sm mt-1">{errors.jenis_uji}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Slump</label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.nilai_slump}
                            onChange={(e) => setData({ ...data, nilai_slump: e.target.value })}
                            placeholder="cm"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.nilai_slump && <p className="text-red-600 text-sm mt-1">{errors.nilai_slump}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Uji Tekan Rencana</label>
                        <input
                            type="date"
                            value={data.tanggal_uji_tekan_rencana}
                            onChange={(e) => setData({ ...data, tanggal_uji_tekan_rencana: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.tanggal_uji_tekan_rencana && <p className="text-red-600 text-sm mt-1">{errors.tanggal_uji_tekan_rencana}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                    <textarea
                        value={data.catatan}
                        onChange={(e) => setData({ ...data, catatan: e.target.value })}
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
                        {processing ? "Menyimpan..." : "Simpan Sample"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}