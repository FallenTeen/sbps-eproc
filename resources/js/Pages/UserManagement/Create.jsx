import React, { useMemo, useState } from "react";
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from "@headlessui/react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeft,
    Briefcase,
    Check,
    ChevronsUpDown,
    Eye,
    EyeOff,
    KeyRound,
    Link2,
    LockKeyhole,
    Mail,
    Save,
    UserPlus,
    Users,
} from "lucide-react";

const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const readOnlyClass =
    "w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-700";

const tipeLabels = {
    tetap: "Karyawan tetap",
    harian: "Harian",
    borongan_rit: "Borongan per rit",
};
const JABATAN_LAINNYA = "__jabatan_lainnya__";

const modes = [
    {
        value: "none",
        title: "Akun saja",
        description: "Hanya email dan password untuk login.",
        icon: LockKeyhole,
    },
    {
        value: "existing",
        title: "Tautkan karyawan",
        description: "Hubungkan ke profil karyawan yang sudah ada.",
        icon: Link2,
    },
    {
        value: "new",
        title: "Akun + karyawan baru",
        description: "Buat akun dan profil karyawan sekaligus.",
        icon: UserPlus,
    },
];

function SectionCard({ icon: Icon, title, subtitle, badge, children }) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                <div className="flex items-center gap-3">
                    <Icon
                        className="h-5 w-5 shrink-0 text-gray-600"
                        aria-hidden="true"
                    />
                    <div>
                        <h2 className="font-semibold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    </div>
                </div>
                {badge}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Required() {
    return <span className="text-red-500"> *</span>;
}

function FieldError({ children }) {
    if (!children) return null;

    return (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
            {children}
        </p>
    );
}

function ReadOnlyField({ label, value }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <input
                className={readOnlyClass}
                value={value || "-"}
                readOnly
                aria-readonly="true"
            />
        </div>
    );
}

