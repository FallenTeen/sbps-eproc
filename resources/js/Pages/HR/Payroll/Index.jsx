import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Calculator,
    CalendarDays,
    CheckCircle2,
    Clock,
    Eye,
    Play,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";

export default function Index({ periodes }) {
    const [showingGenerateModal, setShowingGenerateModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        bulan: new Date().getMonth() + 1,
        tahun: new Date().getFullYear(),
    });

    const submitGenerate = (e) => {
        e.preventDefault();
        post(route("hr.payroll.generate"), {
            onSuccess: () => {
                setShowingGenerateModal(false);
                reset();
            },
        });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "-";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    };

    const getBulanName = (bulanNumber) => {
        const date = new Date();
        date.setMonth(bulanNumber - 1);
        return date.toLocaleString("id-ID", { month: "long" });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Payroll" />

            <div className="max-w-7xl mx-auto">
                {/* Header Action */}
                <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Calculator className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Payroll & Penggajian
                            </h3>
                            <p className="text-sm text-gray-500">
                                Daftar payroll bulanan karyawan
                            </p>
                        </div>
                    </div>
                    <PrimaryButton
                        onClick={() => setShowingGenerateModal(true)}
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Generate Payroll
                    </PrimaryButton>
                </div>

                {/* Table */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Periode
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jumlah Karyawan
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Pembayaran Netto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {periodes.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <CalendarDays className="h-5 w-5 text-green-500 mr-2" />
                                                <div className="text-sm font-medium text-gray-900">
                                                    {getBulanName(
                                                        p.periode_bulan,
                                                    )}{" "}
                                                    {p.periode_tahun}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm text-gray-900 font-medium bg-red-100 px-3 py-1 rounded-full">
                                                {p.jumlah_karyawan} Orang
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-gray-900">
                                                {formatCurrency(p.total_gaji)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full flex items-center w-fit gap-1 ${
                                                    p.status === "dibayar"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-amber-100 text-amber-800"
                                                }`}
                                            >
                                                {p.status === "dibayar" ? (
                                                    <CheckCircle2 className="w-3 h-3" />
                                                ) : (
                                                    <Clock className="w-3 h-3" />
                                                )}
                                                {p.status === "dibayar"
                                                    ? "Dibayar"
                                                    : "Draft / Pending"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={route("hr.payroll.show", {
                                                    bulan: p.periode_bulan,
                                                    tahun: p.periode_tahun,
                                                })}
                                                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700"
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span>Detail</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {periodes.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            Belum ada data payroll yang
                                            digenerate.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Generate Payroll */}
            <Modal
                show={showingGenerateModal}
                onClose={() => setShowingGenerateModal(false)}
            >
                <form onSubmit={submitGenerate} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                        <Play className="w-5 h-5 mr-2 text-indigo-600" />
                        Generate Payroll Baru
                    </h2>

                    <p className="mt-1 text-sm text-gray-600 mb-6">
                        Fitur ini akan menghitung gaji pokok, akumulasi ritase,
                        dan kehadiran secara otomatis untuk seluruh karyawan
                        aktif pada bulan dan tahun yang Anda tentukan.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <InputLabel htmlFor="bulan" value="Bulan" />
                            <select
                                id="bulan"
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.bulan}
                                onChange={(e) =>
                                    setData("bulan", e.target.value)
                                }
                            >
                                {Array.from(
                                    { length: 12 },
                                    (_, i) => i + 1,
                                ).map((m) => (
                                    <option key={m} value={m}>
                                        {getBulanName(m)}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.bulan}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="tahun" value="Tahun" />
                            <input
                                id="tahun"
                                type="number"
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.tahun}
                                onChange={(e) =>
                                    setData("tahun", e.target.value)
                                }
                            />
                            <InputError
                                message={errors.tahun}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton
                            onClick={() => setShowingGenerateModal(false)}
                        >
                            Batal
                        </SecondaryButton>

                        <PrimaryButton className="ml-3" disabled={processing}>
                            <Play className="w-4 h-4 mr-2" />
                            Mulai Generate
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
