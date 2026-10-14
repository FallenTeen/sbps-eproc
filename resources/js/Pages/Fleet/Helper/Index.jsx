import React, { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Plus, Search, Users, Pencil, Trash2, X } from "lucide-react";

const STATUS_BADGE = {
    aktif: "bg-green-200 text-green-800",
    selesai: "bg-gray-200 text-gray-600",
};

const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

function armadaLabel(armada) {
    if (!armada) return "-";
    const unit = [armada.kode_unit, armada.plat_nomor]
        .filter(Boolean)
        .join(" · ");
    return armada.driver_aktif ? `${unit} — ${armada.driver_aktif}` : unit;
}

function formatTanggal(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID");
}

export default function Index({ helpers, options, filters }) {
    const [armadaId, setArmadaId] = useState(filters.armada_id || "");
    const [status, setStatus] = useState(filters.status || "");
    const [showForm, setShowForm] = useState(false);

    const applyFilters = () => {
        router.get(route("fleet.helper.index"), {
            armada_id: armadaId || undefined,
            status: status || undefined,
        });
    };

    const resetFilters = () => {
        setArmadaId("");
        setStatus("");
        router.get(route("fleet.helper.index"));
    };

    const armadas = options.armadas || [];
    const statuses = options.statuses || [];

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Helper Armada
                </h1>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? "Tutup Form" : "Tambah Helper"}
                </button>
            </div>

            {showForm && (
                <HelperForm
                    armadas={armadas}
                    statuses={statuses}
                    onDone={() => setShowForm(false)}
                />
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[220px]">
                        <label className={labelClass}>Armada</label>
                        <select
                            value={armadaId}
                            onChange={(e) => setArmadaId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Semua armada</option>
                            {armadas.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {armadaLabel(a)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[160px]">
                        <label className={labelClass}>Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Semua status</option>
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={applyFilters}
                            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md flex items-center gap-1 text-sm"
                        >
                            <Search className="w-4 h-4" /> Terapkan
                        </button>
                        <button
                            onClick={resetFilters}
                            className="border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-md text-sm"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Armada</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No HP</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Honor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durasi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presensi Terakhir</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {helpers.data?.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                    Tidak ada helper
                                </td>
                            </tr>
                        ) : (
                            helpers.data?.map((helper) => (
                                <HelperRow
                                    key={helper.id}
                                    helper={helper}
                                    armadas={armadas}
                                    statuses={statuses}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Menampilkan {helpers.from || 0} - {helpers.to || 0} dari {helpers.total || 0} data
                </div>
                <div className="flex gap-2">
                    {helpers.links &&
                        helpers.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 border rounded ${
                                    link.active ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                                }`}
                                disabled={!link.url}
                            />
                        ))}
                </div>
            </div>
        </Layout>
    );
}

function HelperForm({ armadas, statuses, onDone }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        armada_id: "",
        nama: "",
        no_hp: "",
        foto: null,
        honor: "",
        durasi_mulai: new Date().toISOString().split("T")[0],
        durasi_selesai: "",
        status: "aktif",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("fleet.helper.store"), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };

    return (
        <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label className={labelClass}>Armada *</label>
                    <select
                        value={data.armada_id}
                        onChange={(e) => setData("armada_id", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Pilih armada...</option>
                        {armadas.map((a) => (
                            <option key={a.id} value={a.id}>
                                {armadaLabel(a)}
                            </option>
                        ))}
                    </select>
                    {errors.armada_id && (
                        <p className="text-red-600 text-xs mt-1">{errors.armada_id}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Nama Helper *</label>
                    <input
                        type="text"
                        value={data.nama}
                        onChange={(e) => setData("nama", e.target.value)}
                        className={inputClass}
                    />
                    {errors.nama && <p className="text-red-600 text-xs mt-1">{errors.nama}</p>}
                </div>
                <div>
                    <label className={labelClass}>No HP</label>
                    <input
                        type="text"
                        value={data.no_hp}
                        onChange={(e) => setData("no_hp", e.target.value)}
                        className={inputClass}
                    />
                    {errors.no_hp && <p className="text-red-600 text-xs mt-1">{errors.no_hp}</p>}
                </div>
                <div>
                    <label className={labelClass}>Honor (Rp)</label>
                    <input
                        type="number"
                        value={data.honor}
                        onChange={(e) => setData("honor", e.target.value)}
                        className={inputClass}
                    />
                    {errors.honor && <p className="text-red-600 text-xs mt-1">{errors.honor}</p>}
                </div>
                <div>
                    <label className={labelClass}>Foto</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setData("foto", e.target.files?.[0] || null)}
                        className={inputClass}
                    />
                    {errors.foto && <p className="text-red-600 text-xs mt-1">{errors.foto}</p>}
                </div>
                <div>
                    <label className={labelClass}>Durasi Mulai *</label>
                    <input
                        type="date"
                        value={data.durasi_mulai}
                        onChange={(e) => setData("durasi_mulai", e.target.value)}
                        className={inputClass}
                    />
                    {errors.durasi_mulai && (
                        <p className="text-red-600 text-xs mt-1">{errors.durasi_mulai}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Durasi Selesai</label>
                    <input
                        type="date"
                        value={data.durasi_selesai}
                        onChange={(e) => setData("durasi_selesai", e.target.value)}
                        className={inputClass}
                    />
                    {errors.durasi_selesai && (
                        <p className="text-red-600 text-xs mt-1">{errors.durasi_selesai}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Status</label>
                    <select
                        value={data.status}
                        onChange={(e) => setData("status", e.target.value)}
                        className={inputClass}
                    >
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                    Simpan Helper
                </button>
            </div>
        </form>
    );
}

function HelperRow({ helper, armadas, statuses }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, put, delete: destroy, processing, errors } = useForm({
        armada_id: helper.armada_id,
        nama: helper.nama,
        no_hp: helper.no_hp || "",
        foto: null,
        honor: helper.honor ?? "",
        durasi_mulai: helper.durasi_mulai || "",
        durasi_selesai: helper.durasi_selesai || "",
        status: helper.status || "aktif",
    });

    const save = (e) => {
        e.preventDefault();
        put(route("fleet.helper.update", helper.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const presensis = helper.presensis || [];

    return (
        <>
            <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{helper.nama}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                    {helper.armada
                        ? [helper.armada.kode_unit, helper.armada.plat_nomor].filter(Boolean).join(" · ")
                        : "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{helper.no_hp || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600 text-right">
                    {Number(helper.honor || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                    {formatTanggal(helper.durasi_mulai)}
                    {helper.durasi_selesai ? ` s/d ${formatTanggal(helper.durasi_selesai)}` : ""}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                    {presensis.length === 0 ? (
                        "-"
                    ) : (
                        <ul className="space-y-0.5">
                            {presensis.map((p) => (
                                <li key={p.id}>
                                    {formatTanggal(p.tanggal)} · {p.check_in ? "in" : "-"}
                                    {p.check_out ? " / out" : ""}
                                </li>
                            ))}
                        </ul>
                    )}
                </td>
                <td className="px-6 py-4 text-sm">
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            STATUS_BADGE[helper.status] || "bg-gray-200 text-gray-600"
                        }`}
                    >
                        {helper.status}
                    </span>
                </td>
                <td className="px-6 py-4 text-sm text-right whitespace-nowrap space-x-3">
                    <button
                        onClick={() => setEditing((v) => !v)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                    >
                        <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("Hapus helper ini?")) {
                                destroy(route("fleet.helper.destroy", helper.id), {
                                    preserveScroll: true,
                                });
                            }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4 inline" />
                    </button>
                </td>
            </tr>
            {editing && (
                <tr className="bg-gray-50">
                    <td colSpan="8" className="px-6 py-4">
                        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Armada</label>
                                <select
                                    value={data.armada_id}
                                    onChange={(e) => setData("armada_id", e.target.value)}
                                    className={inputClass}
                                >
                                    {armadas.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {armadaLabel(a)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Nama</label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData("nama", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>No HP</label>
                                <input
                                    type="text"
                                    value={data.no_hp}
                                    onChange={(e) => setData("no_hp", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Honor (Rp)</label>
                                <input
                                    type="number"
                                    value={data.honor}
                                    onChange={(e) => setData("honor", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Foto (ganti)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData("foto", e.target.files?.[0] || null)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Durasi Mulai</label>
                                <input
                                    type="date"
                                    value={data.durasi_mulai}
                                    onChange={(e) => setData("durasi_mulai", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Durasi Selesai</label>
                                <input
                                    type="date"
                                    value={data.durasi_selesai}
                                    onChange={(e) => setData("durasi_selesai", e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData("status", e.target.value)}
                                    className={inputClass}
                                >
                                    {statuses.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-4 flex justify-end gap-2">
                                {Object.keys(errors).length > 0 && (
                                    <span className="text-red-600 text-xs self-center mr-auto">
                                        {Object.values(errors)[0]}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className="border border-gray-300 px-4 py-2 rounded-md text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </td>
                </tr>
            )}
        </>
    );
}
