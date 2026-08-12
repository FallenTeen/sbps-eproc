import React, { useState } from "react";
import { Link, useForm, router } from "@inertiajs/react";
import Layout from "@/Components/Layout";
import { ArrowLeft, Pencil, Trash2, Plus, Tag, BookOpen } from "lucide-react";

function formatRupiah(n) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}
function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const TABS = [
    { key: "info",   label: "Informasi", icon: BookOpen },
    { key: "harga",  label: "Harga Jual", icon: Tag },
    { key: "resep",  label: "Resep / BOM", icon: BookOpen },
];

export default function Show({ produk }) {
    const [activeTab, setActiveTab] = useState("info");
    const { delete: destroy } = useForm();

    // Harga Form
    const hargaForm = useForm({ harga: "", berlaku_dari: new Date().toISOString().slice(0, 10) });

    const handleDeleteProduk = () => {
        if (confirm(`Hapus produk "${produk.nama}"?`)) {
            destroy(route("production.produk.destroy", produk.id));
        }
    };

    const handleAddHarga = (e) => {
        e.preventDefault();
        hargaForm.post(route("production.produk.set-harga", produk.id), {
            onSuccess: () => hargaForm.reset(),
        });
    };

    const handleDeleteResep = (resepId) => {
        if (confirm("Hapus item resep ini?")) {
            router.delete(route("production.resep.destroy", resepId));
        }
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href={route("production.produk.index")} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{produk.nama}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {produk.kategori?.replace("_", " ")} · {produk.satuan_output} · {produk.unit_bisnis?.nama}
                        </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${produk.aktif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {produk.aktif ? "AKTIF" : "NONAKTIF"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={route("production.produk.edit", produk.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors">
                        <Pencil className="w-4 h-4" /> Edit
                    </Link>
                    <button onClick={handleDeleteProduk}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                        <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-0">
                    {TABS.map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.key
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}>
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* === Tab Info === */}
            {activeTab === "info" && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                        <DField label="Nama Produk" value={produk.nama} />
                        <DField label="Kategori" value={produk.kategori?.replace("_", " ")} />
                        <DField label="Satuan Output" value={produk.satuan_output} />
                        <DField label="Unit Bisnis" value={produk.unit_bisnis?.nama} />
                        <DField label="Status" value={
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${produk.aktif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                {produk.aktif ? "Aktif" : "Nonaktif"}
                            </span>
                        } />
                        <DField label="Item Resep" value={`${produk.resep_produksis?.length || 0} bahan baku`} />
                    </dl>
                </div>
            )}

            {/* === Tab Harga Jual === */}
            {activeTab === "harga" && (
                <div className="space-y-6">
                    {/* Form Tambah Harga */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-4">Tambah Harga Baru</h3>
                        <form onSubmit={handleAddHarga}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga Jual (Rp / {produk.satuan_output}) *</label>
                                    <input type="number" min="0" value={hargaForm.data.harga}
                                        onChange={(e) => hargaForm.setData("harga", e.target.value)}
                                        placeholder="Contoh: 850000"
                                        className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:outline-none ${hargaForm.errors.harga ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300"}`}
                                    />
                                    {hargaForm.errors.harga && <p className="text-xs text-red-500 mt-1">{hargaForm.errors.harga}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Berlaku Dari *</label>
                                    <input type="date" value={hargaForm.data.berlaku_dari}
                                        onChange={(e) => hargaForm.setData("berlaku_dari", e.target.value)}
                                        className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:outline-none ${hargaForm.errors.berlaku_dari ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300"}`}
                                    />
                                    {hargaForm.errors.berlaku_dari && <p className="text-xs text-red-500 mt-1">{hargaForm.errors.berlaku_dari}</p>}
                                </div>
                                <button type="submit" disabled={hargaForm.processing}
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 h-[42px]">
                                    <Plus className="w-4 h-4" />
                                    {hargaForm.processing ? "Menyimpan..." : "Tambah Harga"}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                💡 Harga lama yang masih aktif akan otomatis ditutup pada tanggal sebelum harga baru berlaku.
                            </p>
                        </form>
                    </div>

                    {/* Histori Harga */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-gray-800">Histori Harga Jual</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["Harga (Rp)", "Berlaku Dari", "Berlaku Sampai", "Status"].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(produk.harga_jual || []).length === 0 ? (
                                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">Belum ada histori harga.</td></tr>
                                ) : (produk.harga_jual || []).map((h) => {
                                    const today = new Date();
                                    const dari = new Date(h.berlaku_dari);
                                    const sampai = h.berlaku_sampai ? new Date(h.berlaku_sampai) : null;
                                    const isAktif = dari <= today && (!sampai || sampai >= today);
                                    return (
                                        <tr key={h.id} className={`hover:bg-gray-50 transition-colors ${isAktif ? "bg-emerald-50/30" : ""}`}>
                                            <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{formatRupiah(h.harga)}</td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(h.berlaku_dari)}</td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600">{h.berlaku_sampai ? formatDate(h.berlaku_sampai) : <span className="text-gray-400 italic">Tidak dibatasi</span>}</td>
                                            <td className="px-5 py-3.5">
                                                {isAktif
                                                    ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">AKTIF</span>
                                                    : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">KADALUARSA</span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* === Tab Resep / BOM === */}
            {activeTab === "resep" && (
                <div className="space-y-5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">Resep Produksi / BOM</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Komposisi bahan baku per {produk.satuan_output} output</p>
                        </div>
                        <Link href={route("production.resep.create", produk.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <Plus className="w-4 h-4" /> Tambah Bahan
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["#", "Bahan Baku", "Satuan", "Jumlah per " + produk.satuan_output, "Aksi"].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(produk.resep_produksis || []).length === 0 ? (
                                    <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                                        Belum ada resep. <Link href={route("production.resep.create", produk.id)} className="text-blue-600 hover:underline">Tambah bahan baku pertama</Link>.
                                    </td></tr>
                                ) : (produk.resep_produksis || []).map((item, i) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3.5 text-sm text-gray-400">{i + 1}</td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm font-medium text-gray-900">{item.bahan_baku?.nama}</p>
                                            <p className="text-xs text-gray-500">{item.bahan_baku?.kode}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-gray-600">{item.bahan_baku?.satuan}</td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">{item.jumlah_per_unit_output}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <Link href={route("production.resep.edit", item.id)} className="text-sm text-amber-600 hover:text-amber-800 font-medium">Edit</Link>
                                                <button onClick={() => handleDeleteResep(item.id)} className="text-sm text-red-600 hover:text-red-800 font-medium">Hapus</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {(produk.resep_produksis || []).length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-600">Total Bahan</td>
                                        <td className="px-5 py-3 text-sm font-bold text-gray-900">
                                            {(produk.resep_produksis || []).reduce((sum, r) => sum + (r.jumlah_per_unit_output || 0), 0).toFixed(3)} (total qty)
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
}

function DField({ label, value }) {
    return (
        <div>
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">{value ?? "-"}</dd>
        </div>
    );
}
