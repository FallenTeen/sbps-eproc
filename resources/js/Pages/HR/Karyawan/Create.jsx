import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import { Save, ArrowLeft, User, CreditCard } from "lucide-react";

const JABATAN_LAINNYA = "__jabatan_lainnya__";

export default function Create({ jabatanOptions = [], roles = ["user"] }) {
    const [jabatanLainnya, setJabatanLainnya] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        nama: "",
        tipe: "tetap",
        jabatan: "",
        no_hp: "",
        alias: "",
        rate_gaji_pokok: "",
        rate_harian: "",
        npwp: "",
        no_bpjs_kesehatan: "",
        no_bpjs_ketenagakerjaan: "",
        status_ptkp: "",
        status: "aktif",
        create_account: false,
        account_email: "",
        account_password: "",
        account_password_confirmation: "",
        account_role: "user",
    });
    const isCreatingWithAccount = data.create_account;

    const submit = (e) => {
        e.preventDefault();
        post(route("hr.karyawan.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Karyawan" />

            <div className="mx-auto max-w-5xl">
                {/* Header Halaman */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Tambah Karyawan
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Lengkapi profil data dasar dan rincian informasi
                            finansial/administrasi karyawan baru.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Section 1: Informasi Dasar */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                    <User className="h-5 w-5 text-blue-600" />
                                </span>
                                Informasi Dasar
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Isi biodata, identitas kontak, serta posisi
                                jabatan karyawan.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Nama Lengkap */}
                            <div>
                                <label
                                    htmlFor="nama"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Nama Lengkap{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <TextInput
                                    id="nama"
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.nama
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                    value={data.nama}
                                    onChange={(e) =>
                                        setData("nama", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    className="mt-1.5 text-xs text-red-600"
                                    message={errors.nama}
                                />
                            </div>

                            {/* Tipe Karyawan */}
                            <div>
                                <label
                                    htmlFor="tipe"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Tipe Karyawan{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="tipe"
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.tipe
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                    value={data.tipe}
                                    onChange={(e) =>
                                        setData("tipe", e.target.value)
                                    }
                                    required
                                >
                                    <option value="tetap">Tetap</option>
                                    <option value="harian">Harian</option>
                                    <option value="borongan_rit">
                                        Borongan Rit
                                    </option>
                                </select>
                                <InputError
                                    className="mt-1.5 text-xs text-red-600"
                                    message={errors.tipe}
                                />
                            </div>

                            {/* Jabatan */}
                            <div>
                                <label
                                    htmlFor="jabatan"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Jabatan{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="jabatan"
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.jabatan
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                    value={
                                        jabatanLainnya
                                            ? JABATAN_LAINNYA
                                            : data.jabatan
                                    }
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setJabatanLainnya(
                                            value === JABATAN_LAINNYA,
                                        );
                                        setData(
                                            "jabatan",
                                            value === JABATAN_LAINNYA
                                                ? ""
                                                : value,
                                        );
                                    }}
                                    required
                                >
                                    <option value="">Pilih jabatan</option>
                                    {jabatanOptions.map((jabatan) => (
                                        <option key={jabatan} value={jabatan}>
                                            {jabatan}
                                        </option>
                                    ))}
                                    <option value={JABATAN_LAINNYA}>
                                        Jabatan lainnya
                                    </option>
                                </select>
                                {jabatanLainnya && (
                                    <TextInput
                                        id="jabatan-lainnya"
                                        className={`mt-3 w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                            errors.jabatan
                                                ? "border-red-500 focus:ring-red-100"
                                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                        }`}
                                        value={data.jabatan}
                                        onChange={(e) =>
                                            setData("jabatan", e.target.value)
                                        }
                                        placeholder="Masukkan jabatan"
                                        maxLength={255}
                                        required
                                        aria-label="Jabatan lainnya"
                                    />
                                )}
                                <InputError
                                    className="mt-1.5 text-xs text-red-600"
                                    message={errors.jabatan}
                                />
                            </div>

                            {/* No. HP */}
                            <div>
                                <label
                                    htmlFor="no_hp"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    No. HP
                                </label>
                                <TextInput
                                    id="no_hp"
                                    type="tel"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    value={data.no_hp}
                                    onChange={(e) =>
                                        setData("no_hp", e.target.value)
                                    }
                                    placeholder="08xx-xxxx-xxxx"
                                />
                                <InputError
                                    className="mt-1.5 text-xs text-red-600"
                                    message={errors.no_hp}
                                />
                            </div>

                            {/* Alias / Julukan */}
                            <div>
                                <label
                                    htmlFor="alias"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Alias / Julukan
                                </label>
                                <TextInput
                                    id="alias"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    value={data.alias}
                                    onChange={(e) =>
                                        setData("alias", e.target.value)
                                    }
                                    placeholder="contoh: SAMSON"
                                />
                                <InputError
                                    className="mt-1.5 text-xs text-red-600"
                                    message={errors.alias}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label
                                    htmlFor="status"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Status Karyawan{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="status"
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.status
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                    value={data.status}
                                    onChange={(e) =>
                                        setData("status", e.target.value)
                                    }
                                    required
                                >
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Non-Aktif</option>
                                </select>
                                <InputError
                                    className="mt-1.5 text-xs text-red-600"
                                    message={errors.status}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Informasi Finansial & Administrasi */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                </span>
                                Informasi Finansial & Administrasi
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Konfigurasi komponen gaji/rate, pajak PTKP,
                                serta jaminan sosial BPJS.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mb-4">
                            {/* Dynamic Rate Gaji Pokok */}
                            {data.tipe === "tetap" && (
                                <div>
                                    <label
                                        htmlFor="rate_gaji_pokok"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Gaji Pokok (Bulanan)
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
                                            Rp
                                        </div>
                                        <TextInput
                                            id="rate_gaji_pokok"
                                            type="number"
                                            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            value={data.rate_gaji_pokok}
                                            onChange={(e) =>
                                                setData(
                                                    "rate_gaji_pokok",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <InputError
                                        className="mt-1.5 text-xs text-red-600"
                                        message={errors.rate_gaji_pokok}
                                    />
                                </div>
                            )}

                            {/* Dynamic Rate Harian */}
                            {data.tipe === "harian" && (
                                <div>
                                    <label
                                        htmlFor="rate_harian"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Rate Harian
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
                                            Rp
                                        </div>
                                        <TextInput
                                            id="rate_harian"
                                            type="number"
                                            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            value={data.rate_harian}
                                            onChange={(e) =>
                                                setData(
                                                    "rate_harian",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <InputError
                                        className="mt-1.5 text-xs text-red-600"
                                        message={errors.rate_harian}
                                    />
                                </div>
                            )}

                            {/* NPWP */}
                            <div>
                                <label
                                    htmlFor="npwp"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    NPWP
                                </label>
                                <TextInput
                                    id="npwp"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    value={data.npwp}
                                    onChange={(e) =>
                                        setData("npwp", e.target.value)
                                    }
                                />
                                <InputError
                                    className="mt-1.5 text-xs text-red-600"
                                    message={errors.npwp}
                                />
                            </div>

                            {/* Status PTKP */}
                            <div>
                                <label
                                    htmlFor="status_ptkp"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Status PTKP{" "}
                                    <span className="text-xs font-normal text-gray-400">
                                        (contoh: TK/0, K/1)
                                    </span>
                                </label>
                                <TextInput
                                    id="status_ptkp"
                                    className="w-full uppercase rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    value={data.status_ptkp}
                                    onChange={(e) =>
                                        setData(
                                            "status_ptkp",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                />
                                <InputError
                                    className="mt-1.5 text-xs text-red-600"
                                    message={errors.status_ptkp}
                                />
                            </div>

                            {/* No. BPJS Kesehatan */}
                            <div>
                                <label
                                    htmlFor="no_bpjs_kesehatan"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    No. BPJS Kesehatan
                                </label>
                                <TextInput
                                    id="no_bpjs_kesehatan"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    value={data.no_bpjs_kesehatan}
                                    onChange={(e) =>
                                        setData(
                                            "no_bpjs_kesehatan",
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    className="mt-1.5 text-xs text-red-600"
                                    message={errors.no_bpjs_kesehatan}
                                />
                            </div>
                        </div>
                        {/* No. BPJS Ketenagakerjaan */}
                        <div>
                            <label
                                htmlFor="no_bpjs_ketenagakerjaan"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                No. BPJS Ketenagakerjaan
                            </label>
                            <TextInput
                                id="no_bpjs_ketenagakerjaan"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                value={data.no_bpjs_ketenagakerjaan}
                                onChange={(e) =>
                                    setData(
                                        "no_bpjs_ketenagakerjaan",
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                className="mt-1.5 text-xs text-red-600"
                                message={errors.no_bpjs_ketenagakerjaan}
                            />
                        </div>

                        <label className="flex items-center gap-3 py-2">
                            <input
                                id="account_checkbox"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={isCreatingWithAccount}
                                onChange={(e) => {
                                    const enabled = e.target.checked;
                                    setData("create_account", enabled);
                                    if (!enabled) {
                                        setData("account_email", "");
                                        setData("account_password", "");
                                        setData(
                                            "account_password_confirmation",
                                            "",
                                        );
                                        setData("account_role", "user");
                                    }
                                }}
                            />
                            <span className="text-sm font-medium text-gray-800">
                                Buat akun login untuk karyawan ini
                            </span>
                        </label>

                        {/* Section 3: Opsi Akun (Opsional) */}
                        {isCreatingWithAccount && (
                            <section className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                                <div className="mb-5">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-800">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </span>
                                        Opsi Akun
                                    </h2>
                                    <p className="mt-2 text-sm text-blue-600">
                                        Nama akun otomatis mengikuti nama
                                        karyawan. Pilih role untuk menentukan
                                        izin akses akun.
                                    </p>
                                </div>

                                <div className="mb-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="account_email"
                                            className="mb-2 block text-sm font-medium text-blue-700"
                                        >
                                            Email Akun{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <TextInput
                                            id="account_email"
                                            type="email"
                                            className="w-full rounded-lg border border-blue-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            value={data.account_email}
                                            onChange={(e) =>
                                                setData(
                                                    "account_email",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="contoh@email.com"
                                            required
                                        />
                                        <InputError
                                            className="mt-1.5 text-xs text-red-600"
                                            message={errors.account_email}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="account_role"
                                            className="mb-2 block text-sm font-medium text-blue-700"
                                        >
                                            Role akun (izin akses){" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="account_role"
                                            className="w-full rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            value={data.account_role}
                                            onChange={(e) =>
                                                setData(
                                                    "account_role",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1.5 text-sm text-blue-800">
                                            Berbeda dari jabatan karyawan.
                                        </p>
                                        <InputError
                                            className="mt-1.5 text-xs text-red-600"
                                            message={errors.account_role}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="account_password"
                                            className="mb-2 block text-sm font-medium text-blue-700"
                                        >
                                            Password{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <TextInput
                                            id="account_password"
                                            type="password"
                                            className="w-full rounded-lg border border-blue-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            value={data.account_password}
                                            onChange={(e) =>
                                                setData(
                                                    "account_password",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Minimal 8 karakter"
                                            minLength={8}
                                            required
                                        />
                                        <InputError
                                            className="mt-1.5 text-xs text-red-600"
                                            message={errors.account_password}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="account_password_confirmation"
                                            className="mb-2 block text-sm font-medium text-blue-700"
                                        >
                                            Konfirmasi Password{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <TextInput
                                            id="account_password_confirmation"
                                            type="password"
                                            className="w-full rounded-lg border border-blue-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            value={data.account_password_confirmation}
                                            onChange={(e) =>
                                                setData(
                                                    "account_password_confirmation",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ulangi password"
                                            required
                                        />
                                        <InputError
                                            className="mt-1.5 text-xs text-red-600"
                                            message={
                                                errors.account_password_confirmation
                                            }
                                        />
                                    </div>
                                </div>

                            </section>
                        )}

                        {/* Tombol Aksi */}
                        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                            <Link
                                href={route("hr.karyawan.index")}
                                className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