export default function Create({
    karyawans = [],
    roles = ["user"],
    jabatanOptions = [],
}) {
    const { data, setData, post, errors, processing, transform, clearErrors } =
        useForm({
            email: "",
            password: "",
            name: "",
            role: "user",
            new_tipe: "tetap",
            new_jabatan: "",
            new_jabatan_custom: "",
            new_no_hp: "",
        });

    const [modeKaryawan, setModeKaryawan] = useState("none");
    const [selectedKaryawan, setSelectedKaryawan] = useState(null);
    const [employeeQuery, setEmployeeQuery] = useState("");
    const [selectionError, setSelectionError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const filteredKaryawans = useMemo(() => {
        const query = employeeQuery.trim().toLocaleLowerCase();
        if (!query) return karyawans;

        return karyawans.filter((karyawan) =>
            [karyawan.nama, karyawan.jabatan, karyawan.no_hp, karyawan.tipe]
                .filter(Boolean)
                .some((value) =>
                    String(value).toLocaleLowerCase().includes(query),
                ),
        );
    }, [employeeQuery, karyawans]);

    const changeMode = (mode) => {
        setModeKaryawan(mode);
        setSelectedKaryawan(null);
        setEmployeeQuery("");
        setSelectionError("");
        clearErrors();
        setData((current) => ({
            ...current,
            name: "",
            new_jabatan: "",
            new_jabatan_custom: "",
            new_no_hp: "",
            new_tipe: "tetap",
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (modeKaryawan === "existing" && !selectedKaryawan) {
            setSelectionError("Pilih karyawan yang akan ditautkan.");
            return;
        }

        transform((current) => {
            const payload = {
                email: current.email,
                password: current.password,
                karyawan_id:
                    modeKaryawan === "existing" ? selectedKaryawan.id : "",
            };

            if (modeKaryawan !== "none") {
                payload.role = current.role;
            }

            if (modeKaryawan === "new") {
                payload.new_karyawan = {
                    nama: current.name,
                    tipe: current.new_tipe,
                    jabatan:
                        current.new_jabatan === JABATAN_LAINNYA
                            ? current.new_jabatan_custom
                            : current.new_jabatan,
                    no_hp: current.new_no_hp,
                };
            }

            return payload;
        });

        post(route("users.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Akun" />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Tambah Akun
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Buat akun login saja, tautkan ke karyawan yang sudah
                        ada, atau buat keduanya sekaligus.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Jenis akun */}
                    <SectionCard
                        icon={Users}
                        title="Jenis Akun"
                        subtitle="Akun baru menggunakan akses standar tanpa izin khusus"
                    >
                        <fieldset>
                            <legend className="sr-only">
                                Untuk siapa akun ini?
                            </legend>
                            <div className="grid gap-4 md:grid-cols-3">
                                {modes.map((mode) => {
                                    const Icon = mode.icon;
                                    const selected =
                                        modeKaryawan === mode.value;

                                    return (
                                        <label
                                            key={mode.value}
                                            className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition focus-within:ring-2 focus-within:ring-blue-100 ${
                                                selected
                                                    ? "border-blue-500 bg-blue-50/50"
                                                    : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="mode_karyawan"
                                                value={mode.value}
                                                checked={selected}
                                                onChange={() =>
                                                    changeMode(mode.value)
                                                }
                                                className="sr-only"
                                            />
                                            <Icon
                                                className={`mt-0.5 h-4 w-4 shrink-0 ${
                                                    selected
                                                        ? "text-blue-700"
                                                        : "text-gray-500"
                                                }`}
                                                aria-hidden="true"
                                            />
                                            <span className="min-w-0 pr-5">
                                                <span className="block text-sm font-semibold text-gray-900">
                                                    {mode.title}
                                                </span>
                                                <span className="mt-0.5 block text-sm leading-5 text-gray-500">
                                                    {mode.description}
                                                </span>
                                            </span>
                                            {selected && (
                                                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                                                    <Check
                                                        className="h-3 w-3"
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>
                    </SectionCard>

                    {/* Mode: tautkan karyawan */}
                    {modeKaryawan === "existing" && (
                        <SectionCard
                            icon={Link2}
                            title="Karyawan yang Ditautkan"
                            subtitle="Cari berdasarkan nama, jabatan, atau nomor HP"
                            badge={
                                selectedKaryawan && (
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                                        Terpilih
                                    </span>
                                )
                            }
                        >
                            <label htmlFor="karyawan-search" className={labelClass}>
                                Karyawan <Required />
                            </label>
                            <Combobox
                                value={selectedKaryawan}
                                onChange={(karyawan) => {
                                    setSelectedKaryawan(karyawan);
                                    setSelectionError("");
                                    setData("name", karyawan?.nama ?? "");
                                }}
                            >
                                <div className="relative">
                                    <ComboboxInput
                                        id="karyawan-search"
                                        displayValue={(karyawan) =>
                                            karyawan?.nama ?? ""
                                        }
                                        onChange={(event) => {
                                            setEmployeeQuery(
                                                event.target.value,
                                            );
                                            setSelectedKaryawan(null);
                                            setData("name", "");
                                        }}
                                        placeholder="Ketik nama, jabatan, atau nomor HP"
                                        className={`${inputClass} pr-10`}
                                        autoComplete="off"
                                        aria-describedby="karyawan-search-help"
                                    />
                                    <ComboboxButton className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200">
                                        <ChevronsUpDown
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    </ComboboxButton>
                                    <ComboboxOptions
                                        anchor="bottom"
                                        className="z-20 max-h-60 w-[var(--input-width)] overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg [--anchor-gap:6px] empty:invisible"
                                    >
                                        {filteredKaryawans.map((karyawan) => (
                                            <ComboboxOption
                                                key={karyawan.id}
                                                value={karyawan}
                                                className={({ focus }) =>
                                                    `flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-sm ${
                                                        focus
                                                            ? "bg-blue-50 text-blue-900"
                                                            : "text-gray-800"
                                                    }`
                                                }
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className="min-w-0">
                                                            <span className="block truncate font-medium">
                                                                {karyawan.nama}
                                                            </span>
                                                            <span className="mt-0.5 block truncate text-gray-500">
                                                                {karyawan.jabatan}
                                                                {karyawan.no_hp
                                                                    ? ` · ${karyawan.no_hp}`
                                                                    : ""}
                                                            </span>
                                                        </span>
                                                        {selected && (
                                                            <Check
                                                                className="ml-3 h-4 w-4 shrink-0 text-blue-600"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </ComboboxOption>
                                        ))}
                                        {filteredKaryawans.length === 0 && (
                                            <p className="px-3 py-2.5 text-sm text-gray-500">
                                                Tidak ada karyawan yang cocok.
                                            </p>
                                        )}
                                    </ComboboxOptions>
                                </div>
                            </Combobox>
                            <p
                                id="karyawan-search-help"
                                className="mt-1.5 text-sm text-gray-500"
                            >
                                Hanya karyawan aktif yang belum memiliki akun
                                yang ditampilkan.
                            </p>
                            <FieldError>
                                {selectionError || errors.karyawan_id}
                            </FieldError>

                            {selectedKaryawan && (
                                <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-700">
                                        Data karyawan
                                        <span className="ml-2 font-normal text-gray-500">
                                            (terisi otomatis, tidak dapat
                                            diubah di sini)
                                        </span>
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <ReadOnlyField
                                            label="Nama lengkap"
                                            value={selectedKaryawan.nama}
                                        />
                                        <ReadOnlyField
                                            label="Jabatan"
                                            value={selectedKaryawan.jabatan}
                                        />
                                        <ReadOnlyField
                                            label="Tipe karyawan"
                                            value={
                                                tipeLabels[
                                                    selectedKaryawan.tipe
                                                ] ?? selectedKaryawan.tipe
                                            }
                                        />
                                        <ReadOnlyField
                                            label="Nomor HP"
                                            value={selectedKaryawan.no_hp}
                                        />
                                    </div>
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {/* Mode: karyawan baru */}
                    {modeKaryawan === "new" && (
                        <SectionCard
                            icon={Briefcase}
                            title="Data Karyawan"
                            subtitle="Profil karyawan yang akan dibuat bersama akun"
                        >
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label
                                        htmlFor="account-name"
                                        className={labelClass}
                                    >
                                        Nama Lengkap <Required />
                                    </label>
                                    <input
                                        id="account-name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        className={inputClass}
                                        placeholder="Masukkan nama lengkap"
                                        autoComplete="name"
                                        required
                                        maxLength={255}
                                    />
                                    <FieldError>
                                        {errors["new_karyawan.nama"]}
                                    </FieldError>
                                </div>

                                <div>
                                    <label
                                        htmlFor="employee-title"
                                        className={labelClass}
                                    >
                                        Jabatan <Required />
                                    </label>
                                    <select
                                        id="employee-title"
                                        value={data.new_jabatan}
                                        onChange={(e) =>
                                            setData("new_jabatan", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    >
                                        <option value="">
                                            Pilih jabatan
                                        </option>
                                        {jabatanOptions.map((jabatan) => (
                                            <option key={jabatan} value={jabatan}>
                                                {jabatan}
                                            </option>
                                        ))}
                                        <option value={JABATAN_LAINNYA}>
                                            Jabatan lainnya
                                        </option>
                                    </select>
                                    {data.new_jabatan === JABATAN_LAINNYA && (
                                        <input
                                            type="text"
                                            value={data.new_jabatan_custom}
                                            onChange={(e) =>
                                                setData(
                                                    "new_jabatan_custom",
                                                    e.target.value,
                                                )
                                            }
                                            className={`${inputClass} mt-3`}
                                            placeholder="Masukkan jabatan"
                                            required
                                            maxLength={100}
                                            aria-label="Jabatan lainnya"
                                        />
                                    )}
                                    <FieldError>
                                        {errors["new_karyawan.jabatan"]}
                                    </FieldError>
                                </div>

                                <div>
                                    <label
                                        htmlFor="employee-type"
                                        className={labelClass}
                                    >
                                        Tipe Karyawan <Required />
                                    </label>
                                    <select
                                        id="employee-type"
                                        value={data.new_tipe}
                                        onChange={(e) =>
                                            setData("new_tipe", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    >
                                        {Object.entries(tipeLabels).map(
                                            ([value, label]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <FieldError>
                                        {errors["new_karyawan.tipe"]}
                                    </FieldError>
                                </div>

                                <div>
                                    <label
                                        htmlFor="employee-phone"
                                        className={labelClass}
                                    >
                                        Nomor HP
                                    </label>
                                    <input
                                        id="employee-phone"
                                        type="tel"
                                        value={data.new_no_hp}
                                        onChange={(e) =>
                                            setData("new_no_hp", e.target.value)
                                        }
                                        className={inputClass}
                                        placeholder="Contoh: 08123456789"
                                        autoComplete="tel"
                                        maxLength={30}
                                    />
                                    <FieldError>
                                        {errors["new_karyawan.no_hp"]}
                                    </FieldError>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* Informasi login */}
                    <SectionCard
                        icon={KeyRound}
                        title="Informasi Login"
                        subtitle={
                            modeKaryawan === "none"
                                ? "Email dan password untuk login. Akun saja menggunakan role standar user."
                                : "Email dan password untuk login. Role akun mengatur izin akses."
                        }
                    >
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="account-email"
                                    className={labelClass}
                                >
                                    Email <Required />
                                </label>
                                <div className="relative">
                                    <Mail
                                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="account-email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        className={`${inputClass} pl-10`}
                                        placeholder="nama@perusahaan.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                                <FieldError>{errors.email}</FieldError>
                            </div>

                            <div>
                                <label
                                    htmlFor="account-password"
                                    className={labelClass}
                                >
                                    Password <Required />
                                </label>
                                <div className="relative">
                                    <LockKeyhole
                                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="account-password"
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        className={`${inputClass} pl-10 pr-11`}
                                        placeholder="Minimal 8 karakter"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((value) => !value)
                                        }
                                        className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-lg text-gray-400 transition hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                                        aria-label={
                                            showPassword
                                                ? "Sembunyikan password"
                                                : "Tampilkan password"
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Eye
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                </div>
                                <FieldError>{errors.password}</FieldError>
                            </div>

                            {modeKaryawan !== "none" && (
                                <div className="md:col-span-2">
                                    <label
                                        htmlFor="account-role"
                                        className={labelClass}
                                    >
                                        Role akun (izin akses) <Required />
                                    </label>
                                    <select
                                        id="account-role"
                                        value={data.role}
                                        onChange={(e) =>
                                            setData("role", e.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    >
                                        <option value="">
                                            Pilih role akun
                                        </option>
                                        {roles.map((role) => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-sm text-gray-500">
                                        Role ini menentukan izin akun dan
                                        berbeda dari jabatan karyawan.
                                    </p>
                                    <FieldError>{errors.role}</FieldError>
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    {/* Tombol aksi */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" aria-hidden="true" />
                            {processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
