import React, { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import DataTable from "@/Components/DataTable";
import { Fuel, Save, ArrowLeft } from "lucide-react";
import { formatTanggal } from "@/utils/date";

const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

function armadaLabel(armada) {
    if (!armada) return "-";
    const unit = [armada.kode_unit, armada.plat_nomor]
        .filter(Boolean)
        .join(" · ");
    return armada.driver_aktif ? `${unit} - ${armada.driver_aktif}` : unit;
}

function BadgeRow({ pengisian }) {
    const badges = [];
    if (pengisian.liter === null || pengisian.liter === undefined) {
        badges.push(
            <span
                key="tanpa_liter"
                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
            >
                Liter belum diisi
            </span>,
        );
    }
    if (!pengisian.nota_lengkap) {
        badges.push(
            <span
                key="tanpa_nota"
                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"
            >
                Nota belum lengkap
            </span>,
        );
    }
    if (badges.length === 0) {
        badges.push(
            <span
                key="ok"
                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800"
            >
                Lengkap
            </span>,
        );
    }
    return <div className="flex flex-wrap gap-1">{badges}</div>;
}

export default function Index({ pengisians, options, filters, sort, direction }) {
    const [editing, setEditing] = useState(null);

    const armadas = options.armadas || [];
    const badges = options.badges || [];

    const columns = [
        {
            key: "armada",
            label: "Armada",
            type: "select",
            options: armadas.map((a) => ({
                value: String(a.id),
                label: armadaLabel(a),
            })),
            cellClassName: "px-4 py-3 text-sm text-gray-600",
            render: (p) =>
                p.armada
                    ? [p.armada.kode_unit, p.armada.plat_nomor]
                          .filter(Boolean)
                          .join(" · ")
                    : "-",
        },
        {
            key: "tanggal",
            label: "Tanggal",
            type: "date",
            cellClassName: "px-4 py-3 text-sm text-gray-600 whitespace-nowrap",
            render: (p) =>
                `${formatTanggal(p.tanggal)}${p.waktu ? ` ${p.waktu.slice(0, 5)}` : ""}`,
        },
        {
            key: "karyawan",
            label: "Driver",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-3 text-sm text-gray-600",
            render: (p) => p.karyawan?.nama || p.driver || "-",
        },
        {
            key: "odo_atau_hm",
            label: "ODO/HM",
            search: false,
            align: "right",
            cellClassName:
                "px-4 py-3 text-sm text-gray-600 text-right tabular-nums",
            render: (p) =>
                p.odo_atau_hm === null || p.odo_atau_hm === undefined
                    ? "-"
                    : Number(p.odo_atau_hm).toLocaleString("id-ID"),
        },
        {
            key: "nominal_rp",
            label: "Nominal (Rp)",
            search: false,
            align: "right",
            cellClassName:
                "px-4 py-3 text-sm text-gray-600 text-right tabular-nums",
            render: (p) => Number(p.nominal_rp || 0).toLocaleString("id-ID"),
        },
        {
            key: "liter",
            label: "Liter",
            search: false,
            align: "right",
            cellClassName:
                "px-4 py-3 text-sm text-gray-600 text-right tabular-nums",
            render: (p) =>
                p.liter === null || p.liter === undefined
                    ? "-"
                    : Number(p.liter).toLocaleString("id-ID", {
                          maximumFractionDigits: 2,
                      }),
        },
        {
            key: "harga_per_liter",
            label: "Rp/L",
            search: false,
            align: "right",
            cellClassName:
                "px-4 py-3 text-sm text-gray-600 text-right tabular-nums",
            render: (p) =>
                p.harga_per_liter === null || p.harga_per_liter === undefined
                    ? "-"
                    : Number(p.harga_per_liter).toLocaleString("id-ID"),
        },
        {
            key: "foto",
            label: "Foto ODO / Nota",
            search: false,
            sortable: false,
            cellClassName: "px-4 py-3 text-sm text-gray-600",
            render: (p) => (
                <div className="flex items-center gap-2">
                    {p.foto_odo_url && (
                        <a
                            href={p.foto_odo_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Foto ODO/HM"
                        >
                            <img
                                src={p.foto_odo_url}
                                alt="ODO"
                                className="w-8 h-8 rounded object-cover border border-gray-200"
                            />
                        </a>
                    )}
                    {p.foto_nota_url ? (
                        <a
                            href={p.foto_nota_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Foto nota"
                        >
                            <img
                                src={p.foto_nota_url}
                                alt="Nota"
                                className="w-8 h-8 rounded object-cover border border-gray-200"
                            />
                        </a>
                    ) : (
                        <span className="text-xs text-red-600">Nota fisik</span>
                    )}
                </div>
            ),
        },
        {
            key: "badge",
            label: "Status",
            type: "select",
            options: badges,
            sortable: false,
            cellClassName: "px-4 py-3 text-sm",
            render: (p) => <BadgeRow pengisian={p} />,
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName: "px-4 py-3 text-sm text-right whitespace-nowrap",
            render: (p) => (
                <button
                    onClick={() => setEditing(p)}
                    className="text-amber-600 hover:text-amber-800 font-semibold text-xs border border-amber-300 rounded px-2 py-1 hover:bg-amber-50"
                    title="Lengkapi liter / nota / nominal"
                >
                    Lengkapi
                </button>
            ),
        },
    ];

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Fuel className="w-6 h-6 text-blue-600" />
                    Pengisian Solar
                </h1>
            </div>
            <p className="text-sm text-gray-500 mb-4">
                Pelengkapan data dari driver: isi liter, unggah foto nota, dan
                koreksi nominal. Setiap perubahan tercatat di audit log.
            </p>

            <DataTable
                routeName="fleet.pengisian-solar.index"
                columns={columns}
                rows={pengisians}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Belum ada pengisian solar."
            />

            {editing !== null && (
                <LengkapiModal
                    key={editing.id}
                    pengisian={editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </Layout>
    );
}

function LengkapiModal({ pengisian, onClose }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        liter: pengisian.liter ?? "",
        nominal_rp: pengisian.nominal_rp ?? "",
        foto_nota: null,
        catatan: pengisian.catatan ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("fleet.pengisian-solar.update", pengisian.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
            <form
                onSubmit={submit}
                className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl my-8"
            >
                <div className="flex items-center justify-between pb-3 mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                        Lengkapi Pengisian Solar
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className={labelClass}>Armada</label>
                        <p className="text-sm text-gray-700">
                            {armadaLabel(pengisian.armada)}
                        </p>
                        <p className="text-xs text-gray-500">
                            Tanggal {formatTanggal(pengisian.tanggal)} · Driver{" "}
                            {pengisian.karyawan?.nama || "-"} ·{" "}
                            {pengisian.odo_atau_hm !== null
                                ? `ODO/HM ${Number(pengisian.odo_atau_hm).toLocaleString("id-ID")}`
                                : "ODO/HM tidak tercatat"}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass} htmlFor="liter">
                                Liter
                            </label>
                            <input
                                id="liter"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={data.liter}
                                onChange={(e) => setData("liter", e.target.value)}
                                className={inputClass}
                                placeholder="Contoh: 40"
                            />
                            {errors.liter && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.liter}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="nominal_rp">
                                Nominal (Rp)
                            </label>
                            <input
                                id="nominal_rp"
                                type="number"
                                min="0"
                                value={data.nominal_rp}
                                onChange={(e) =>
                                    setData("nominal_rp", e.target.value)
                                }
                                className={inputClass}
                                placeholder="600000"
                            />
                            {errors.nominal_rp && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.nominal_rp}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="foto_nota">
                            Foto Nota{" "}
                            {pengisian.foto_nota_url && "(saat ini ada)"}
                        </label>
                        {pengisian.foto_nota_url && (
                            <img
                                src={pengisian.foto_nota_url}
                                alt="Nota saat ini"
                                className="mb-2 h-16 rounded border border-gray-200 object-cover"
                            />
                        )}
                        <input
                            id="foto_nota"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData("foto_nota", e.target.files?.[0] || null)
                            }
                            className={inputClass}
                        />
                        {errors.foto_nota && (
                            <p className="text-red-600 text-xs mt-1">
                                {errors.foto_nota}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="catatan">
                            Catatan
                        </label>
                        <textarea
                            id="catatan"
                            rows={2}
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            className={inputClass}
                        />
                        {errors.catatan && (
                            <p className="text-red-600 text-xs mt-1">
                                {errors.catatan}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </div>
    );
}
