import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Create({ serviceable, serviceableType, purchaseOrders }) {
    const { data, setData, post, errors, processing } = useForm({
        serviceable_type: serviceableType || "",
        serviceable_id: serviceable?.id || "",
        tanggal: new Date().toISOString().split("T")[0],
        jenis_servis: "",
        biaya: "",
        notes: "",
        purchase_order_id: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("fleet.service-history.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Catat Servis" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Catat Riwayat Servis</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {serviceable?.kode_unit || serviceable?.nama || serviceableType || "Unit"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) => setData("tanggal", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.tanggal && <p className="text-red-600 text-sm mt-1">{errors.tanggal}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Servis</label>
                        <input
                            type="text"
                            value={data.jenis_servis}
                            onChange={(e) => setData("jenis_servis", e.target.value)}
                            placeholder="contoh: Ganti Oli, Servis Rutin"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Biaya</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.biaya}
                            onChange={(e) => setData("biaya", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.biaya && <p className="text-red-600 text-sm mt-1">{errors.biaya}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order</label>
                        <select
                            value={data.purchase_order_id}
                            onChange={(e) => setData("purchase_order_id", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Tidak ada</option>
                            {purchaseOrders.map((po) => (
                                <option key={po.id} value={po.id}>{po.kode_po}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            rows="3"
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
                        {processing ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}