import React from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, FolderKanban, Save } from "lucide-react";
import { formatTanggal } from "@/utils/date";

export default function Edit({ bahanBaku, suppliers }) {
    const { data, setData, put, errors, processing } = useForm({
        nama: bahanBaku.nama,
        kategori: bahanBaku.kategori,
        sparepart_untuk: bahanBaku.sparepart_untuk || "",
        satuan: bahanBaku.satuan,
        aktif: bahanBaku.aktif,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("procurement.bahan-baku.update", bahanBaku.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Bahan Baku" />
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header Halaman */}
                {/* Header Halaman */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Edit Bahan Baku
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {bahanBaku.kode} - {bahanBaku.nama}
                        </p>
                    </div>
                </div>
                {/* Form Edit Bahan Baku */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <FolderKanban className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    Informasi Bahan Baku
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Identitas dan klasifikasi bahan baku atau
                                    sparepart
                                </p>
                            </div>
                        </div>
                        {/* Informasi Utama */}
                        <div className="p-6 space-y-6">
                            {/* Grid Informasi Utama */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nama */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama *
                                    </label>

                                    <input
                                        type="text"
                                        value={data.nama}
                                        onChange={(e) =>
                                            setData("nama", e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                                    />

                                    {errors.nama && (
                                        <p className="text-red-600 text-sm mt-1">
                                            {errors.nama}
                                        </p>
                                    )}
                                </div>

                                {/* Kategori */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kategori *
                                    </label>

                                    <select
                                        value={data.kategori}
                                        onChange={(e) =>
                                            setData("kategori", e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                                    >
                                        <option value="bahan_baku">
                                            Bahan Baku
                                        </option>
                                        <option value="sparepart">
                                            Sparepart
                                        </option>
                                    </select>

                                    {errors.kategori && (
                                        <p className="text-red-600 text-sm mt-1">
                                            {errors.kategori}
                                        </p>
                                    )}
                                </div>

                                {/* Satuan */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Satuan *
                                    </label>

                                    <input
                                        type="text"
                                        value={data.satuan}
                                        onChange={(e) =>
                                            setData("satuan", e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                                    />

                                    {errors.satuan && (
                                        <p className="text-red-600 text-sm mt-1">
                                            {errors.satuan}
                                        </p>
                                    )}
                                </div>

                                {/* Sparepart Untuk */}
                                {data.kategori === "sparepart" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Untuk Armada / Mesin
                                        </label>

                                        <input
                                            type="text"
                                            value={data.sparepart_untuk}
                                            onChange={(e) =>
                                                setData(
                                                    "sparepart_untuk",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                                        />
                                    </div>
                                )}

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>

                                    <select
                                        value={data.aktif ? "1" : "0"}
                                        onChange={(e) =>
                                            setData(
                                                "aktif",
                                                e.target.value === "1",
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-900 focus:border-gray-900"
                                    >
                                        <option value="1">Aktif</option>
                                        <option value="0">Nonaktif</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="pt-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 mr-5 mb-5">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
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
                    </div>
                </form>
                {/* Histori Harga Beli */}
                {suppliers.length > 0 && (
                    <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Header Histori */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Histori Harga Beli
                            </h2>
                        </div>

                        {/* Konten Histori */}
                        <div className="p-6">
                            {bahanBaku.harga_beli?.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    Belum ada data harga.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                                    Supplier
                                                </th>

                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                                                    Harga
                                                </th>

                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                                    Berlaku Dari
                                                </th>

                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                                    Berlaku Sampai
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {bahanBaku.harga_beli.map((h) => (
                                                <tr
                                                    key={h.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {h.supplier?.nama ||
                                                            "-"}
                                                    </td>

                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                                                        Rp{" "}
                                                        {Number(
                                                            h.harga,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                        {formatTanggal(
                                                            h.berlaku_dari,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                        {formatTanggal(
                                                            h.berlaku_sampai,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
