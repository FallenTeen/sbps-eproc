import React, { useState } from "react";
import { Link, useForm, router, usePage } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { formatTanggal } from "@/utils/date";
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
    Users,
    Truck,
    Edit,
} from "lucide-react";

const JENIS = {
    dump_truck: "Dump Truck",
    dump_truck_tronton: "Dump Truck Tronton",
    self_loader: "Self Loader",
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
            <button
                onClick={() => setVisible(false)}
                className="text-green-600"
            >
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

function RitaseSection({ armada, options, can }) {
    const canRecord = can ? can.recordRitase : true;
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
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
            onSuccess: () => {
                reset();
                clearErrors();
            },
        });
    };

    return (
        <div
            className={
                canRecord
                    ? "grid grid-cols-1 lg:grid-cols-3 gap-6"
                    : "space-y-6"
            }
        >
            {canRecord && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-600" /> Catat Ritase
                    </h3>
                    <form onSubmit={submit} className="space-y-4">
                        <Field
                            label="Driver *"
                            error={errors.driver_karyawan_id}
                        >
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
                            <Field
                                label="Jumlah Rit *"
                                error={errors.jumlah_rit}
                            >
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
                            <Field label="Satuan Volume *">
                                <select
                                    value={data.satuan_volume}
                                    onChange={(e) =>
                                        setData("satuan_volume", e.target.value)
                                    }
                                    className={inputClass}
                                >
                                    <option value="">Pilih Volume</option>
                                    <option value="tonase">Tonase</option>
                                    <option value="ritase">Ritase</option>
                                    <option value="m3">m³</option>
                                    <option value="harian">Harian</option>
                                </select>
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
                                            updateBiaya(
                                                i,
                                                "jumlah",
                                                e.target.value,
                                            )
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
            )}

            {/* Riwayat ritase */}
            <div
                className={`${canRecord ? "lg:col-span-2" : "col-span-full"} bg-white rounded-lg shadow p-6 overflow-x-auto`}
            >
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
                                        {formatTanggal(r.tanggal)}
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

