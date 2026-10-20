import React, { useEffect } from "react";
import { Link, useForm } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { Activity, Play, CheckCircle, ArrowLeft } from "lucide-react";

export default function Create({ mesins, produks, operator, titiks }) {
    const { data, setData, post, processing, errors } = useForm({
        mesin_id: "",
        titik_id: "",
        produk_id: "",
        operator_karyawan_id: "",
        catatan: "",
    });

    /* Auto-fill titik & produk dari mesin yang dipilih */
    useEffect(() => {
        if (!data.mesin_id) return;
        const mesin = mesins.find((m) => m.id === data.mesin_id);
        if (mesin) {
            setData((prev) => ({
                ...prev,
                titik_id: mesin.titik_id || prev.titik_id,
                produk_id: mesin.produk_id || prev.produk_id,
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.mesin_id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("production.sessions.store"));
    };

    const selectedMesin = mesins.find((m) => m.id === data.mesin_id);

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Mulai Sesi Produksi
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Lengkapi konfigurasi untuk memulai sesi produksi
                                baru.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informasi Mesin */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <Play className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Konfigurasi sesi
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Tentukan mesin, lokasi, produk, dan
                                        operator produksi.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mb-4">
                                    {/* Mesin Produksi */}
                                    <Field
                                        label="Mesin Produksi"
                                        required
                                        error={errors.mesin_id}
                                        hint="Hanya mesin berstatus Aktif"
                                    >
                                        <select
                                            value={data.mesin_id}
                                            onChange={(e) =>
                                                setData(
                                                    "mesin_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={cls(errors.mesin_id)}
                                        >
                                            <option value="">
                                                -- Pilih Mesin --
                                            </option>

                                            {mesins.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.nama} —{" "}
                                                    {m.jenis?.replace("_", " ")}{" "}
                                                    {m.kapasitas
                                                        ? `(${m.kapasitas})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    {/* Informasi Mesin */}
                                    {selectedMesin && (
                                        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                                    <Activity className="h-4 w-4 text-blue-600" />
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-semibold text-blue-900">
                                                        Informasi Mesin
                                                    </h3>
                                                    <p className="text-xs text-blue-700">
                                                        Detail mesin yang
                                                        dipilih
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <div className="rounded-lg border border-blue-100 bg-white p-3">
                                                    <p className="text-xs font-medium text-gray-500">
                                                        Jenis Mesin
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
                                                        {selectedMesin.jenis?.replace(
                                                            "_",
                                                            " ",
                                                        ) || "-"}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-blue-100 bg-white p-3">
                                                    <p className="text-xs font-medium text-gray-500">
                                                        Kapasitas
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                                        {selectedMesin.kapasitas ||
                                                            "-"}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-blue-100 bg-white p-3">
                                                    <p className="text-xs font-medium text-gray-500">
                                                        Biaya per Jam
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-blue-700">
                                                        Rp{" "}
                                                        {Number(
                                                            selectedMesin.biaya_per_jam ||
                                                                0,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Produk Output */}
                                    <Field
                                        label="Produk Output"
                                        required
                                        error={errors.produk_id}
                                    >
                                        <select
                                            value={data.produk_id}
                                            onChange={(e) =>
                                                setData(
                                                    "produk_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={cls(errors.produk_id)}
                                        >
                                            <option value="">
                                                -- Pilih Produk --
                                            </option>

                                            {produks.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama} ({p.satuan_output})
                                                </option>
                                            ))}
                                        </select>

                                        {data.mesin_id &&
                                            selectedMesin?.produk_id ===
                                                data.produk_id &&
                                            data.produk_id && (
                                                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-blue-600">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Auto-filled dari produk
                                                    default mesin
                                                </p>
                                            )}
                                    </Field>

                                    {/* Operator */}
                                    <Field
                                        label="Operator"
                                        required
                                        error={errors.operator_karyawan_id}
                                    >
                                        <select
                                            value={data.operator_karyawan_id}
                                            onChange={(e) =>
                                                setData(
                                                    "operator_karyawan_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={cls(
                                                errors.operator_karyawan_id,
                                            )}
                                        >
                                            <option value="">
                                                -- Pilih Operator --
                                            </option>

                                            {operator.map((k) => (
                                                <option key={k.id} value={k.id}>
                                                    {k.nama} ({k.tipe})
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    {/* Titik Lokasi */}
                                    <Field
                                        label="Titik Lokasi"
                                        required
                                        error={errors.titik_id}
                                    >
                                        <select
                                            value={data.titik_id}
                                            onChange={(e) =>
                                                setData(
                                                    "titik_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={cls(errors.titik_id)}
                                        >
                                            <option value="">
                                                -- Pilih Titik Lokasi --
                                            </option>

                                            {titiks.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.nama}
                                                </option>
                                            ))}
                                        </select>

                                        {data.mesin_id &&
                                            selectedMesin?.titik_id ===
                                                data.titik_id && (
                                                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-blue-600">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Auto-filled dari titik mesin
                                                </p>
                                            )}
                                    </Field>
                                </div>

                                {/* Catatan */}
                                <Field label="Catatan" error={errors.catatan}>
                                    <textarea
                                        rows={3}
                                        value={data.catatan}
                                        onChange={(e) =>
                                            setData("catatan", e.target.value)
                                        }
                                        placeholder="Tambahkan catatan jika diperlukan..."
                                        className={
                                            cls(errors.catatan) + " resize-none"
                                        }
                                    />
                                </Field>
                            </div>
                        </div>

                        {/* Informasi Sebelum Memulai */}
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                                    <Play className="h-5 w-5 text-emerald-600" />
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-emerald-900">
                                        Setelah klik "Mulai Sesi"
                                    </h3>

                                    <ul className="mt-2 space-y-2 text-sm text-emerald-800">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>
                                                Status sesi berubah menjadi{" "}
                                                <strong>Berjalan</strong>.
                                            </span>
                                        </li>

                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>
                                                Waktu mulai dicatat secara
                                                otomatis.
                                            </span>
                                        </li>

                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>
                                                Anda diarahkan ke halaman detail
                                                sesi.
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                            <Link
                                href={route("production.sessions.index")}
                                className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Play className="h-4 w-4" />

                                {processing
                                    ? "Memulai..."
                                    : "Mulai Sesi Sekarang"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

function cls(err) {
    return `w-full rounded-lg border px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 ${err ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300 focus:border-blue-400"}`;
}
function Field({ label, required, hint, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
                {hint && (
                    <span className="ml-1 text-xs text-gray-400 font-normal">
                        ({hint})
                    </span>
                )}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
