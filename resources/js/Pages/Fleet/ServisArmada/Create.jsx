import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft } from "lucide-react";

export default function Create({ armadas }) {
    const [form, setForm] = useState({
        armada_id: "",
        tanggal_ajuan: new Date().toISOString().slice(0, 10),
        catatan_ajuan: "",
    });

    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route("fleet.servis-armada.store"), form, {
            preserveScroll: true,
            onError: (err) => setErrors(err),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Ajukan Servis Armada" />

            <div className="mb-6">
                <Link
                    href={route("fleet.servis-armada.index")}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Ajukan Servis Armada</h1>
                <p className="mt-1 text-sm text-gray-500">Bagian 1 — Ajuan (PIC/operator/driver)</p>
            </div>

            <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Armada *</label>
                        <select
                            value={form.armada_id}
                            onChange={(e) => setForm({ ...form, armada_id: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="">Pilih Armada</option>
                            {armadas.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.plat_nomor} — {a.kode_unit} ({a.jenis})
                                </option>
                            ))}
                        </select>
                        {errors.armada_id && <p className="mt-1 text-sm text-red-600">{errors.armada_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Ajuan</label>
                        <input
                            type="date"
                            value={form.tanggal_ajuan}
                            onChange={(e) => setForm({ ...form, tanggal_ajuan: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.tanggal_ajuan && <p className="mt-1 text-sm text-red-600">{errors.tanggal_ajuan}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Kerusakan</label>
                        <textarea
                            value={form.catatan_ajuan}
                            onChange={(e) => setForm({ ...form, catatan_ajuan: e.target.value })}
                            rows={4}
                            placeholder="Jelaskan kondisi / kerusakan armada…"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        {errors.catatan_ajuan && <p className="mt-1 text-sm text-red-600">{errors.catatan_ajuan}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Link
                            href={route("fleet.servis-armada.index")}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                        >
                            {processing ? "Menyimpan…" : "Ajukan Servis"}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
