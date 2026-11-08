import React, { useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout';
import DataTable from '@/Components/DataTable';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';

const KATEGORI = [
    { value: 'bahan_baku', label: 'Bahan Baku' },
    { value: 'sparepart', label: 'Sparepart' },
    { value: 'sdm_tetap', label: 'SDM Tetap' },
    { value: 'sdm_kondisional', label: 'SDM Kondisional' },
    { value: 'lainnya', label: 'Lainnya' },
];

const rupiah = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v || 0));

export default function Index({ rabs, proyeks, filters }) {
    const { url } = usePage();
    const proyekId = useMemo(() => {
        const m = url.match(/\/core\/proyek\/([^/]+)\/rab/);
        return m ? m[1] : null;
    }, [url]);

    const handleDelete = (id) => {
        if (window.confirm('Yakin hapus RAB ini?')) {
            router.delete(route('core.rab.destroy', id));
        }
    };

    const labelKategori = (v) => KATEGORI.find((k) => k.value === v)?.label ?? v;

    const columns = [
        { key: 'proyek', label: 'Proyek', search: false, render: (r) => r.proyek?.nama ?? '-' },
        { key: 'titik', label: 'Titik', search: false, render: (r) => r.titik?.nama ?? <span className="text-gray-400 italic">Proyek</span> },
        { key: 'kategori', label: 'Kategori', type: 'select', options: KATEGORI, render: (r) => labelKategori(r.kategori) },
        { key: 'rencana', label: 'Rencana (Rp)', search: false, render: (r) => rupiah(r.rencana) },
        { key: 'catatan', label: 'Catatan', render: (r) => r.catatan ?? '-' },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            align: 'right',
            render: (r) => (
                <div className="flex items-center justify-end gap-2">
                    <Link href={route('core.rab.show', r.id)} className="text-blue-600 hover:text-blue-800" title="Detail">
                        <Eye size={16} />
                    </Link>
                    <Link href={route('core.rab.edit', r.id)} className="text-amber-600 hover:text-amber-800" title="Ubah">
                        <Edit size={16} />
                    </Link>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800" title="Hapus">
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <Layout title="RAB">
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Rencana Anggaran Biaya</h1>
                        <p className="text-sm text-gray-500">Realisasi dihitung otomatis per kategori (bahan baku, sparepart, SDM, lainnya).</p>
                    </div>
                    <Link
                        href={route('core.rab.create', proyekId ? { proyek_id: proyekId } : {})}
                        className="inline-flex items-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <Plus size={16} /> Tambah RAB
                    </Link>
                </div>

                <div className="rounded bg-white p-4 shadow-sm">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Filter Proyek</label>
                    <select
                        className="w-full max-w-md rounded border-gray-300 text-sm"
                        value={filters?.proyek_id ?? proyekId ?? ''}
                        onChange={(e) => {
                            const id = e.target.value;
                            if (id) router.get(route('core.rab.index', id));
                        }}
                    >
                        <option value="">(Semua proyek yang dapat diakses)</option>
                        {proyeks.map((p) => (
                            <option key={p.id} value={p.id}>{p.nama}</option>
                        ))}
                    </select>
                </div>

                <DataTable
                    routeName="core.rab.index"
                    routeParams={proyekId ? { proyek: proyekId } : {}}
                    columns={columns}
                    rows={rabs}
                    filters={filters}
                />
            </div>
        </Layout>
    );
}
