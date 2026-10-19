import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, FolderKanban, Save } from "lucide-react";

export default function Create() {
    const { data, setData, post, errors, processing } = useForm({
        kode: "",
        nama: "",
        kontak: "",
        telepon: "",
        alamat: "",
        aktif: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("procurement.supplier.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Supplier" />
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header Halaman */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Tambah Supplier
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Tambahkan data supplier untuk kebutuhan pengadaan.
                    </p>
                </div>

                {/* Form Supplier */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FolderKanban className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Informasi Supplier
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Lengkapi identitas dan informasi kontak
                                    supplier.
                                </p>
                            </div>
                        </div>
                        {/* Informasi Supplier */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {/* Kode */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Kode Supplier{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.kode}
                                        onChange={(e) =>
                                            setData("kode", e.target.value)
                                        }
                                        placeholder="Contoh: SPL-001"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    />
                                    {errors.kode && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.kode}
                                        </p>
                                    )}
                                </div>

                                {/* Nama Supplier */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Nama Supplier{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nama}
                                        onChange={(e) =>
                                            setData("nama", e.target.value)
                                        }
                                        placeholder="Masukkan nama supplier"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    />
                                    {errors.nama && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.nama}
                                        </p>
                                    )}
                                </div>

                                {/* Kontak / PIC */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Nama PIC
                                    </label>
                                    <input
                                        type="text"
                                        value={data.kontak}
                                        onChange={(e) =>
                                            setData("kontak", e.target.value)
                                        }
                                        placeholder="Masukkan nama penanggung jawab"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    />
                                    {errors.kontak && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.kontak}
                                        </p>
                                    )}
                                </div>

                                {/* Telepon */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Nomor Telepon
                                    </label>
                                    <input
                                        type="text"
                                        value={data.telepon}
                                        onChange={(e) =>
                                            setData("telepon", e.target.value)
                                        }
                                        placeholder="Contoh: 081234567890"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    />
                                    {errors.telepon && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.telepon}
                                        </p>
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Status Supplier{" "}
                                        <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        value={data.aktif ? "1" : "0"}
                                        onChange={(e) =>
                                            setData(
                                                "aktif",
                                                e.target.value === "1",
                                            )
                                        }
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    >
                                        <option value="1">Aktif</option>
                                        <option value="0">Nonaktif</option>
                                    </select>
                                    {errors.aktif && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.aktif}
                                        </p>
                                    )}
                                </div>

                                {/* Alamat */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Alamat Supplier
                                    </label>
                                    <textarea
                                        value={data.alamat}
                                        onChange={(e) =>
                                            setData("alamat", e.target.value)
                                        }
                                        rows={3}
                                        placeholder="Masukkan alamat lengkap supplier"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-y"
                                    />
                                    {errors.alamat && (
                                        <p className="mt-1.5 text-sm text-red-600">
                                            {errors.alamat}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-200 bg-gray-50/70 px-6 py-4 rounded-b-xl">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
