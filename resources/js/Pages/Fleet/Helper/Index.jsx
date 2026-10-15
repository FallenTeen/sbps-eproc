import React, { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import DataTable from "@/Components/DataTable";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";

const STATUS_BADGE = {
    aktif: "bg-green-200 text-green-800",
    selesai: "bg-gray-200 text-gray-600",
};

const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

function armadaLabel(armada) {
    if (!armada) return "-";
    const unit = [armada.kode_unit, armada.plat_nomor].filter(Boolean).join(" · ");
    return armada.driver_aktif ? `${unit} — ${armada.driver_aktif}` : unit;
}

function formatTanggal(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID");
}

export default function Index({ helpers, options, filters, sort, direction }) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const armadas = options.armadas || [];
    const statuses = options.statuses || [];

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (helper) => {
        setEditing(helper);
        setFormOpen(true);
    };

    const columns = [
        {
            key: "nama",
            label: "Nama",
            type: "text",
            cellClassName: "px-4 py-3 text-sm font-medium text-gray-900",
            render: (h) => h.nama,
        },
        {
            key: "armada",
            label: "Armada",
            type: "select",
            options: armadas.map((a) => ({ value: String(a.id), label: armadaLabel(a) })),
            cellClassName: "px-4 py-3 text-sm text-gray-600",
            render: (h) =>
                h.armada
                    ? [h.armada.kode_unit, h.armada.plat_nomor].filter(Boolean).join(" · ")
                    : "-",
        },
        {
            key: "no_hp",
            label: "No HP",
            search: false,
            cellClassName: "px-4 py-3 text-sm text-gray-600",
            render: (h) => h.no_hp || "-",
        },
        {
            key: "honor",
            label: "Honor",
            search: false,
            align: "right",
            cellClassName: "px-4 py-3 text-sm text-gray-600 text-right tabular-nums",
            render: (h) => Number(h.honor || 0).toLocaleString("id-ID"),
        },
        {
            key: "durasi_mulai",
            label: "Durasi",
            type: "dateRange",
            cellClassName: "px-4 py-3 text-sm text-gray-600 whitespace-nowrap",
            render: (h) =>
                `${formatTanggal(h.durasi_mulai)}${h.durasi_selesai ? ` s/d ${formatTanggal(h.durasi_selesai)}` : ""}`,
        },
        {
            key: "presensi",
            label: "Presensi Terakhir",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-3 text-sm text-gray-600",
            render: (h) => {
                const presensis = h.presensis || [];
                if (presensis.length === 0) return "-";
                return (
                    <ul className="space-y-1">
                        {presensis.map((p) => (
                            <li key={p.id} className="flex items-center gap-2">
                                <span>
                                    {formatTanggal(p.tanggal)} · {p.check_in ? "in" : "-"}
                                    {p.check_out ? " / out" : ""}
                                </span>
                                {p.foto_check_in_url && (
                                    <a href={p.foto_check_in_url} target="_blank" rel="noreferrer" title="Foto check-in">
                                        <img src={p.foto_check_in_url} alt="Check-in" className="w-8 h-8 rounded object-cover border border-gray-200" />
                                    </a>
                                )}
                                {p.foto_check_out_url && (
                                    <a href={p.foto_check_out_url} target="_blank" rel="noreferrer" title="Foto check-out">
                                        <img src={p.foto_check_out_url} alt="Check-out" className="w-8 h-8 rounded object-cover border border-gray-200" />
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                );
            },
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            options: statuses,
            cellClassName: "px-4 py-3 text-sm",
            render: (h) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[h.status] || "bg-gray-200 text-gray-600"}`}>
                    {h.status}
                </span>
            ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 text-sm text-right whitespace-nowrap space-x-3",
            render: (h) => (
                <>
                    <button onClick={() => openEdit(h)} className="text-blue-600 hover:text-blue-900" title="Edit">
                        <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("Hapus helper ini?")) {
                                router.delete(route("fleet.helper.destroy", h.id), { preserveScroll: true });
                            }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4 inline" />
                    </button>
                </>
            ),
        },
    ];

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Helper Armada
                </h1>
                <button
                    onClick={openCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Helper
                </button>
            </div>

            <DataTable
                routeName="fleet.helper.index"
                columns={columns}
                rows={helpers}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Tidak ada helper."
            />

            {formOpen && (
                <HelperModal
                    key={editing?.id ?? "new"}
                    helper={editing}
                    armadas={armadas}
                    statuses={statuses}
                    onClose={() => setFormOpen(false)}
                />
            )}
        </Layout>
    );
}

function HelperModal({ helper, armadas, statuses, onClose }) {
    const isEdit = !!helper;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        armada_id: helper?.armada_id ?? "",
        nama: helper?.nama ?? "",
        no_hp: helper?.no_hp ?? "",
        foto: null,
        honor: helper?.honor ?? "",
        durasi_mulai: helper?.durasi_mulai ?? new Date().toISOString().split("T")[0],
        durasi_selesai: helper?.durasi_selesai ?? "",
        status: helper?.status ?? "aktif",
    });

    const submit = (e) => {
        e.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        };
        if (isEdit) {
            put(route("fleet.helper.update", helper.id), options);
        } else {
            post(route("fleet.helper.store"), options);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
            <form onSubmit={submit} className="mt-10 w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                    {isEdit ? "Edit Helper" : "Tambah Helper"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Armada *</label>
                        <select value={data.armada_id} onChange={(e) => setData("armada_id", e.target.value)} className={inputClass}>
                            <option value="">Pilih armada...</option>
                            {armadas.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {armadaLabel(a)}
                                </option>
                            ))}
                        </select>
                        {errors.armada_id && <p className="text-red-600 text-xs mt-1">{errors.armada_id}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Nama Helper *</label>
                        <input type="text" value={data.nama} onChange={(e) => setData("nama", e.target.value)} className={inputClass} />
                        {errors.nama && <p className="text-red-600 text-xs mt-1">{errors.nama}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>No HP</label>
                        <input type="text" value={data.no_hp} onChange={(e) => setData("no_hp", e.target.value)} className={inputClass} />
                        {errors.no_hp && <p className="text-red-600 text-xs mt-1">{errors.no_hp}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Honor (Rp)</label>
                        <input type="number" value={data.honor} onChange={(e) => setData("honor", e.target.value)} className={inputClass} />
                        {errors.honor && <p className="text-red-600 text-xs mt-1">{errors.honor}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>{isEdit ? "Foto (ganti)" : "Foto"}</label>
                        <input type="file" accept="image/*" onChange={(e) => setData("foto", e.target.files?.[0] || null)} className={inputClass} />
                        {errors.foto && <p className="text-red-600 text-xs mt-1">{errors.foto}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Durasi Mulai *</label>
                        <input type="date" value={data.durasi_mulai} onChange={(e) => setData("durasi_mulai", e.target.value)} className={inputClass} />
                        {errors.durasi_mulai && <p className="text-red-600 text-xs mt-1">{errors.durasi_mulai}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Durasi Selesai</label>
                        <input type="date" value={data.durasi_selesai} onChange={(e) => setData("durasi_selesai", e.target.value)} className={inputClass} />
                        {errors.durasi_selesai && <p className="text-red-600 text-xs mt-1">{errors.durasi_selesai}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select value={data.status} onChange={(e) => setData("status", e.target.value)} className={inputClass}>
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="border border-gray-300 px-4 py-2 rounded-md text-sm">
                        Batal
                    </button>
                    <button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
                        Simpan Helper
                    </button>
                </div>
            </form>
        </div>
    );
}
