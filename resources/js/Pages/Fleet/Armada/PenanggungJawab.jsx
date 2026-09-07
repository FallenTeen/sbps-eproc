import React from "react";
import { Link, useForm, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, UserPlus, Shield, ShieldAlert, BadgeCheck } from "lucide-react";

const PERAN_LABEL = {
    utama: "Utama",
    cadangan: "Cadangan",
};

const btnPrimary =
    "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50";
const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500";

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            {children}
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
    );
}

function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = React.useState(!!flash?.success);
    if (!visible || !flash?.success) return null;
    return (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md flex justify-between items-center">
            <span>{flash.success}</span>
            <button onClick={() => setVisible(false)} className="text-green-600">
                &times;
            </button>
        </div>
    );
}

export default function PenanggungJawab({
    armada,
    penanggungJawabs,
    active_penanggung_jawab,
    options,
}) {
    const assign = useForm({
        karyawan_id: "",
        peran: "utama",
        mulai_dari: new Date().toISOString().split("T")[0],
        alasan: "",
    });

    const cadangan = useForm({
        karyawan_id: "",
        tanggal: new Date().toISOString().split("T")[0],
        alasan: "",
    });

    const submitAssign = (e) => {
        e.preventDefault();
        assign.post(route("fleet.armada.penanggung-jawab.store", armada.id), {
            preserveScroll: true,
        });
    };

    const submitCadangan = (e) => {
        e.preventDefault();
        cadangan.post(
            route("fleet.armada.penanggung-jawab.cadangan", armada.id),
            { preserveScroll: true },
        );
    };

    return (
        <Layout>
            <div className="mb-6">
                <Link
                    href={route("fleet.armada.show", armada.id)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Detail Armada
                </Link>
                <h1 className="text-2xl font-bold">Penanggung Jawab Armada</h1>
                <p className="text-gray-600">
                    {armada.kode_unit} — {armada.plat_nomor}
                </p>
            </div>

            {<FlashMessage />}

            {/* PIC Aktif */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-green-600" /> PIC Aktif
                </h3>
                {active_penanggung_jawab ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            {active_penanggung_jawab.karyawan?.nama?.charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium">
                                {active_penanggung_jawab.karyawan?.nama}
                                {" "}
                                <span
                                    className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                        active_penanggung_jawab.peran === "utama"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-yellow-100 text-yellow-800"
                                    }`}
                                >
                                    {PERAN_LABEL[active_penanggung_jawab.peran]}
                                </span>
                            </p>
                            <p className="text-sm text-gray-600">
                                {active_penanggung_jawab.karyawan?.jabatan ||
                                    "-"}
                                {" · mulai "}
                                {new Date(
                                    active_penanggung_jawab.mulai_dari,
                                ).toLocaleDateString("id-ID")}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">
                        Belum ada penanggung jawab ditugaskan.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Assign PIC */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-blue-600" /> Tugaskan
                        Penanggung Jawab
                    </h3>
                    <form onSubmit={submitAssign} className="space-y-4">
                        <Field
                            label="Karyawan *"
                            error={assign.errors.karyawan_id}
                        >
                            <select
                                value={assign.data.karyawan_id}
                                onChange={(e) =>
                                    assign.setData("karyawan_id", e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="">Pilih Karyawan</option>
                                {options.karyawans.map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.nama} ({k.jabatan || "-"})
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Peran *" error={assign.errors.peran}>
                            <select
                                value={assign.data.peran}
                                onChange={(e) =>
                                    assign.setData("peran", e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="utama">Utama</option>
                                <option value="cadangan">Cadangan</option>
                            </select>
                        </Field>
                        <Field
                            label="Mulai Dari *"
                            error={assign.errors.mulai_dari}
                        >
                            <input
                                type="date"
                                value={assign.data.mulai_dari}
                                onChange={(e) =>
                                    assign.setData("mulai_dari", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Alasan" error={assign.errors.alasan}>
                            <input
                                type="text"
                                value={assign.data.alasan}
                                onChange={(e) =>
                                    assign.setData("alasan", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <button
                            type="submit"
                            disabled={assign.processing}
                            className={btnPrimary + " w-full"}
                        >
                            {assign.processing
                                ? "Menyimpan..."
                                : "Tugaskan PIC"}
                        </button>
                    </form>
                </div>

                {/* Aktifkan cadangan */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-yellow-600" />{" "}
                        Aktifkan Cadangan sebagai PIC
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Menonaktifkan PIC utama dan memindahkan penugasan ke
                        PIC cadangan (misal saat utama berhalangan).
                    </p>
                    <form onSubmit={submitCadangan} className="space-y-4">
                        <Field
                            label="Karyawan Cadangan (kosongkan jika sudah ada)"
                            error={cadangan.errors.karyawan_id}
                        >
                            <select
                                value={cadangan.data.karyawan_id}
                                onChange={(e) =>
                                    cadangan.setData(
                                        "karyawan_id",
                                        e.target.value,
                                    )
                                }
                                className={inputClass}
                            >
                                <option value="">— Pakai cadangan aktif —</option>
                                {options.karyawans.map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.nama}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            label="Tanggal Efektif *"
                            error={cadangan.errors.tanggal}
                        >
                            <input
                                type="date"
                                value={cadangan.data.tanggal}
                                onChange={(e) =>
                                    cadangan.setData("tanggal", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Alasan" error={cadangan.errors.alasan}>
                            <input
                                type="text"
                                value={cadangan.data.alasan}
                                onChange={(e) =>
                                    cadangan.setData("alasan", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <button
                            type="submit"
                            disabled={cadangan.processing}
                            className={btnPrimary + " w-full"}
                        >
                            {cadangan.processing
                                ? "Menyimpan..."
                                : "Aktifkan Cadangan"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Riwayat */}
            <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-600" /> Riwayat
                    Penanggung Jawab
                </h3>
                {penanggungJawabs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Belum ada penanggung jawab tercatat
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Karyawan
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Peran
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Mulai
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Sampai
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Alasan
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {penanggungJawabs.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-4 py-2 text-sm font-medium">
                                        {p.karyawan?.nama || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                p.peran === "utama"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {PERAN_LABEL[p.peran]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {new Date(
                                            p.mulai_dari,
                                        ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {p.sampai
                                            ? new Date(
                                                  p.sampai,
                                              ).toLocaleDateString("id-ID")
                                            : "Aktif"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {p.alasan || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    );
}