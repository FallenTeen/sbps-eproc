import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import PetaTitikProyek from '@/Components/PetaTitikProyek';

export default function Show({ proyek, rabRealisasi, stats }) {
    const [activeTab, setActiveTab] = useState('info');
    const [selectedTitikId, setSelectedTitikId] = useState(null);

    const getStatusBadge = (status) => {
        const colors = {
            draft: 'bg-gray-200 text-gray-800',
            aktif: 'bg-green-200 text-green-800',
            selesai: 'bg-blue-200 text-blue-800',
            dihentikan: 'bg-red-200 text-red-800',
        };
        return colors[status] || 'bg-gray-200 text-gray-800';
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const handleDelete = () => {
        if (window.confirm('Yakin hapus proyek ini?')) {
            router.delete(route('core.proyek.destroy', proyek.id));
        }
    };

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('core.proyek.index')} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">{proyek.nama}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(proyek.status)}`}>
                    {proyek.status.charAt(0).toUpperCase() + proyek.status.slice(1)}
                </span>
                <div className="ml-auto flex gap-2">
                    <Link
                        href={route('core.proyek.edit', proyek.id)}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm flex items-center gap-1"
                    >
                        <Edit className="w-4 h-4" />
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm flex items-center gap-1"
                    >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                    </button>
                    <Link
                        href={route('core.rab.create', { proyek_id: proyek.id })}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah RAB
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Titik</div>
                    <div className="text-2xl font-bold">{stats.total_titik}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total RAB</div>
                    <div className="text-2xl font-bold">{formatCurrency(stats.total_rab)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total PO</div>
                    <div className="text-2xl font-bold">{stats.total_po}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Nominal PO</div>
                    <div className="text-2xl font-bold">{formatCurrency(stats.total_po_nominal)}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === 'info'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Informasi
                        </button>
                        <button
                            onClick={() => setActiveTab('rab')}
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === 'rab'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            RAB & Realisasi
                        </button>
                        <button
                            onClick={() => setActiveTab('titik')}
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === 'titik'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Titik ({proyek.titik.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('po')}
                            className={`px-6 py-3 text-sm font-medium ${
                                activeTab === 'po'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Purchase Order ({proyek.purchase_orders.length})
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Tab: Informasi */}
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div><strong>Kode:</strong> {proyek.kode_proyek}</div>
                            <div><strong>Unit Bisnis:</strong> {proyek.unit_bisnis?.nama}</div>
                            <div><strong>Tipe:</strong> {proyek.tipe_proyek === 'internal' ? 'Internal' : 'Kontrak Klien'}</div>
                            <div><strong>Client:</strong> {proyek.client || '-'}</div>
                            <div><strong>Lokasi:</strong> {proyek.lokasi || '-'}</div>
                            <div><strong>Status:</strong> {proyek.status}</div>
                            <div><strong>Tanggal Mulai:</strong> {new Date(proyek.tanggal_mulai).toLocaleDateString('id-ID')}</div>
                            <div><strong>Tanggal Selesai Rencana:</strong> {proyek.tanggal_selesai_rencana ? new Date(proyek.tanggal_selesai_rencana).toLocaleDateString('id-ID') : '-'}</div>
                            <div className="col-span-2">
                                <strong>Catatan:</strong> {proyek.catatan || '-'}
                            </div>
                        </div>
                    )}

                    {/* Tab: RAB & Realisasi */}
                    {activeTab === 'rab' && (
                        <div>
                            {rabRealisasi.length === 0 ? (
                                <p className="text-gray-500">Belum ada RAB untuk proyek ini.</p>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm">Kategori</th>
                                            <th className="px-4 py-2 text-right text-sm">Rencana</th>
                                            <th className="px-4 py-2 text-right text-sm">Realisasi</th>
                                            <th className="px-4 py-2 text-right text-sm">Selisih</th>
                                            <th className="px-4 py-2 text-right text-sm">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rabRealisasi.map((item) => {
                                            const selisih = item.rab.rencana - item.realisasi;
                                            const persen = item.rab.rencana > 0 ? (item.realisasi / item.rab.rencana) * 100 : 0;
                                            return (
                                                <tr key={item.rab.id} className="border-b">
                                                    <td className="px-4 py-2">{item.rab.kategori.replace('_', ' ').toUpperCase()}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(item.rab.rencana)}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(item.realisasi)}</td>
                                                    <td className={`px-4 py-2 text-right ${selisih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(selisih)}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">{persen.toFixed(1)}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Tab: Titik */}
                    {activeTab === 'titik' && (
                        <div className="space-y-6">
                            {proyek.titik.length === 0 ? (
                                <p className="text-gray-500">Belum ada titik untuk proyek ini.</p>
                            ) : (
                                <>
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-bold text-gray-800">Peta Sebaran Titik Proyek</h3>
                                            <span className="text-xs text-gray-500">{proyek.titik.length} titik terdaftar</span>
                                        </div>
                                        <PetaTitikProyek
                                            titiks={proyek.titik}
                                            selectedTitikId={selectedTitikId}
                                            onMarkerClick={(id) => setSelectedTitikId(id)}
                                            height="360px"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {proyek.titik.map((titik) => {
                                            const isSelected = String(titik.id) === String(selectedTitikId);
                                            return (
                                                <div
                                                    key={titik.id}
                                                    onClick={() => setSelectedTitikId(titik.id)}
                                                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'border-black bg-gray-50 ring-2 ring-black'
                                                            : 'hover:bg-gray-50 border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-bold text-gray-900">{titik.nama}</div>
                                                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                                            titik.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {titik.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-600 font-mono mt-1">
                                                        {titik.latitude}, {titik.longitude}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        Radius Presensi: <span className="font-medium">{titik.radius_presensi_meter}m</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Tab: PO */}
                    {activeTab === 'po' && (
                        <div>
                            {proyek.purchase_orders.length === 0 ? (
                                <p className="text-gray-500">Belum ada Purchase Order untuk proyek ini.</p>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm">Kode PO</th>
                                            <th className="px-4 py-2 text-left text-sm">Supplier</th>
                                            <th className="px-4 py-2 text-right text-sm">Total</th>
                                            <th className="px-4 py-2 text-left text-sm">Status</th>
                                            <th className="px-4 py-2 text-left text-sm">Tanggal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {proyek.purchase_orders.map((po) => (
                                            <tr key={po.id} className="border-b">
                                                <td className="px-4 py-2">
                                                    <Link href={route('procurement.purchase-orders.show', po.id)} className="text-blue-600 hover:underline">
                                                        {po.kode_po}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2">{po.supplier?.nama || '-'}</td>
                                                <td className="px-4 py-2 text-right">{formatCurrency(po.total)}</td>
                                                <td className="px-4 py-2">{po.status}</td>
                                                <td className="px-4 py-2">{new Date(po.tanggal_pesan).toLocaleDateString('id-ID')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
