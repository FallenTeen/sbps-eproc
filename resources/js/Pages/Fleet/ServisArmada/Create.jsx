import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, Save, Truck } from "lucide-react";

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

            <div className="mx-auto max-w-4xl">
                {/* Header Halaman */}
                <div className="mb-6 flex items-start gap-3">
                    <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                Ajukan Servis Armada
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Bagian 1 — Ajuan (PIC/operator/driver)
                            </p>
                        </div>
                    </div>

                    {/* Form Card */}
                    <form onSubmit={submit} className="space-y-6">
                        {/* Kategori 1: Informasi Unit */}
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-5">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                        <Truck className="h-5 w-5 text-blue-600" />
                                    </span>
                                    Informasi Servis Armada
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Pilih armada dan jelaskan kebutuhan servis atau kerusakannya.
                                </p>
                            </div>
                            <div className="space-y-5">
                                {/* Field: Armada */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Armada{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.armada_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                armada_id: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    >
                                        <option value="">Pilih Armada</option>
                                        {armadas.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.plat_nomor ?? "-"} /{" "}
                                                {a.kode_unit ?? "-"} /{" "}
                                                {a.jenis ?? "-"}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.armada_id && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.armada_id}
                                        </p>
                                    )}
                                </div>

                                {/* Field: Tanggal Ajuan */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Tanggal Ajuan
                                    </label>
                                    <input
                                        type="date"
                                        value={form.tanggal_ajuan}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                tanggal_ajuan: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    />
                                    {errors.tanggal_ajuan && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.tanggal_ajuan}
                                        </p>
                                    )}
                                </div>

                                {/* Field: Catatan / Kerusakan */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Catatan / Kerusakan
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Jelaskan kondisi / kerusakan armada…"
                                        value={form.catatan_ajuan}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                catatan_ajuan: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    />
                                    {errors.catatan_ajuan && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.catatan_ajuan}
                                        </p>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                                    <Link
                                        href={route(
                                            "fleet.servis-armada.index",
                                        )}
                                        className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Batal
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        {processing ? "Menyimpan…" : "Simpan"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </form>
            </div>
        </AuthenticatedLayout>
    );
}
