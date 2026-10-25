import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { ArrowLeft, CheckSquare, Square, Save, CreditCard } from "lucide-react";
import axios from "axios";

export default function Create({ unitBisnisList = [], proyekList = [] }) {
    const [unbilledItems, setUnbilledItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const todayStr = new Date().toISOString().split("T")[0];
    const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const { data, setData, post, processing, errors } = useForm({
        unit_bisnis_id: unitBisnisList.length > 0 ? String(unitBisnisList[0].id) : "",
        proyek_id: "",
        sumber_tagihan: "ritase",
        item_ids: [],
        tanggal_terbit: todayStr,
        tanggal_jatuh_tempo: defaultDueDate,
        catatan: "",
    });

    const filteredProyek = proyekList.filter(
        (p) => !data.unit_bisnis_id || String(p.unit_bisnis_id) === String(data.unit_bisnis_id)
    );

    // Fetch unbilled items saat filter berubah
    useEffect(() => {
        if (!data.unit_bisnis_id) return;
        setLoadingItems(true);

        axios
            .get(route("finance.invoice.unbilled-items"), {
                params: {
                    unit_bisnis_id: data.unit_bisnis_id,
                    proyek_id: data.proyek_id,
                    sumber_tagihan: data.sumber_tagihan,
                },
            })
            .then((res) => {
                if (res.data.success) {
                    const items = res.data.items || [];
                    setUnbilledItems(items);
                    // Konversi ID ke string agar sesuai validasi string di backend
                    const allIds = items.map((i) => String(i.id));
                    setData("item_ids", allIds);
                }
            })
            .catch((err) => {
                console.error("Error fetching unbilled items:", err);
                setUnbilledItems([]);
                setData("item_ids", []);
            })
            .finally(() => {
                setLoadingItems(false);
            });
    }, [data.unit_bisnis_id, data.proyek_id, data.sumber_tagihan]);

    // Handle toggle item individual
    const toggleSelectItem = (id) => {
        const stringId = String(id);
        const exists = data.item_ids.includes(stringId);
        const updated = exists
            ? data.item_ids.filter((i) => i !== stringId)
            : [...data.item_ids, stringId];

        setData("item_ids", updated);
    };

    // Handle select all / deselect all
    const toggleSelectAll = () => {
        if (data.item_ids.length === unbilledItems.length) {
            setData("item_ids", []);
        } else {
            const allIds = unbilledItems.map((i) => String(i.id));
            setData("item_ids", allIds);
        }
    };

    // Hitung total estimasi harga dari item yang dipilih
    const selectedItems = unbilledItems.filter((i) =>
        data.item_ids.includes(String(i.id))
    );
    const totalEstimasi = selectedItems.reduce(
        (acc, curr) => acc + (Number(curr.subtotal) || 0),
        0
    );

    const submit = (e) => {
        e.preventDefault();
        post(route("finance.invoice.store"));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Buat Invoice" />

            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Buat Invoice
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Tambahkan informasi utama dan detail transaksi invoice.
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Section 1: Informasi Invoice */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Informasi Invoice
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Lengkapi unit bisnis, proyek, sumber tagihan, dan batas waktu pembayaran.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5 p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                    {/* Unit Bisnis */}
                                    <div>
                                        <label htmlFor="unit_bisnis_id" className="mb-2 block text-sm font-medium text-gray-700">
                                            Unit Bisnis <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="unit_bisnis_id"
                                            value={data.unit_bisnis_id}
                                            onChange={(e) => setData("unit_bisnis_id", e.target.value)}
                                            required
                                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.unit_bisnis_id
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">-- Pilih Unit Bisnis --</option>
                                            {unitBisnisList.map((ub) => (
                                                <option key={ub.id} value={ub.id}>
                                                    {ub.nama}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.unit_bisnis_id && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.unit_bisnis_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Proyek / Klien */}
                                    <div>
                                        <label htmlFor="proyek_id" className="mb-2 block text-sm font-medium text-gray-700">
                                            Proyek / Klien (Opsional)
                                        </label>
                                        <select
                                            id="proyek_id"
                                            value={data.proyek_id}
                                            onChange={(e) => setData("proyek_id", e.target.value)}
                                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.proyek_id
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">-- Pilih Proyek (Opsional) --</option>
                                            {filteredProyek.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.proyek_id && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.proyek_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Sumber Tagihan */}
                                    <div>
                                        <label htmlFor="sumber_tagihan" className="mb-2 block text-sm font-medium text-gray-700">
                                            Sumber Tagihan <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="sumber_tagihan"
                                            value={data.sumber_tagihan}
                                            onChange={(e) => setData("sumber_tagihan", e.target.value)}
                                            required
                                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:ring-2 ${
                                                errors.sumber_tagihan
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="ritase">Ritase Armada</option>
                                            <option value="sewa_alat">Sewa Alat Jam</option>
                                            <option value="produksi">Sesi Produksi</option>
                                        </select>
                                        {errors.sumber_tagihan && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.sumber_tagihan}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    {/* Tanggal Jatuh Tempo */}
                                    <div>
                                        <label htmlFor="tanggal_jatuh_tempo" className="mb-2 block text-sm font-medium text-gray-700">
                                            Tanggal Jatuh Tempo <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="tanggal_jatuh_tempo"
                                            type="date"
                                            value={data.tanggal_jatuh_tempo}
                                            onChange={(e) => setData("tanggal_jatuh_tempo", e.target.value)}
                                            required
                                            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.tanggal_jatuh_tempo
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />
                                        {errors.tanggal_jatuh_tempo && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.tanggal_jatuh_tempo}
                                            </p>
                                        )}
                                    </div>

                                    {/* Catatan / Keterangan */}
                                    <div>
                                        <label htmlFor="catatan" className="mb-2 block text-sm font-medium text-gray-700">
                                            Catatan / Keterangan Invoice
                                        </label>
                                        <input
                                            id="catatan"
                                            type="text"
                                            value={data.catatan}
                                            onChange={(e) => setData("catatan", e.target.value)}
                                            placeholder="Catatan tambahan untuk invoice ini"
                                            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                                                errors.catatan
                                                    ? "border-red-500 focus:ring-red-100"
                                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />
                                        {errors.catatan && (
                                            <p className="mt-1.5 text-xs text-red-600">
                                                {errors.catatan}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Pilih Item Belum Ditagih */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4">
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Pilih Item Belum Ditagih
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Pilih item dari {data.sumber_tagihan.replace("_", " ")} yang akan dimasukkan ke invoice ini.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-gray-500">
                                        Estimasi Total Selected
                                    </span>
                                    <span className="text-lg font-bold text-blue-600">
                                        Rp {totalEstimasi.toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                {errors.item_ids && (
                                    <p className="mb-4 text-xs text-red-600">
                                        {errors.item_ids}
                                    </p>
                                )}

                                {loadingItems ? (
                                    <div className="py-8 text-center text-gray-500">
                                        Memuat data item belum ditagih...
                                    </div>
                                ) : unbilledItems.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-500">
                                        Tidak ditemukan transaksi {data.sumber_tagihan.replace("_", " ")} yang belum ditagih untuk filter ini.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="w-12 px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={toggleSelectAll}
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                            {data.item_ids.length === unbilledItems.length && unbilledItems.length > 0 ? (
                                                                <CheckSquare className="h-5 w-5 text-blue-600" />
                                                            ) : (
                                                                <Square className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Deskripsi Item
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Jumlah
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Harga Satuan (Rp)
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Subtotal (Rp)
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {unbilledItems.map((item) => {
                                                    const isSelected = data.item_ids.includes(String(item.id));
                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className={`cursor-pointer transition hover:bg-gray-50 ${
                                                                isSelected ? "bg-blue-50/50" : ""
                                                            }`}
                                                            onClick={() => toggleSelectItem(item.id)}
                                                        >
                                                            <td className="px-4 py-4 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {}}
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                                {item.deskripsi}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                                {item.jumlah}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                                Rp {Number(item.harga_satuan).toLocaleString("id-ID")}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                                Rp {Number(item.subtotal).toLocaleString("id-ID")}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={processing || data.item_ids.length === 0}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {processing
                                    ? "Menyimpan..."
                                    : `Buat Invoice (${data.item_ids.length} Item Selected)`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}