function SewaSection({ armada, options, can }) {
    const canRecord = can ? can.recordSewa : true;
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            proyek_id: "",
            tipe_sewa: "",
            penyewa_nama: "",
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
            onSuccess: () => {
                reset();
                clearErrors();
            },
        });
    };

    return (
        <div
            className={
                canRecord
                    ? "grid grid-cols-1 lg:grid-cols-3 gap-6"
                    : "space-y-6"
            }
        >
            {canRecord && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" /> Catat Sewa
                        Alat
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
                        <Field label="Tipe Sewa">
                            <select
                                value={data.tipe_sewa}
                                onChange={(e) =>
                                    setData("tipe_sewa", e.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="">Pilih Tipe Sewa</option>
                                <option value="internal">Internal</option>
                                <option value="eksternal">Eksternal</option>
                            </select>
                        </Field>
                        {data.tipe_sewa === "eksternal" && (
                            <Field
                                label="Nama Penyewa"
                                error={errors.penyewa_nama}
                            >
                                <input
                                    type="text"
                                    value={data.penyewa_nama}
                                    onChange={(e) =>
                                        setData("penyewa_nama", e.target.value)
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        )}
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
            )}

            <div
                className={`${canRecord ? "lg:col-span-2" : "col-span-full"} bg-white rounded-lg shadow p-6 overflow-x-auto`}
            >
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
                                        {formatTanggal(s.tanggal)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {s.proyek?.nama || s.penyewa_eksternal}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                        {s.jumlah_jam} Jam
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
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            tanggal: new Date().toISOString().split("T")[0],
            jenis_servis: "",
            biaya: "",
            notes: "",
        });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-service", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
            },
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
                            onChange={(e) => setData("tanggal", e.target.value)}
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
                            onChange={(e) => setData("biaya", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Notes">
                        <textarea
                            rows="2"
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
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
                                        {formatTanggal(s.tanggal)}
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
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            tanggal: new Date().toISOString().split("T")[0],
            liter: "",
            biaya: "",
            jam_operasional_saat_isi: "",
        });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.record-bbm", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
            },
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
                            onChange={(e) => setData("tanggal", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Liter *" error={errors.liter}>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.liter}
                            onChange={(e) => setData("liter", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Biaya">
                        <input
                            type="number"
                            step="0.01"
                            value={data.biaya}
                            onChange={(e) => setData("biaya", e.target.value)}
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
                                        {formatTanggal(b.tanggal)}
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

const BAGIAN_DEFAULT = [
    "Ban",
    "Rem",
    "Lampu",
    "Oli mesin",
    "Air radiator",
    "Body",
    "Kabin",
];

const KONDISI_OPTIONS = [
    { value: "baik", label: "Baik" },
    { value: "perlu_perhatian", label: "Perlu Perhatian" },
    { value: "rusak", label: "Rusak" },
];

const KONDISI_BADGE = {
    baik: "bg-green-200 text-green-800",
    perlu_perhatian: "bg-amber-200 text-amber-800",
    rusak: "bg-red-200 text-red-800",
};

function KondisiBadge({ baik }) {
    return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${baik ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
        >
            {baik ? "Baik" : "Masalah"}
        </span>
    );
}

function ItemEditor({ items, setItems }) {
    const update = (idx, key, value) =>
        setItems(
            items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
        );

    return (
        <div className="space-y-2">
            {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={it.bagian}
                        onChange={(e) => update(idx, "bagian", e.target.value)}
                        placeholder="Bagian"
                        className={inputClass + " flex-1"}
                    />
                    <select
                        value={it.kondisi}
                        onChange={(e) => update(idx, "kondisi", e.target.value)}
                        className={inputClass + " w-40"}
                    >
                        {KONDISI_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={it.catatan}
                        onChange={(e) => update(idx, "catatan", e.target.value)}
                        placeholder="Catatan"
                        className={inputClass + " flex-1"}
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setItems(items.filter((_, i) => i !== idx))
                        }
                        className="text-red-500 hover:text-red-700"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() =>
                    setItems([
                        ...items,
                        { bagian: "", kondisi: "baik", catatan: "" },
                    ])
                }
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
                <Plus className="w-4 h-4" /> Tambah bagian
            </button>
        </div>
    );
}

function ChecklistForm({ armada, options, tipe }) {
    const isAkhir = tipe === "akhir";
    const isAlatBerat = armada.tipe_unit === "alat_berat";
    const odoKey = isAlatBerat
        ? isAkhir
            ? "hm_akhir"
            : "hm_odo"
        : isAkhir
          ? "odo_akhir"
          : "odo_pagi";
    const jamKey = isAkhir ? "jam_selesai_operasi" : "jam_mulai_operasi";

    const { data, setData, post, processing, errors } = useForm({
        tanggal: new Date().toISOString().split("T")[0],
        stok_solar: "",
        [odoKey]: "",
        [jamKey]: "",
        items: BAGIAN_DEFAULT.map((b) => ({
            bagian: b,
            kondisi: "baik",
            catatan: "",
        })),
        dicatat_oleh_karyawan_id: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(
            route(
                isAkhir
                    ? "fleet.armada.record-checklist-akhir"
                    : "fleet.armada.record-checklist",
                armada.id,
            ),
            { preserveScroll: true },
        );
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                {isAkhir ? "Checklist Akhir" : "Checklist Awal"}
            </h3>
            <form onSubmit={submit} className="space-y-4">
                <Field label="Tanggal *" error={errors.tanggal}>
                    <input
                        type="date"
                        value={data.tanggal}
                        onChange={(e) => setData("tanggal", e.target.value)}
                        className={inputClass}
                    />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Stok Solar">
                        <select
                            value={data.stok_solar}
                            onChange={(e) =>
                                setData("stok_solar", e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">-</option>
                            {(options.stokSolarOptions || []).map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label={isAlatBerat ? "HM" : "ODO"}>
                        <input
                            type="number"
                            step="0.01"
                            value={data[odoKey]}
                            onChange={(e) => setData(odoKey, e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                </div>
                <Field
                    label={
                        isAkhir ? "Jam Selesai Operasi" : "Jam Mulai Operasi"
                    }
                >
                    <input
                        type="time"
                        value={data[jamKey]}
                        onChange={(e) => setData(jamKey, e.target.value)}
                        className={inputClass}
                    />
                </Field>
                <Field label="Kondisi per Bagian">
                    <ItemEditor
                        items={data.items}
                        setItems={(v) => setData("items", v)}
                    />
                </Field>
                <Field
                    label="Dicatat Oleh *"
                    error={errors.dicatat_oleh_karyawan_id}
                >
                    <select
                        value={data.dicatat_oleh_karyawan_id}
                        onChange={(e) =>
                            setData("dicatat_oleh_karyawan_id", e.target.value)
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
                    {processing
                        ? "Menyimpan..."
                        : isAkhir
                          ? "Simpan Checklist Akhir"
                          : "Simpan Checklist Awal"}
                </button>
            </form>
        </div>
    );
}

function ChecklistSection({ armada, options }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChecklistForm armada={armada} options={options} tipe="awal" />
                <ChecklistForm armada={armada} options={options} tipe="akhir" />
            </div>

            <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
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
                                    Awal
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Akhir
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Dicatat Oleh
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {armada.checklists.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                                        {formatTanggal(c.tanggal)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <KondisiBadge baik={c.kondisi_baik} />
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {c.akhir ? (
                                            <KondisiBadge
                                                baik={c.akhir.kondisi_baik}
                                            />
                                        ) : (
                                            <span className="text-gray-400">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${c.akhir ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-700"}`}
                                            >
                                                {c.akhir
                                                    ? "Selesai"
                                                    : "Berjalan"}
                                            </span>
                                            {c.akhir?.odo_anomali && (
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-200 text-amber-800 w-fit">
                                                    ODO Anomali
                                                </span>
                                            )}
                                        </div>
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

function PengisianSolarSection({ armada }) {
    const rows = armada.pengisian_solars || [];

    return (
        <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-blue-600" /> Riwayat Pengisian
                Solar
            </h3>
            {rows.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                    Belum ada pengisian solar
                </p>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {[
                                "Tanggal",
                                "Waktu",
                                "ODO/HM",
                                "Liter",
                                "Nominal",
                                "Rp/L",
                                "Foto",
                                "Driver",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {rows.map((p) => (
                            <tr key={p.id}>
                                <td className="px-4 py-2 text-sm whitespace-nowrap">
                                    {formatTanggal(p.tanggal)}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                    {p.waktu || "-"}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                    {p.odo_atau_hm != null
                                        ? Number(p.odo_atau_hm).toLocaleString(
                                              "id-ID",
                                          )
                                        : "-"}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                    {Number(p.liter).toLocaleString("id-ID")} L
                                </td>
                                <td className="px-4 py-2 text-sm">
                                    Rp{" "}
                                    {Number(p.nominal_rp).toLocaleString(
                                        "id-ID",
                                    )}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                    Rp{" "}
                                    {Number(p.harga_per_liter).toLocaleString(
                                        "id-ID",
                                    )}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                    <div className="flex gap-2">
                                        {p.foto_odo_url && (
                                            <a
                                                href={p.foto_odo_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                ODO
                                            </a>
                                        )}
                                        {p.foto_nota_url && (
                                            <a
                                                href={p.foto_nota_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Nota
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-sm">
                                    {p.dicatat_oleh?.nama ||
                                        p.karyawan?.nama ||
                                        "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function DowntimeSection({ armada }) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            penyebab: "",
            kategori: "kerusakan",
            catatan: "",
        });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.start-downtime", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
            },
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
                            onChange={(e) => setData("catatan", e.target.value)}
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
                                        {formatTanggal(d.mulai)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {d.selesai
                                            ? formatTanggal(d.selesai)
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
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            karyawan_id: "",
            tipe: "standby",
            tanggal_mulai: new Date().toISOString().split("T")[0],
        });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.armada.assign-driver", armada.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
            },
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
                            onChange={(e) => setData("tipe", e.target.value)}
                            className={inputClass}
                        >
                            <option value="standby">Standby</option>
                            <option value="kondisional">Kondisional</option>
                        </select>
                    </Field>
                    <Field label="Tanggal Mulai *" error={errors.tanggal_mulai}>
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
                <h3 className="font-semibold mb-4">Riwayat Penugasan Driver</h3>
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
                                        {formatTanggal(da.tanggal_mulai)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {da.tanggal_selesai
                                            ? formatTanggal(da.tanggal_selesai)
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

function HelperSection({ armada }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        armada_id: armada.id,
        nama: "",
        no_hp: "",
        honor: "",
        durasi_mulai: new Date().toISOString().split("T")[0],
        durasi_selesai: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.helper.store"), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const helpers = armada.helper_armadas || [];

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" /> Tambah Helper
                </h3>
                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <Field label="Nama *" error={errors.nama}>
                        <input
                            type="text"
                            value={data.nama}
                            onChange={(e) => setData("nama", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="No HP" error={errors.no_hp}>
                        <input
                            type="text"
                            value={data.no_hp}
                            onChange={(e) => setData("no_hp", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Honor (Rp)" error={errors.honor}>
                        <input
                            type="number"
                            value={data.honor}
                            onChange={(e) => setData("honor", e.target.value)}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Durasi Mulai *" error={errors.durasi_mulai}>
                        <input
                            type="date"
                            value={data.durasi_mulai}
                            onChange={(e) =>
                                setData("durasi_mulai", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Durasi Selesai" error={errors.durasi_selesai}>
                        <input
                            type="date"
                            value={data.durasi_selesai}
                            onChange={(e) =>
                                setData("durasi_selesai", e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" /> Tambah
                        </button>
                    </div>
                </form>
            </div>

            {helpers.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                                    Nama
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                                    No HP
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                                    Honor
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                                    Durasi
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                                    Presensi
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {helpers.map((h) => (
                                <HelperRow
                                    key={h.id}
                                    armada={armada}
                                    helper={h}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function HelperRow({ armada, helper }) {
    const [editing, setEditing] = useState(false);

    const {
        data,
        setData,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        armada_id: armada.id,
        nama: helper.nama || "",
        no_hp: helper.no_hp || "",
        honor: helper.honor ?? "",
        durasi_mulai: helper.durasi_mulai || "",
        durasi_selesai: helper.durasi_selesai || "",
        status: helper.status || "aktif",
    });

    const save = (e) => {
        e.preventDefault();

        put(route("fleet.helper.update", helper.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditing(false);
                clearErrors();
            },
        });
    };

    const cancelEdit = () => {
        reset();
        clearErrors();
        setEditing(false);
    };

    const handleDelete = () => {
        if (
            window.confirm(
                `Apakah Anda yakin ingin menghapus helper "${helper.nama}"?`,
            )
        ) {
            destroy(route("fleet.helper.destroy", helper.id), {
                preserveScroll: true,
            });
        }
    };

    const presensis = helper.presensis || [];

    const inputClass =
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

    return (
        <tr className="border-b border-gray-100 last:border-b-0">
            <td colSpan={7} className="p-0">
                {editing ? (
                    <form onSubmit={save} className="bg-blue-50/50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Edit Helper
                                </h3>
                                <p className="mt-1 text-xs text-gray-500">
                                    Perbarui informasi helper di bawah ini.
                                </p>
                            </div>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                Mode Edit
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Nama Helper
                                </label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) =>
                                        setData("nama", e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                />
                                {errors.nama && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.nama}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Nomor HP
                                </label>
                                <input
                                    type="text"
                                    value={data.no_hp}
                                    onChange={(e) =>
                                        setData("no_hp", e.target.value)
                                    }
                                    className={inputClass}
                                />
                                {errors.no_hp && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.no_hp}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Honor
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.honor}
                                    onChange={(e) =>
                                        setData("honor", e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                />
                                {errors.honor && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.honor}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Durasi Mulai
                                </label>
                                <input
                                    type="date"
                                    value={data.durasi_mulai}
                                    onChange={(e) =>
                                        setData("durasi_mulai", e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                />
                                {errors.durasi_mulai && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.durasi_mulai}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Durasi Selesai
                                </label>
                                <input
                                    type="date"
                                    value={data.durasi_selesai}
                                    min={data.durasi_mulai || undefined}
                                    onChange={(e) =>
                                        setData(
                                            "durasi_selesai",
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                                {errors.durasi_selesai && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.durasi_selesai}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) =>
                                        setData("status", e.target.value)
                                    }
                                    className={inputClass}
                                    required
                                >
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Nonaktif</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.status}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2 border-t border-gray-200 pt-4">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={processing}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing
                                    ? "Menyimpan..."
                                    : "Simpan Perubahan"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <table className="w-full">
                        <tbody>
                            <tr>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {helper.nama}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {helper.no_hp || "-"}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {Number(helper.honor || 0).toLocaleString(
                                        "id-ID",
                                    )}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {formatTanggal(helper.durasi_mulai) || "-"}
                                    {formatTanggal(helper.durasi_selesai)
                                        ? ` s/d ${formatTanggal(helper.durasi_selesai)}`
                                        : ""}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {presensis.length === 0 ? (
                                        "-"
                                    ) : (
                                        <ul className="space-y-1">
                                            {presensis.map((p) => (
                                                <li key={p.id}>
                                                    {formatTanggal(p.tanggal)}
                                                    {" · "}
                                                    {p.check_in
                                                        ? formatTanggal(
                                                              p.check_in,
                                                          )
                                                        : "?"}
                                                    {" - "}
                                                    {p.check_out
                                                        ? formatTanggal(
                                                              p.check_out,
                                                          )
                                                        : "?"}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </td>

                                <td className="px-4 py-3 text-sm">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            helper.status === "aktif"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {helper.status === "aktif"
                                            ? "Aktif"
                                            : "Nonaktif"}
                                    </span>
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditing(true)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={processing}
                                            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </td>
        </tr>
    );
}

export default function Show({ armada, options, can }) {
    const [tab, setTab] = useState("ritase");

    const tabs = [
        { key: "ritase", label: "Ritase", icon: <Truck className="w-4 h-4" /> },
        {
            key: "sewa",
            label: "Sewa Alat",
            icon: <Clock className="w-4 h-4" />,
        },
        {
            key: "service",
            label: "Servis",
            icon: <Wrench className="w-4 h-4" />,
        },
        { key: "bbm", label: "BBM", icon: <Fuel className="w-4 h-4" /> },
        {
            key: "checklist",
            label: "Checklist",
            icon: <ClipboardCheck className="w-4 h-4" />,
        },
        {
            key: "pengisian_solar",
            label: "Pengisian Solar",
            icon: <Fuel className="w-4 h-4" />,
        },
        {
            key: "downtime",
            label: "Downtime",
            icon: <Play className="w-4 h-4" />,
        },
        {
            key: "driver",
            label: "Driver",
            icon: <UserPlus className="w-4 h-4" />,
        },
        ...(can.helper
            ? [
                  {
                      key: "helper",
                      label: "Helper",
                      icon: <Users className="w-4 h-4" />,
                  },
              ]
            : []),
    ];

    return (
        <Layout>
            <div className="mb-6 flex items-center gap-4 flex-wrap">
                <h1 className="text-2xl font-bold">
                    Armada: {armada.kode_unit}
                </h1>
                <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS[armada.status] || "bg-gray-200 text-gray-800"}`}
                >
                    {armada.status}
                </span>
                <div className="ml-auto flex items-center gap-2">
                    <Link
                        href={route("fleet.armada.index")}
                        className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali
                    </Link>
                    <Link
                        href={route("fleet.armada.edit", armada.id)}
                        className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </Link>
                </div>
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
                            {armada.plat_nomor || "-"}
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
                            {armada.driver_assignments[0]?.karyawan?.nama}
                        </span>
                    </div>
                </div>
            </div>

            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === "ritase" && (
                <RitaseSection armada={armada} options={options} can={can} />
            )}
            {tab === "sewa" && (
                <SewaSection armada={armada} options={options} can={can} />
            )}
            {tab === "service" && (
                <ServiceSection armada={armada} options={options} />
            )}
            {tab === "bbm" && <BbmSection armada={armada} options={options} />}
            {tab === "checklist" && (
                <ChecklistSection armada={armada} options={options} />
            )}
            {tab === "pengisian_solar" && (
                <PengisianSolarSection armada={armada} />
            )}
            {tab === "downtime" && <DowntimeSection armada={armada} />}
            {tab === "driver" && (
                <DriverSection armada={armada} options={options} />
            )}
            {tab === "helper" && can.helper && (
                <HelperSection armada={armada} />
            )}
        </Layout>
    );
}
