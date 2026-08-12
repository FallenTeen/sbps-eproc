import React, { useState } from "react";
import { Link, useForm, router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Play,
    Square,
    UserPlus,
    Fuel,
    Wrench,
    ClipboardCheck,
    Clock,
    Truck,
    User,
} from "lucide-react";

const JENIS = {
    dump_truck: "Dump Truck",
    alat_berat: "Alat Berat",
    truck_molen: "Truck Molen",
    lainnya: "Lainnya",
};

const MODEL_TARIF = {
    ritase: "Ritase",
    sewa_jam: "Sewa / Jam",
    internal: "Internal",
};

const STATUS = {
    aktif: "bg-green-200 text-green-800",
    servis: "bg-yellow-200 text-yellow-800",
    nonaktif: "bg-red-200 text-red-800",
};

const BIAYA_JENIS = {
    bbm: "BBM",
    upah_kenek: "Upah Kenek",
    uang_makan: "Uang Makan",
    insentif: "Insentif",
    standby: "Standby",
    lainnya: "Lainnya",
};

function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(!!flash?.success);
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

const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500";
const btnPrimary =
    "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50";

function Tabs({ tabs, active, onChange }) {
    return (
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <nav className="flex gap-1 min-w-max">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => onChange(t.key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 ${
                            active === t.key
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}

function RitaseSection({ armada, options }) {
    const { data, setData, post, processing, errors } = useForm({
        driver_karyawan_id: "",
        tanggal: new Date().toISOString().split("T")[0],
        rute_tarif_id: "",
        kategori: "",
        material: "",
        jumlah_rit: "",
        tarif_per_rit_snapshot: "",
        proyek_id: "",
        titik_id: "",
        customer: "",
        catatan: "",
        biaya_lain: [],
    });

    const onRuteChange = (e) => {
        const id = e.target.value;
        const rute = options.ruteTarifs.find((r) => r.id === id);
        setData({
            ...data,
            rute_tarif_id: id,
            tarif_per_rit_snapshot: rute ? rute.tarif_per_rit : "",
        });
    };

    const addBiaya = () => {
        setData("biaya_lain", [
            ...data.biaya_lain,
            { jenis: "bbm", jumlah: "", catatan: "" },
        ]);
    };

    const updateBiaya = (index, field, value) => {
        const list = [...data.biaya_lain];
        list[index][field] = value;
        setData("biaya_lain", list);
    };

    const removeBiaya = (index) => {
        setData(
            "biaya_lain",
            data.biaya_lain.filter((_, i) => i !== index),
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-ritase", armada.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" /> Catat Ritase
                </h3>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Driver *" error={errors.driver_karyawan_id}>
                        <select
                            value={data.driver_karyawan_id}
                            onChange={(e) =>
                                setData(
                                    "driver_karyawan_id",
                                    e.target.value,
                                )
                            }
                            className={inputClass}
                        >
                            <option value="">Pilih Driver</option>
                            {options.drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nama}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Tanggal *" error={errors.tanggal}>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) =>
                                setData("tanggal", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Rute Tarif" error={errors.rute_tarif_id}>
                        <select
                            value={data.rute_tarif_id}
                            onChange={onRuteChange}
                            className={inputClass}
                        >
                            <option value="">Pilih Rute</option>
                            {options.ruteTarifs.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.lokasi_asal} → {r.lokasi_tujuan}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field
                        label="Tarif / Rit (manual jika tanpa rute)"
                        error={errors.tarif_per_rit_snapshot}
                    >
                        <input
                            type="number"
                            step="0.01"
                            value={data.tarif_per_rit_snapshot}
                            onChange={(e) =>
                                setData(
                                    "tarif_per_rit_snapshot",
                                    e.target.value,
                                )
                            }
                            className={inputClass}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Jumlah Rit *" error={errors.jumlah_rit}>
                            <input
                                type="number"
                                min="1"
                                value={data.jumlah_rit}
                                onChange={(e) =>
                                    setData("jumlah_rit", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Kategori">
                            <input
                                type="text"
                                value={data.kategori}
                                onChange={(e) =>
                                    setData("kategori", e.target.value)
                                }
                                placeholder="batu pecah, pasir"
                                className={inputClass}
                            />
                        </Field>
                    </div>
                    <Field label="Material">
                        <input
                            type="text"
                            value={data.material}
                            onChange={(e) =>
                                setData("material", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Proyek">
                        <select
                            value={data.proyek_id}
                            onChange={(e) =>
                                setData("proyek_id", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Pilih Proyek</option>
                            {options.proyeks.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Titik">
                        <select
                            value={data.titik_id}
                            onChange={(e) =>
                                setData("titik_id", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Pilih Titik</option>
                            {options.titiks.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nama}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Customer">
                        <input
                            type="text"
                            value={data.customer}
                            onChange={(e) =>
                                setData("customer", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>

                    {/* Biaya lain */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                                Biaya Lain
                            </label>
                            <button
                                type="button"
                                onClick={addBiaya}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Tambah
                            </button>
                        </div>
                        {data.biaya_lain.map((b, i) => (
                            <div
                                key={i}
                                className="flex gap-2 items-end mb-2"
                            >
                                <select
                                    value={b.jenis}
                                    onChange={(e) =>
                                        updateBiaya(
                                            i,
                                            "jenis",
                                            e.target.value,
                                        )
                                    }
                                    className="w-1/3 border border-gray-300 rounded-md px-2 py-2 text-sm"
                                >
                                    {Object.entries(BIAYA_JENIS).map(
                                        ([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ),
                                    )}
                                </select>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={b.jumlah}
                                    onChange={(e) =>
                                        updateBiaya(i, "jumlah", e.target.value)
                                    }
                                    placeholder="Jumlah"
                                    className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeBiaya(i)}
                                    className="text-red-600 hover:text-red-800 pb-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <Field label="Catatan">
                        <textarea
                            rows="2"
                            value={data.catatan}
                            onChange={(e) =>
                                setData("catatan", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>

                    <button
                        type="submit"
                        disabled={processing}
                        className={btnPrimary + " w-full"}
                    >
                        {processing ? "Menyimpan..." : "Simpan Ritase"}
                    </button>
                </form>
            </div>

            {/* Riwayat ritase */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-x-auto">
                <h3 className="font-semibold mb-4">Riwayat Ritase</h3>
                {armada.ritases.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Belum ada ritase tercatat
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tanggal
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Driver
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Rute
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Rit
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Tarif
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Total
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {armada.ritases.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-4 py-2 text-sm">
                                        {new Date(
                                            r.tanggal,
                                        ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {r.driver?.nama || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {r.rute_tarif
                                            ? `${r.rute_tarif.lokasi_asal} → ${r.rute_tarif.lokasi_tujuan}`
                                            : "-"}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                        {r.jumlah_rit}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                        Rp{" "}
                                        {Number(
                                            r.tarif_per_rit_snapshot,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right font-medium">
                                        Rp{" "}
                                        {Number(
                                            r.total_upah_rit,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {r.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function SewaSection({ armada, options }) {
    const { data, setData, post, processing, errors } = useForm({
        proyek_id: "",
        penyewa_eksternal: "",
        lokasi_pekerjaan: "",
        harga_per_jam_snapshot: "",
        tanggal: new Date().toISOString().split("T")[0],
        hm_awal: "",
        hm_akhir: "",
        jumlah_jam: "",
        catatan: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-sewa", armada.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" /> Catat Sewa Alat
                </h3>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Proyek">
                        <select
                            value={data.proyek_id}
                            onChange={(e) =>
                                setData("proyek_id", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Pilih Proyek</option>
                            {options.proyeks.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Penyewa Eksternal">
                        <input
                            type="text"
                            value={data.penyewa_eksternal}
                            onChange={(e) =>
                                setData("penyewa_eksternal", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Lokasi Pekerjaan">
                        <input
                            type="text"
                            value={data.lokasi_pekerjaan}
                            onChange={(e) =>
                                setData("lokasi_pekerjaan", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field
                        label="Harga / Jam *"
                        error={errors.harga_per_jam_snapshot}
                    >
                        <input
                            type="number"
                            step="0.01"
                            value={data.harga_per_jam_snapshot}
                            onChange={(e) =>
                                setData(
                                    "harga_per_jam_snapshot",
                                    e.target.value,
                                )
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Tanggal *" error={errors.tanggal}>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) =>
                                setData("tanggal", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="HM Awal">
                            <input
                                type="number"
                                step="0.01"
                                value={data.hm_awal}
                                onChange={(e) =>
                                    setData("hm_awal", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field label="HM Akhir">
                            <input
                                type="number"
                                step="0.01"
                                value={data.hm_akhir}
                                onChange={(e) =>
                                    setData("hm_akhir", e.target.value)
                                }
                                className={inputClass}
                            />
                        </Field>
                    </div>
                    <Field label="Jumlah Jam *" error={errors.jumlah_jam}>
                        <input
                            type="number"
                            step="0.01"
                            min="0.1"
                            value={data.jumlah_jam}
                            onChange={(e) =>
                                setData("jumlah_jam", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Catatan">
                        <textarea
                            rows="2"
                            value={data.catatan}
                            onChange={(e) =>
                                setData("catatan", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <button
                        type="submit"
                        disabled={processing}
                        className={btnPrimary + " w-full"}
                    >
                        {processing ? "Menyimpan..." : "Simpan Sewa"}
                    </button>
                </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-x-auto">
                <h3 className="font-semibold mb-4">Riwayat Sewa Alat</h3>
                {armada.sewa_alat_jams.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Belum ada sewa alat tercatat
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tanggal
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Proyek / Penyewa
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Jam
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Harga/Jam
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Total
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {armada.sewa_alat_jams.map((s) => (
                                <tr key={s.id}>
                                    <td className="px-4 py-2 text-sm">
                                        {new Date(
                                            s.tanggal,
                                        ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {s.proyek?.nama || s.penyewa_eksternal}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                        {s.jumlah_jam}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                        Rp{" "}
                                        {Number(
                                            s.harga_per_jam_snapshot,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right font-medium">
                                        Rp{" "}
                                        {Number(
                                            s.harga_per_jam_snapshot *
                                                s.jumlah_jam,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {s.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function ServiceSection({ armada, options }) {
    const { data, setData, post, processing, errors } = useForm({
        tanggal: new Date().toISOString().split("T")[0],
        jenis_servis: "",
        biaya: "",
        notes: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-service", armada.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-600" /> Catat Servis
                </h3>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Tanggal *" error={errors.tanggal}>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) =>
                                setData("tanggal", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Jenis Servis">
                        <input
                            type="text"
                            value={data.jenis_servis}
                            onChange={(e) =>
                                setData("jenis_servis", e.target.value)
                            }
                            placeholder="ganti oli, tune up"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Biaya *" error={errors.biaya}>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.biaya}
                            onChange={(e) =>
                                setData("biaya", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Notes">
                        <textarea
                            rows="2"
                            value={data.notes}
                            onChange={(e) =>
                                setData("notes", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <button
                        type="submit"
                        disabled={processing}
                        className={btnPrimary + " w-full"}
                    >
                        {processing ? "Menyimpan..." : "Simpan Servis"}
                    </button>
                </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-x-auto">
                <h3 className="font-semibold mb-4">Riwayat Servis</h3>
                {armada.service_histories.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Belum ada riwayat servis
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tanggal
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Jenis
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Biaya
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Notes
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {armada.service_histories.map((s) => (
                                <tr key={s.id}>
                                    <td className="px-4 py-2 text-sm">
                                        {new Date(
                                            s.tanggal,
                                        ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {s.jenis_servis || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                        Rp{" "}
                                        {Number(s.biaya).toLocaleString(
                                            "id-ID",
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {s.notes || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function BbmSection({ armada, options }) {
    const { data, setData, post, processing, errors } = useForm({
        tanggal: new Date().toISOString().split("T")[0],
        liter: "",
        biaya: "",
        jam_operasional_saat_isi: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-bbm", armada.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-blue-600" /> Catat BBM
                </h3>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Tanggal *" error={errors.tanggal}>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) =>
                                setData("tanggal", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Liter *" error={errors.liter}>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.liter}
                            onChange={(e) =>
                                setData("liter", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Biaya">
                        <input
                            type="number"
                            step="0.01"
                            value={data.biaya}
                            onChange={(e) =>
                                setData("biaya", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Jam Operasional Saat Isi">
                        <input
                            type="number"
                            step="0.01"
                            value={data.jam_operasional_saat_isi}
                            onChange={(e) =>
                                setData(
                                    "jam_operasional_saat_isi",
                                    e.target.value,
                                )
                            }
                            className={inputClass}
                        />
                    </Field>
                    <button
                        type="submit"
                        disabled={processing}
                        className={btnPrimary + " w-full"}
                    >
                        {processing ? "Menyimpan..." : "Simpan BBM"}
                    </button>
                </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-x-auto">
                <h3 className="font-semibold mb-4">Riwayat BBM</h3>
                {armada.bbm_logs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Belum ada pengisian BBM
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tanggal
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Liter
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Biaya
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Jam Operasional
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {armada.bbm_logs.map((b) => (
                                <tr key={b.id}>
                                    <td className="px-4 py-2 text-sm">
                                        {new Date(
                                            b.tanggal,
                                        ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                        {Number(b.liter).toLocaleString(
                                            "id-ID",
                                        )}{" "}
                                        L
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                        Rp{" "}
                                        {Number(b.biaya).toLocaleString(
                                            "id-ID",
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                        {b.jam_operasional_saat_isi || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function ChecklistSection({ armada, options }) {
    const { data, setData, post, processing, errors } = useForm({
        tanggal: new Date().toISOString().split("T")[0],
        kondisi_baik: true,
        item_bermasalah: "",
        dicatat_oleh_karyawan_id: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-checklist", armada.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-blue-600" />{" "}
                    Checklist Harian
                </h3>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Tanggal *" error={errors.tanggal}>
                        <input
                            type="date"
                            value={data.tanggal}
                            onChange={(e) =>
                                setData("tanggal", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Kondisi Baik *">
                        <select
                            value={data.kondisi_baik ? "1" : "0"}
                            onChange={(e) =>
                                setData(
                                    "kondisi_baik",
                                    e.target.value === "1",
                                )
                            }
                            className={inputClass}
                        >
                            <option value="1">Baik</option>
                            <option value="0">Ada Masalah</option>
                        </select>
                    </Field>
                    <Field label="Item Bermasalah">
                        <textarea
                            rows="2"
                            value={data.item_bermasalah}
                            onChange={(e) =>
                                setData("item_bermasalah", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field
                        label="Dicatat Oleh *"
                        error={errors.dicatat_oleh_karyawan_id}
                    >
                        <select
                            value={data.dicatat_oleh_karyawan_id}
                            onChange={(e) =>
                                setData(
                                    "dicatat_oleh_karyawan_id",
                                    e.target.value,
                                )
                            }
                            className={inputClass}
                        >
                            <option value="">Pilih Petugas</option>
                            {options.drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nama}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <button
                        type="submit"
                        disabled={processing}
                        className={btnPrimary + " w-full"}
                    >
                        {processing ? "Menyimpan..." : "Simpan Checklist"}
                    </button>
                </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-x-auto">
                <h3 className="font-semibold mb-4">Riwayat Checklist</h3>
                {armada.checklists.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Belum ada checklist
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tanggal
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Kondisi
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Item Bermasalah
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Dicatat Oleh
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {armada.checklists.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-4 py-2 text-sm">
                                        {new Date(
                                            c.tanggal,
                                        ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${c.kondisi_baik ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
                                        >
                                            {c.kondisi_baik
                                                ? "Baik"
                                                : "Masalah"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {c.item_bermasalah || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {c.dicatat_oleh?.nama || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function DowntimeSection({ armada }) {
    const { data, setData, post, processing, errors } = useForm({
        penyebab: "",
        kategori: "kerusakan",
        catatan: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.start-downtime", armada.id), {
            preserveScroll: true,
        });
    };

    const endDowntime = (id) => {
        if (window.confirm("Yakin selesaikan downtime ini?")) {
            router.post(
                route("fleet.armada.end-downtime", [armada.id, id]),
                {},
                { preserveScroll: true },
            );
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Play className="w-4 h-4 text-blue-600" /> Mulai Downtime
                </h3>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Penyebab">
                        <input
                            type="text"
                            value={data.penyebab}
                            onChange={(e) =>
                                setData("penyebab", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Kategori *" error={errors.kategori}>
                        <select
                            value={data.kategori}
                            onChange={(e) =>
                                setData("kategori", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="kerusakan">Kerusakan</option>
                            <option value="menunggu_sparepart">
                                Menunggu Sparepart
                            </option>
                            <option value="lainnya">Lainnya</option>
                        </select>
                    </Field>
                    <Field label="Catatan">
                        <textarea
                            rows="2"
                            value={data.catatan}
                            onChange={(e) =>
                                setData("catatan", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <button
                        type="submit"
                        disabled={processing}
                        className={btnPrimary + " w-full"}
                    >
                        {processing ? "Menyimpan..." : "Mulai Downtime"}
                    </button>
                </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-x-auto">
                <h3 className="font-semibold mb-4">Riwayat Downtime</h3>
                {armada.downtimes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Tidak ada downtime
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Mulai
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Selesai
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Kategori
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Penyebab
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {armada.downtimes.map((d) => (
                                <tr key={d.id}>
                                    <td className="px-4 py-2 text-sm">
                                        {new Date(
                                            d.mulai,
                                        ).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {d.selesai
                                            ? new Date(
                                                  d.selesai,
                                              ).toLocaleString("id-ID")
                                            : "Berjalan"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {d.kategori.replace(/_/g, " ")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {d.penyebab || d.catatan || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm">
                                        {!d.selesai && (
                                            <button
                                                onClick={() =>
                                                    endDowntime(d.id)
                                                }
                                                className="text-green-600 hover:text-green-800 inline-flex items-center gap-1"
                                            >
                                                <Square className="w-3 h-3" />
                                                Selesaikan
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function DriverSection({ armada, options }) {
    const { data, setData, post, processing, errors } = useForm({
        karyawan_id: "",
        tipe: "standby",
        tanggal_mulai: new Date().toISOString().split("T")[0],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.assign-driver", armada.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-600" /> Tugaskan
                    Driver
                </h3>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Driver *" error={errors.karyawan_id}>
                        <select
                            value={data.karyawan_id}
                            onChange={(e) =>
                                setData("karyawan_id", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Pilih Driver</option>
                            {options.drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nama}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Tipe *" error={errors.tipe}>
                        <select
                            value={data.tipe}
                            onChange={(e) =>
                                setData("tipe", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="standby">Standby</option>
                            <option value="kondisional">Kondisional</option>
                        </select>
                    </Field>
                    <Field
                        label="Tanggal Mulai *"
                        error={errors.tanggal_mulai}
                    >
                        <input
                            type="date"
                            value={data.tanggal_mulai}
                            onChange={(e) =>
                                setData("tanggal_mulai", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <button
                        type="submit"
                        disabled={processing}
                        className={btnPrimary + " w-full"}
                    >
                        {processing ? "Menyimpan..." : "Tugaskan Driver"}
                    </button>
                </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-x-auto">
                <h3 className="font-semibold mb-4">
                    Riwayat Penugasan Driver
                </h3>
                {armada.driver_assignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Belum ada penugasan driver
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Driver
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tipe
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Mulai
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Selesai
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {armada.driver_assignments.map((da) => (
                                <tr key={da.id}>
                                    <td className="px-4 py-2 text-sm">
                                        {da.karyawan?.nama || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {da.tipe}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {new Date(
                                            da.tanggal_mulai,
                                        ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {da.tanggal_selesai
                                            ? new Date(
                                                  da.tanggal_selesai,
                                              ).toLocaleDateString("id-ID")
                                            : "-"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${da.status === "aktif" ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-800"}`}
                                        >
                                            {da.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default function Show({ armada, options }) {
    const [tab, setTab] = useState("ritase");

    const tabs = [
        { key: "ritase", label: "Ritase", icon: <Truck className="w-4 h-4" /> },
        { key: "sewa", label: "Sewa Alat", icon: <Clock className="w-4 h-4" /> },
        { key: "service", label: "Servis", icon: <Wrench className="w-4 h-4" /> },
        { key: "bbm", label: "BBM", icon: <Fuel className="w-4 h-4" /> },
        { key: "checklist", label: "Checklist", icon: <ClipboardCheck className="w-4 h-4" /> },
        { key: "downtime", label: "Downtime", icon: <Play className="w-4 h-4" /> },
        { key: "driver", label: "Driver", icon: <UserPlus className="w-4 h-4" /> },
    ];

    return (
        <Layout>
            <div className="mb-6 flex items-center gap-4 flex-wrap">
                <Link
                    href={route("fleet.armada.index")}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">
                    Armada: {armada.kode_unit}
                </h1>
                <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS[armada.status] || "bg-gray-200 text-gray-800"}`}
                >
                    {armada.status}
                </span>
                <Link
                    href={route("fleet.armada.edit", armada.id)}
                    className="ml-auto px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                >
                    Edit
                </Link>
            </div>

            <FlashMessage />

            {/* Info panel */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <strong className="block text-sm text-gray-500">
                            Plat Nomor
                        </strong>
                        <span className="text-lg font-semibold">
                            {armada.plat_nomor}
                        </span>
                    </div>
                    <div>
                        <strong className="block text-sm text-gray-500">
                            Jenis
                        </strong>
                        <span>{JENIS[armada.jenis] || armada.jenis}</span>
                    </div>
                    <div>
                        <strong className="block text-sm text-gray-500">
                            Model Tarif
                        </strong>
                        <span>
                            {MODEL_TARIF[armada.model_tarif] ||
                                armada.model_tarif}
                        </span>
                    </div>
                    <div>
                        <strong className="block text-sm text-gray-500">
                            Unit Bisnis
                        </strong>
                        <span>{armada.unit_bisnis?.nama || "-"}</span>
                    </div>
                    <div>
                        <strong className="block text-sm text-gray-500">
                            Titik / Basecamp
                        </strong>
                        <span>{armada.titik?.nama || "-"}</span>
                    </div>
                    <div>
                        <strong className="block text-sm text-gray-500">
                            Tahun
                        </strong>
                        <span>{armada.tahun || "-"}</span>
                    </div>
                    <div>
                        <strong className="block text-sm text-gray-500">
                            Kapasitas
                        </strong>
                        <span>{armada.kapasitas || "-"}</span>
                    </div>
                    <div>
                        <strong className="block text-sm text-gray-500">
                            Driver Saat Ini
                        </strong>
                        <span>
                            {armada.current_driver?.karyawan?.nama || "-"}
                        </span>
                    </div>
                </div>
            </div>

            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === "ritase" && (
                <RitaseSection armada={armada} options={options} />
            )}
            {tab === "sewa" && <SewaSection armada={armada} options={options} />}
            {tab === "service" && (
                <ServiceSection armada={armada} options={options} />
            )}
            {tab === "bbm" && <BbmSection armada={armada} options={options} />}
            {tab === "checklist" && (
                <ChecklistSection armada={armada} options={options} />
            )}
            {tab === "downtime" && <DowntimeSection armada={armada} />}
            {tab === "driver" && (
                <DriverSection armada={armada} options={options} />
            )}
        </Layout>
    );
}
