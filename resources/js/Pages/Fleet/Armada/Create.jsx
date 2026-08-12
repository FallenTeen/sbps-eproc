import React from "react";
import { useForm, Link } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft } from "lucide-react";

export default function Create({ unitBisnis, titiks, drivers }) {
    const { data, setData, post, errors, processing } = useForm({
        unit_bisnis_id: "",
        plat_nomor: "",
        kode_unit: "",
        jenis: "dump_truck",
        model_tarif: "ritase",
        tahun: "",
        kapasitas: "",
        titik_id: "",
        tanggal_mulai_pakai: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.store"));
    };

    return (
        <Layout>
            <div className="mb-6 flex items-center gap-4">
                <Link
                    href={route("fleet.armada.index")}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Tambah Armada</h1>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow p-6 max-w-3xl"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Bisnis *
                        </label>
                        <select
                            value={data.unit_bisnis_id}
                            onChange={(e) =>
                                setData("unit_bisnis_id", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Unit Bisnis</option>
                            {unitBisnis.map((ub) => (
                                <option key={ub.id} value={ub.id}>
                                    {ub.nama}
                                </option>
                            ))}
                        </select>
                        {errors.unit_bisnis_id && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.unit_bisnis_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plat Nomor *
                        </label>
                        <input
                            type="text"
                            value={data.plat_nomor}
                            onChange={(e) =>
                                setData("plat_nomor", e.target.value)
                            }
                            placeholder="B 1234 XYZ"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.plat_nomor && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.plat_nomor}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kode Unit *
                        </label>
                        <input
                            type="text"
                            value={data.kode_unit}
                            onChange={(e) =>
                                setData("kode_unit", e.target.value)
                            }
                            placeholder="GCS-DT-01"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.kode_unit && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.kode_unit}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis *
                        </label>
                        <select
                            value={data.jenis}
                            onChange={(e) => setData("jenis", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="dump_truck">Dump Truck</option>
                            <option value="alat_berat">Alat Berat</option>
                            <option value="truck_molen">Truck Molen</option>
                            <option value="lainnya">Lainnya</option>
                        </select>
                        {errors.jenis && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.jenis}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model Tarif *
                        </label>
                        <select
                            value={data.model_tarif}
                            onChange={(e) =>
                                setData("model_tarif", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="ritase">Ritase</option>
                            <option value="sewa_jam">Sewa / Jam</option>
                            <option value="internal">Internal</option>
                        </select>
                        {errors.model_tarif && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.model_tarif}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tahun
                        </label>
                        <input
                            type="number"
                            value={data.tahun}
                            onChange={(e) => setData("tahun", e.target.value)}
                            placeholder="2020"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.tahun && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.tahun}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kapasitas
                        </label>
                        <input
                            type="text"
                            value={data.kapasitas}
                            onChange={(e) =>
                                setData("kapasitas", e.target.value)
                            }
                            placeholder="8 m3 / 5 ton"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.kapasitas && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.kapasitas}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Titik (Basecamp)
                        </label>
                        <select
                            value={data.titik_id}
                            onChange={(e) =>
                                setData("titik_id", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih Titik</option>
                            {titiks.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nama}
                                </option>
                            ))}
                        </select>
                        {errors.titik_id && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.titik_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Mulai Pakai
                        </label>
                        <input
                            type="date"
                            value={data.tanggal_mulai_pakai}
                            onChange={(e) =>
                                setData(
                                    "tanggal_mulai_pakai",
                                    e.target.value,
                                )
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.tanggal_mulai_pakai && (
                            <p className="text-red-600 text-sm mt-1">
                                {errors.tanggal_mulai_pakai}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Link
                        href={route("fleet.armada.index")}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                    >
                        {processing ? "Menyimpan..." : "Simpan Armada"}
                    </button>
                </div>
            </form>
        </Layout>
    );
}
