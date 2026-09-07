import React, { useEffect, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";

export default function Create({ titiks, bahanBakus, titik_id, tanggal, kategori }) {
    const { auth } = usePage().props;
    const canManage = auth?.permissions?.includes("manage stok opname") || auth?.permissions?.includes("manage procurement");

    const [formTitik, setFormTitik] = useState(titik_id || "");
    const [formTanggal, setFormTanggal] = useState(tanggal || new Date().toISOString().split("T")[0]);
    const [formKategori, setFormKategori] = useState(kategori || "");

    const [checked, setChecked] = useState(() => {
        const obj = {};
        bahanBakus.forEach((b) => (obj[b.id] = b.opname_lama ? b.opname_lama.saldo_fisik : ""));
        return obj;
    });

    const [notes, setNotes] = useState(() => {
        const obj = {};
        bahanBakus.forEach((b) => (obj[b.id] = b.opname_lama?.catatan || ""));
        return obj;
    });

    const { data, setData, post, processing, errors } = useForm({
        titik_id: titik_id || "",
        tanggal: tanggal || new Date().toISOString().split("T")[0],
        items: [],
    });

    useEffect(() => {
        const checkObj = {};
        const notesObj = {};
        bahanBakus.forEach((b) => {
            checkObj[b.id] = b.opname_lama ? b.opname_lama.saldo_fisik : "";
            notesObj[b.id] = b.opname_lama?.catatan || "";
        });
        setChecked(checkObj);
        setNotes(notesObj);
    }, [bahanBakus]);

    const loadItems = () => {
        router.get(
            route("inventory.stok-opname.create"),
            { titik_id: formTitik, tanggal: formTanggal, kategori: formKategori },
            { preserveState: true, preserveScroll: true }
        );
    };

    const submit = (e) => {
        e.preventDefault();
        const items = bahanBakus
            .filter((b) => checked[b.id] !== "")
            .map((b) => ({
                bahan_baku_id: b.id,
                saldo_fisik: checked[b.id],
                catatan: notes[b.id] || null,
            }));

        if (items.length === 0) {
            window.alert("Isi minimal satu saldo fisik sebelum menyimpan.");
            return;
        }

        setData("titik_id", formTitik);
        setData("tanggal", formTanggal);
        setData("items", items);
        post(route("inventory.stok-opname.store"), {
            preserveScroll: true,
        });
    };

    if (!canManage) {
        return (
            <AuthenticatedLayout>
                <p className="text-center text-gray-500 py-12">Anda tidak berhak mencatat stok opname.</p>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Catat Stok Opname" />

            <div className="mb-6 flex items-center gap-4">
                <Link
                    href={route("inventory.stok-opname.index")}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Catat Stok Opname</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Isi saldo fisik; saldo sistem dihitung otomatis saat disimpan.
                    </p>
                </div>
            </div>

            {/* Pilihan titik/tanggal/kategori -> muat daftar item */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    loadItems();
                }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titik *</label>
                        <select
                            value={formTitik}
                            onChange={(e) => setFormTitik(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        >
                            <option value="">Pilih Titik</option>
                            {titiks.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nama}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                        <input
                            type="date"
                            value={formTanggal}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setFormTanggal(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                            value={formKategori}
                            onChange={(e) => setFormKategori(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Semua</option>
                            <option value="bahan_baku">Bahan Baku</option>
                            <option value="sparepart">Sparepart</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700"
                    >
                        <RefreshCw className="w-4 h-4" /> Muat Item
                    </button>
                </div>
                {!titiks.some((t) => t.id === formTitik) && (
                    <p className="text-xs text-gray-500 mt-2">
                        Pilih titik & kategori lalu "Muat Item" untuk melihat saldo sistem otomatis.
                    </p>
                )}
            </form>

            {/* Daftar item + input saldo fisik */}
            <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Kategori</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Satuan</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Saldo Sistem</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Saldo Fisik</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Catatan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {bahanBakus.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                    Tidak ada item aktif (atau filter kategori kosong). Atur filter lalu "Muat Item".
                                </td>
                            </tr>
                        ) : (
                            bahanBakus.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-sm text-gray-900">
                                        {b.nama}
                                        <span className="block text-xs text-gray-400">{b.kode}</span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">
                                        {b.kategori === "sparepart" ? "Sparepart" : "Bahan Baku"}
                                    </td>
                                    <td className="px-6 py-3 text-right text-sm text-gray-600">{b.satuan}</td>
                                    <td className="px-6 py-3 text-right text-sm tabular-nums text-gray-700">
                                        {b.stok_sistem === null ? "-" : b.stok_sistem}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={checked[b.id]}
                                            placeholder="-"
                                            onChange={(e) => setChecked((prev) => ({ ...prev, [b.id]: e.target.value }))}
                                            className="w-32 text-right border border-gray-300 rounded-md px-2 py-1.5 tabular-nums"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="text"
                                            value={notes[b.id]}
                                            placeholder="Catatan (opsional)"
                                            onChange={(e) => setNotes((prev) => ({ ...prev, [b.id]: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="px-6 py-4 flex justify-end gap-3">
                    <Link
                        href={route("inventory.stok-opname.index")}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> Simpan Opname
                    </button>
                </div>
                {errors.items && (
                    <div className="px-6 pb-4">
                        <p className="text-sm text-red-600">{errors.items}</p>
                    </div>
                )}
            </form>
        </AuthenticatedLayout>
    );
}