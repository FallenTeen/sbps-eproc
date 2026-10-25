import React, { useState } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, UserPlus, Link2, Save, UserShield } from "lucide-react";

export default function Create({ roles, karyawans = [] }) {
    const { errors } = usePage().props;
    const [modeKaryawan, setModeKaryawan] = useState("none");
    const [pending, setPending] = useState(false);
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "",
        is_active: true,
        karyawan_id: "",
        new_nama: "",
        new_tipe: "tetap",
        new_jabatan: "",
        new_no_hp: "",
    });

    const set = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            name: data.name,
            email: data.email,
            password: data.password,
            password_confirmation: data.password_confirmation,
            role: data.role,
            is_active: data.is_active,
            karyawan_id: modeKaryawan === "existing" ? data.karyawan_id : "",
        };

        if (modeKaryawan === "new") {
            payload.new_karyawan = {
                nama: data.new_nama,
                tipe: data.new_tipe,
                jabatan: data.new_jabatan,
                no_hp: data.new_no_hp,
            };
        }

        router.post(route("users.store"), payload, {
            onStart: () => setPending(true),
            onFinish: () => setPending(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah User" />

            <div className="mx-auto max-w-5xl">
                {/* Header Halaman */}
                <div className="mb-6 flex items-start gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Tambah User
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Buat akun pengguna baru dan kaitkan dengan data
                            karyawan jika diperlukan.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card Section 1: Informasi Akun Utama */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                                    <UserShield className="h-5 w-5 text-blue-600" />
                                </span>
                                Informasi Akun User
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Isi kredensial login dan hak akses role untuk
                                pengguna ini.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Nama Lengkap{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        set("name", e.target.value)
                                    }
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.name
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Alamat Email{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        set("email", e.target.value)
                                    }
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.email
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                    required
                                />
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Password{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        set("password", e.target.value)
                                    }
                                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.password
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                    required
                                />
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Konfirmasi Password */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Konfirmasi Password{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        set(
                                            "password_confirmation",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Hak Akses / Role{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.role}
                                    onChange={(e) =>
                                        set("role", e.target.value)
                                    }
                                    required
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                        errors.role
                                            ? "border-red-500 focus:ring-red-100"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                >
                                    <option value="">-- Pilih Role --</option>
                                    {roles.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                                {errors.role && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.role}
                                    </p>
                                )}
                            </div>

                            {/* Checkbox Status Aktif */}
                            <div className="flex items-center pt-6">
                                <label className="inline-flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) =>
                                            set("is_active", e.target.checked)
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Akun Aktif (Bisa Login)
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Card Section 2: Data Karyawan Terkait (Opsional) */}
                        <div className="mt-6 5overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-blue-600" />
                                    <h2 className="font-semibold text-gray-900">
                                        Data Karyawan Terkait (Opsional)
                                    </h2>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Karyawan tidak wajib punya akun. Pilih untuk
                                    menautkan karyawan yang sudah ada atau
                                    membuat profil karyawan baru yang terhubung
                                    ke akun ini.
                                </p>
                            </div>

                            <div className="space-y-5 p-6">
                                {/* Radio Options Mode Karyawan */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {[
                                        {
                                            value: "none",
                                            label: "Tanpa Karyawan",
                                            icon: null,
                                        },
                                        {
                                            value: "existing",
                                            label: "Tautkan Karyawan",
                                            icon: Link2,
                                        },
                                        {
                                            value: "new",
                                            label: "Buat Karyawan Baru",
                                            icon: UserPlus,
                                        },
                                    ].map((opt) => {
                                        const Icon = opt.icon;
                                        const isSelected =
                                            modeKaryawan === opt.value;
                                        return (
                                            <label
                                                key={opt.value}
                                                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                                    isSelected
                                                        ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm"
                                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    className="sr-only"
                                                    name="mode_karyawan"
                                                    value={opt.value}
                                                    checked={isSelected}
                                                    onChange={() =>
                                                        setModeKaryawan(
                                                            opt.value,
                                                        )
                                                    }
                                                />
                                                {Icon && (
                                                    <Icon className="h-4 w-4" />
                                                )}
                                                {opt.label}
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* Mode: Existing Karyawan */}
                                {modeKaryawan === "existing" && (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Pilih Karyawan (Belum Punya Akun)
                                        </label>
                                        <select
                                            value={data.karyawan_id}
                                            onChange={(e) =>
                                                set(
                                                    "karyawan_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.karyawan_id
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">
                                                -- Pilih Karyawan --
                                            </option>
                                            {karyawans.map((k) => (
                                                <option key={k.id} value={k.id}>
                                                    {k.nama} — {k.jabatan}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            Karyawan yang sudah memiliki akun
                                            lain tidak akan ditampilkan di
                                            daftar ini.
                                        </p>
                                        {errors.karyawan_id && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.karyawan_id}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Mode: New Karyawan */}
                                {modeKaryawan === "new" && (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                                    Nama Karyawan{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.new_nama}
                                                    onChange={(e) =>
                                                        set(
                                                            "new_nama",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                {errors[
                                                    "new_karyawan.nama"
                                                ] && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {
                                                            errors[
                                                                "new_karyawan.nama"
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                                    Jabatan{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.new_jabatan}
                                                    onChange={(e) =>
                                                        set(
                                                            "new_jabatan",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                {errors[
                                                    "new_karyawan.jabatan"
                                                ] && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {
                                                            errors[
                                                                "new_karyawan.jabatan"
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                                    Tipe Penggajian{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    value={data.new_tipe}
                                                    onChange={(e) =>
                                                        set(
                                                            "new_tipe",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <option value="tetap">
                                                        Karyawan Tetap (gaji
                                                        pokok)
                                                    </option>
                                                    <option value="harian">
                                                        Harian (rate per hari)
                                                    </option>
                                                    <option value="borongan_rit">
                                                        Borongan Per Rit
                                                    </option>
                                                </select>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Detail gaji/BPJS dapat
                                                    dikonfigurasi lebih lanjut
                                                    di modul SDM & Payroll.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                                    No. HP
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.new_no_hp}
                                                    onChange={(e) =>
                                                        set(
                                                            "new_no_hp",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={pending}
                                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {pending ? "Menyimpan..." : "Simpan User"}
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
