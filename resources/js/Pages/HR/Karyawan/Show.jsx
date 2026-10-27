import React, { useState } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Users,
    ArrowLeft,
    Briefcase,
    MapPin,
    Calendar,
    Save,
    Trash2,
    CheckCircle2,
    CreditCard,
    Edit,
} from "lucide-react";
import InputError from "@/Components/InputError";
import Modal from "@/Components/Modal";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import TitikSelectorWithMap from "@/Components/TitikSelectorWithMap";
import { formatTanggal } from "@/utils/date";

export default function Show({ karyawan, titiks }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        titik_id: "",
        tanggal_mulai: new Date().toISOString().split("T")[0],
    });

    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);

    const submitAssign = (e) => {
        e.preventDefault();
        post(route("hr.karyawan.assign-titik", karyawan.id), {
            onSuccess: () => reset(),
        });
    };

    const confirmDelete = (assignmentId) => {
        setAssignmentToDelete(assignmentId);
        setConfirmingDeletion(true);
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
        setAssignmentToDelete(null);
    };

    const deleteAssignment = (e) => {
        e.preventDefault();
        router.post(
            route("hr.karyawan.remove-titik", karyawan.id),
            {
                assignment_id: assignmentToDelete,
            },
            {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            },
        );
    };

    const formatCurrency = (amount) => {
        if (!amount) return "-";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Detail Karyawan - ${karyawan?.nama ?? ""}`} />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header Action Card */}
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-800">
                                    {karyawan?.nama}
                                </h1>
                                {karyawan?.alias && (
                                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 border border-blue-200">
                                        alias "{karyawan.alias}"
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {karyawan?.jabatan || "-"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href={route("hr.karyawan.edit", karyawan.id)}
                            className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
                        >
                            <Edit className="w-4 h-4"/>
                            Edit Data
                        </Link>
                        <Link href={route("hr.karyawan.index")}>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Layout Grid 3 Kolom */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Kolom Kiri: Informasi Kepegawaian & Administrasi */}
                    <div className="space-y-6 md:col-span-1">
                        {/* Info Kepegawaian */}
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-semibold text-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                    <Briefcase className="h-4 w-4 text-blue-600" />
                                </span>
                                Informasi Kepegawaian
                            </h2>

                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-xs font-medium text-slate-400">
                                        Tipe Karyawan
                                    </dt>
                                    <dd className="mt-1 text-sm font-semibold text-slate-800 capitalize">
                                        {karyawan?.tipe?.replace("_", " ") ??
                                            "-"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-xs font-medium text-slate-400">
                                        Status Aktif
                                    </dt>
                                    <dd className="mt-1.5">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                karyawan?.status === "aktif"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {karyawan?.status === "aktif"
                                                ? "Aktif"
                                                : "Non-Aktif"}
                                        </span>
                                    </dd>
                                </div>

                                {karyawan?.tipe === "tetap" && (
                                    <div>
                                        <dt className="text-xs font-medium text-slate-400">
                                            Rate Gaji Pokok
                                        </dt>
                                        <dd className="mt-1 text-sm font-semibold text-slate-800">
                                            {formatCurrency(
                                                karyawan.rate_gaji_pokok,
                                            )}{" "}
                                            / bulan
                                        </dd>
                                    </div>
                                )}

                                {karyawan?.tipe === "harian" && (
                                    <div>
                                        <dt className="text-xs font-medium text-slate-400">
                                            Rate Harian
                                        </dt>
                                        <dd className="mt-1 text-sm font-semibold text-slate-800">
                                            {formatCurrency(
                                                karyawan.rate_harian,
                                            )}{" "}
                                            / hari
                                        </dd>
                                    </div>
                                )}

                                <div>
                                    <dt className="text-xs font-medium text-slate-400">
                                        No. HP
                                    </dt>
                                    <dd className="mt-1 text-sm font-medium text-slate-800">
                                        {karyawan?.no_hp || "-"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-xs font-medium text-slate-400">
                                        Akun Login
                                    </dt>
                                    <dd className="mt-1 text-sm font-medium text-slate-800">
                                        {karyawan?.user?.email ? (
                                            <span className="text-blue-600 font-semibold">
                                                {karyawan.user.email}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">
                                                Belum ditautkan
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        {/* Administrasi & Pajak */}
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-semibold text-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                    <CreditCard className="h-4 w-4 text-blue-600" />
                                </span>
                                Administrasi & Pajak
                            </h2>

                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-xs font-medium text-slate-400">
                                        Status PTKP
                                    </dt>
                                    <dd className="mt-1 text-sm font-semibold uppercase text-slate-800">
                                        {karyawan?.status_ptkp || "-"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-xs font-medium text-slate-400">
                                        NPWP
                                    </dt>
                                    <dd className="mt-1 text-sm font-medium text-slate-800">
                                        {karyawan?.npwp || "-"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-xs font-medium text-slate-400">
                                        BPJS Kesehatan
                                    </dt>
                                    <dd className="mt-1 text-sm font-medium text-slate-800">
                                        {karyawan?.no_bpjs_kesehatan || "-"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-xs font-medium text-slate-400">
                                        BPJS Ketenagakerjaan
                                    </dt>
                                    <dd className="mt-1 text-sm font-medium text-slate-800">
                                        {karyawan?.no_bpjs_ketenagakerjaan ||
                                            "-"}
                                    </dd>
                                </div>
                            </dl>
                        </section>
                    </div>

                    {/* Kolom Kanan: Form Penugasan & Tabel Riwayat */}
                    <div className="space-y-6 md:col-span-2">
                        {/* Form Assign Titik Baru */}
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                    </span>
                                    Penugasan Lokasi (Titik)
                                </h2>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Penugasan titik baru akan otomatis
                                    menutup/mengakhiri penugasan yang masih
                                    aktif saat ini.
                                </p>
                            </div>

                            <form
                                onSubmit={submitAssign}
                                className="space-y-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4"
                            >
                                <div className="w-full">
                                    <TitikSelectorWithMap
                                        id="titik_id"
                                        name="titik_id"
                                        titiks={titiks}
                                        value={data.titik_id}
                                        onChange={(val) =>
                                            setData("titik_id", val)
                                        }
                                        error={errors.titik_id}
                                        label="Pilih Titik Lokasi"
                                        placeholder="-- Pilih Titik --"
                                        required={true}
                                        mapHeight="240px"
                                    />
                                </div>

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                    <div className="w-full sm:w-56">
                                        <label
                                            htmlFor="tanggal_mulai"
                                            className="mb-1.5 block text-xs font-medium text-gray-700"
                                        >
                                            Tgl. Mulai Berlaku{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            id="tanggal_mulai"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            value={data.tanggal_mulai}
                                            onChange={(e) =>
                                                setData(
                                                    "tanggal_mulai",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            message={errors.tanggal_mulai}
                                            className="mt-1 text-xs text-red-600"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex h-[40px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        {processing
                                            ? "Menugaskan..."
                                            : "Assign Titik"}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Tabel Riwayat Assignment */}
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                    </span>
                                    Riwayat Penugasan
                                </h2>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Lokasi / Titik
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Periode
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {karyawan?.assignments &&
                                        karyawan.assignments.length > 0 ? (
                                            karyawan.assignments.map(
                                                (assignment) => {
                                                    const isAktif =
                                                        assignment.status ===
                                                        "aktif";
                                                    return (
                                                        <tr
                                                            key={assignment.id}
                                                            className={
                                                                isAktif
                                                                    ? "bg-blue-50/40"
                                                                    : "hover:bg-slate-50"
                                                            }
                                                        >
                                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-800">
                                                                <div className="flex items-center gap-1.5">
                                                                    {isAktif && (
                                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                    )}
                                                                    {
                                                                        assignment
                                                                            .titik
                                                                            ?.nama
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                                                {formatTanggal(
                                                                    assignment.tanggal_mulai,
                                                                )}{" "}
                                                                -{" "}
                                                                {assignment.tanggal_selesai
                                                                    ? formatTanggal(
                                                                          assignment.tanggal_selesai,
                                                                      )
                                                                    : "Sekarang"}
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                        isAktif
                                                                            ? "bg-emerald-100 text-emerald-800"
                                                                            : "bg-slate-100 text-slate-600"
                                                                    }`}
                                                                >
                                                                    {isAktif
                                                                        ? "Aktif"
                                                                        : "Selesai"}
                                                                </span>
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        confirmDelete(
                                                                            assignment.id,
                                                                        )
                                                                    }
                                                                    className="rounded p-1 text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="px-4 py-8 text-center text-sm italic text-slate-400"
                                                >
                                                    Belum ada riwayat penugasan
                                                    untuk karyawan ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Modal Konfirmasi Hapus */}
                <Modal show={confirmingDeletion} onClose={closeModal}>
                    <form onSubmit={deleteAssignment} className="p-6">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Hapus Riwayat Penugasan?
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Apakah Anda yakin ingin menghapus data penugasan ini
                            secara permanen?
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton onClick={closeModal}>
                                Batal
                            </SecondaryButton>

                            <DangerButton disabled={processing}>
                                Hapus Penugasan
                            </DangerButton>
                        </div>
                    </form>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
