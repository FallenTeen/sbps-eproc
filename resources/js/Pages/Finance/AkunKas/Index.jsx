import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import {
    Plus,
    Edit,
    RefreshCw,
    Eye,
    Wallet,
    Trash2,
    ChartBarDecreasing,
    Save,
    ArrowLeft,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import Modal from "@/Components/Modal";

export default function Index({
    auth,
    akunKas,
    unit_bisnis_id,
    totalSaldo = 0,
    transferAccounts = [],
    unitBisnisList = [],
    filters,
    sort,
    direction,
}) {
    const [showingAddModal, setShowingAddModal] = useState(false);
    const [showingEditModal, setShowingEditModal] = useState(false);
    const [showingTransferModal, setShowingTransferModal] = useState(false);
    const [editingAkun, setEditingAkun] = useState(null);

    const { data, setData, post, put, reset, errors, processing } = useForm({
        unit_bisnis_id:
            unit_bisnis_id ||
            (unitBisnisList.length > 0 ? unitBisnisList[0].id : ""),
        nama: "",
        jenis_kas: "kas_operasional",
        saldo_awal: 0,
        aktif: true,
    });

    const transferForm = useForm({
        dari_akun_kas_bank_id: "",
        ke_akun_kas_bank_id: "",
        jumlah: "",
        tanggal: new Date().toISOString().split("T")[0],
        catatan: "",
    });

    const handleFilterChange = (e) => {
        const selectedUnit = e.target.value;
        const params = {};
        if (selectedUnit) params.unit_bisnis_id = selectedUnit;
        if (filters && Object.keys(filters).length) params.filters = filters;
        if (sort) {
            params.sort = sort;
            params.direction = direction;
        }
        router.get(route("finance.akun-kas.index"), params, {
            preserveState: true,
        });
        setData("unit_bisnis_id", selectedUnit);
    };

    const submitAdd = (e) => {
        e.preventDefault();
        post(route("finance.akun-kas.store"), {
            onSuccess: () => {
                setShowingAddModal(false);
                reset("nama", "saldo_awal");
            },
        });
    };

    const openEditModal = (akun) => {
        setEditingAkun(akun);
        setData({
            unit_bisnis_id: akun.unit_bisnis_id,
            nama: akun.nama,
            jenis_kas: akun.jenis_kas,
            aktif: akun.aktif,
        });
        setShowingEditModal(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        put(route("finance.akun-kas.update", editingAkun.id), {
            onSuccess: () => {
                setShowingEditModal(false);
                setEditingAkun(null);
            },
        });
    };

    const submitTransfer = (e) => {
        e.preventDefault();
        transferForm.post(route("finance.akun-kas.transfer"), {
            onSuccess: () => {
                setShowingTransferModal(false);
                transferForm.reset();
            },
        });
    };

    const columns = [
        {
            key: "nama",
            label: "Nama Akun",
            type: "text",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900",
        },
        {
            key: "jenis_kas",
            label: "Jenis",
            type: "select",
            options: [
                { value: "kas_kecil", label: "Kas Kecil" },
                { value: "kas_besar", label: "Kas Besar" },
                { value: "kas_operasional", label: "Kas Operasional" },
                { value: "bank", label: "Bank" },
            ],
            render: (akun) => (
                <span className="capitalize">
                    {akun.jenis_kas?.replace("_", " ")}
                </span>
            ),
        },
        {
            key: "saldo",
            label: "Saldo Saat Ini",
            search: false,
            sortable: false,
            align: "right",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-bold",
            render: (akun) =>
                `Rp ${Number(akun.saldo_saat_ini).toLocaleString("id-ID")}`,
        },
        {
            key: "aktif",
            label: "Status",
            type: "select",
            options: [
                { value: "1", label: "Aktif" },
                { value: "0", label: "Nonaktif" },
            ],
            align: "right",
            render: (akun) => (
                <span
                    className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${akun.aktif ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                    {akun.aktif ? "Aktif" : "Nonaktif"}
                </span>
            ),
        },
        {
            key: "aksi",
            label: "Aksi",
            search: false,
            sortable: false,
            align: "right",
            cellClassName:
                "px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-3",
            render: (akun) => (
                <>
                    <Link
                        href={route("finance.akun-kas.show", akun.id)}
                        className="inline-flex items-center text-gray-600 hover:text-gray-700 font-medium"
                        title="Detail Akun"
                    >
                        <Eye className="w-4 h-4 mr-1" /> Detail
                    </Link>
                    <Link
                        href={route("finance.akun-kas.mutasi", akun.id)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                        title="Lihat Mutasi"
                    >
                        <ChartBarDecreasing className="w-4 h-4 mr-1" /> Mutasi
                    </Link>
                    <button
                        onClick={() => openEditModal(akun)}
                        className="inline-flex items-center text-amber-500 hover:text-amber-600 font-medium"
                        title="Edit Akun"
                    >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                    </button>
                    <button
                        onClick={() => {
                            if (
                                window.confirm(
                                    `Yakin hapus akun "${akun.nama}"?`,
                                )
                            ) {
                                router.delete(
                                    route("finance.akun-kas.destroy", akun.id),
                                );
                            }
                        }}
                        className="inline-flex items-center text-red-600 hover:text-red-900 font-medium"
                        title="Hapus Akun"
                    >
                        <Trash2 className="w-4 h-4 mr-1" /> Hapus
                    </button>
                </>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            // header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Akun Kas & Bank</h2>}
        >
            <Head title="Akun Kas & Bank" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <div className="w-full sm:w-64">
                        <InputLabel
                            htmlFor="unit_bisnis_filter"
                            value="Filter Unit Bisnis"
                        />
                        <select
                            id="unit_bisnis_filter"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={unit_bisnis_id || ""}
                            onChange={handleFilterChange}
                        >
                            <option value="">-- Semua Unit Bisnis --</option>
                            {unitBisnisList.map((ub) => (
                                <option key={ub.id} value={ub.id}>
                                    {ub.nama}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                    <PrimaryButton
                        onClick={() => setShowingTransferModal(true)}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 border-blue-600"
                    >
                        <RefreshCw className="w-4 h-4" /> Transfer
                    </PrimaryButton>
                    <PrimaryButton
                        onClick={() => setShowingAddModal(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Tambah Akun
                    </PrimaryButton>
                </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Total Saldo Kas & Bank
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                            Rp {Number(totalSaldo).toLocaleString("id-ID")}
                        </p>
                    </div>
                </div>
                <span className="text-xs text-green-500 font-medium">
                    Total <span className="text-red-600">{akunKas.total}</span>{" "}
                    Akun
                </span>
            </div>

            <DataTable
                routeName="finance.akun-kas.index"
                baseParams={{ unit_bisnis_id }}
                columns={columns}
                rows={akunKas}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Belum ada data akun kas untuk unit bisnis ini."
            />

            {/* Modal Tambah Akun */}
            <Modal
                show={showingAddModal}
                onClose={() => setShowingAddModal(false)}
            >
                <form onSubmit={submitAdd} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Tambah Akun Kas / Bank Baru
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="modal_unit_bisnis_id"
                                value="Unit Bisnis"
                            />
                            <select
                                id="modal_unit_bisnis_id"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.unit_bisnis_id}
                                onChange={(e) =>
                                    setData("unit_bisnis_id", e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    -- Pilih Unit Bisnis --
                                </option>
                                {unitBisnisList.map((ub) => (
                                    <option key={ub.id} value={ub.id}>
                                        {ub.nama}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.unit_bisnis_id}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="nama" value="Nama Akun" />
                            <TextInput
                                id="nama"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.nama}
                                onChange={(e) =>
                                    setData("nama", e.target.value)
                                }
                                required
                                placeholder="Contoh: Kas Kecil Kantor, Bank BCA Operasional"
                            />
                            <InputError
                                message={errors.nama}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="jenis_kas" value="Jenis Kas" />
                            <select
                                id="jenis_kas"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.jenis_kas}
                                onChange={(e) =>
                                    setData("jenis_kas", e.target.value)
                                }
                                required
                            >
                                <option value="kas_kecil">Kas Kecil</option>
                                <option value="kas_besar">Kas Besar</option>
                                <option value="kas_operasional">
                                    Kas Operasional
                                </option>
                                <option value="bank">Bank</option>
                            </select>
                            <InputError
                                message={errors.jenis_kas}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="saldo_awal"
                                value="Saldo Awal (Rp)"
                            />
                            <TextInput
                                id="saldo_awal"
                                type="number"
                                className="mt-1 block w-full"
                                value={data.saldo_awal}
                                onChange={(e) =>
                                    setData("saldo_awal", e.target.value)
                                }
                                required
                                min="0"
                            />
                            <InputError
                                message={errors.saldo_awal}
                                className="mt-2"
                            />
                        </div>
                        <div className="flex items-center pt-2">
                            <input
                                id="aktif"
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={data.aktif}
                                onChange={(e) =>
                                    setData("aktif", e.target.checked)
                                }
                            />
                            <label
                                htmlFor="aktif"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                Aktif
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowingAddModal(false)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            <Save className="w-4 h-4" />
                            Simpan Akun
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Edit Akun */}
            <Modal
                show={showingEditModal}
                onClose={() => setShowingEditModal(false)}
            >
                <form onSubmit={submitEdit} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Edit Akun Kas / Bank
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="edit_nama" value="Nama Akun" />
                            <TextInput
                                id="edit_nama"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.nama}
                                onChange={(e) =>
                                    setData("nama", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.nama}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="edit_jenis_kas"
                                value="Jenis Kas"
                            />
                            <select
                                id="edit_jenis_kas"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.jenis_kas}
                                onChange={(e) =>
                                    setData("jenis_kas", e.target.value)
                                }
                                required
                            >
                                <option value="kas_kecil">Kas Kecil</option>
                                <option value="kas_besar">Kas Besar</option>
                                <option value="kas_operasional">
                                    Kas Operasional
                                </option>
                                <option value="bank">Bank</option>
                            </select>
                            <InputError
                                message={errors.jenis_kas}
                                className="mt-2"
                            />
                        </div>
                        <div className="flex items-center pt-2">
                            <input
                                id="edit_aktif"
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={data.aktif}
                                onChange={(e) =>
                                    setData("aktif", e.target.checked)
                                }
                            />
                            <label
                                htmlFor="edit_aktif"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                Aktif
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowingEditModal(false)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            <Save className="w-4 h-4" />
                            Simpan Perubahan
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Transfer Antar Kas */}
            <Modal
                show={showingTransferModal}
                onClose={() => setShowingTransferModal(false)}
            >
                <form onSubmit={submitTransfer} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Form Transfer Antar Kas
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="dari_akun_kas_bank_id"
                                value="Dari Akun (Sumber)"
                            />
                            <select
                                id="dari_akun_kas_bank_id"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={transferForm.data.dari_akun_kas_bank_id}
                                onChange={(e) =>
                                    transferForm.setData(
                                        "dari_akun_kas_bank_id",
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">
                                    -- Pilih Akun Sumber --
                                </option>
                                {transferAccounts.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.nama} (Saldo: Rp{" "}
                                        {Number(
                                            a.saldo_saat_ini,
                                        ).toLocaleString("id-ID")}
                                        )
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={
                                    transferForm.errors.dari_akun_kas_bank_id
                                }
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="ke_akun_kas_bank_id"
                                value="Ke Akun (Tujuan)"
                            />
                            <select
                                id="ke_akun_kas_bank_id"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={transferForm.data.ke_akun_kas_bank_id}
                                onChange={(e) =>
                                    transferForm.setData(
                                        "ke_akun_kas_bank_id",
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">
                                    -- Pilih Akun Tujuan --
                                </option>
                                {transferAccounts
                                    .filter(
                                        (a) =>
                                            a.id !==
                                            transferForm.data
                                                .dari_akun_kas_bank_id,
                                    )
                                    .map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.nama}
                                        </option>
                                    ))}
                            </select>
                            <InputError
                                message={
                                    transferForm.errors.ke_akun_kas_bank_id
                                }
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="jumlah_transfer"
                                value="Nominal Transfer (Rp)"
                            />
                            <TextInput
                                id="jumlah_transfer"
                                type="number"
                                className="mt-1 block w-full"
                                value={transferForm.data.jumlah}
                                onChange={(e) =>
                                    transferForm.setData(
                                        "jumlah",
                                        e.target.value,
                                    )
                                }
                                required
                                min="1"
                                placeholder="0"
                            />
                            <InputError
                                message={transferForm.errors.jumlah}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="tanggal_transfer"
                                value="Tanggal Transfer"
                            />
                            <TextInput
                                id="tanggal_transfer"
                                type="date"
                                className="mt-1 block w-full"
                                value={transferForm.data.tanggal}
                                onChange={(e) =>
                                    transferForm.setData(
                                        "tanggal",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            <InputError
                                message={transferForm.errors.tanggal}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="catatan_transfer"
                                value="Catatan (Opsional)"
                            />
                            <TextInput
                                id="catatan_transfer"
                                type="text"
                                className="mt-1 block w-full"
                                value={transferForm.data.catatan}
                                onChange={(e) =>
                                    transferForm.setData(
                                        "catatan",
                                        e.target.value,
                                    )
                                }
                                placeholder="Misal: Pengisian kas kecil operasional"
                            />
                            <InputError
                                message={transferForm.errors.catatan}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowingTransferModal(false)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={transferForm.processing}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Proses Transfer
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
