import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable from '@/Components/DataTable';
import { Plus, Clock, Eye, Wrench } from 'lucide-react';
import { formatTanggal } from '@/utils/date';

const STATUS_COLOR = {
    disetujui: 'bg-green-100 text-green-800',
    ditagih:   'bg-blue-100 text-blue-800',
};

function StatCard({ label, value, color = 'blue' }) {
    const colors = {
        blue:   'from-blue-600 to-blue-700',
        green:  'from-green-600 to-green-700',
        amber:  'from-amber-500 to-amber-600',
        purple: 'from-purple-600 to-purple-700',
    };
    return (
        <div className={`rounded-xl bg-gradient-to-br ${colors[color]} text-white p-5 shadow-md`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    );
}

export default function SewaAlatIndex({ sewaList, filters = {}, armadaList = [], stats = {}, can = {}, sort, direction }) {
    const { flash } = usePage().props;

    const columns = [
        {
            key: 'tanggal',
            label: 'Tanggal',
            type: 'dateRange',
            cellClassName: 'px-4 py-3 whitespace-nowrap text-sm text-slate-700',
            render: (s) => formatTanggal(s.tanggal),
        },
        {
            key: 'armada',
            label: 'Alat / Armada',
            type: 'select',
            options: armadaList.map((a) => ({
                value: String(a.id),
                label: [a.kode_unit, a.plat_nomor].filter(Boolean).join(' · '),
            })),
            cellClassName: 'px-4 py-3',
            render: (s) => (
                <>
                    <p className="text-sm font-semibold text-slate-800">{s.armada?.kode_unit}</p>
                    <p className="text-xs text-slate-500">{s.armada?.plat_nomor}</p>
                </>
            ),
        },
        {
            key: 'pelanggan',
            label: 'Pelanggan',
            type: 'text',
            cellClassName: 'px-4 py-3 text-sm text-slate-700',
            render: (s) => s.penyewa_nama || s.penyewa_eksternal || '–',
        },
        {
            key: 'hm_awal',
            label: 'HM Awal',
            search: false,
            cellClassName: 'px-4 py-3 text-sm text-slate-700 tabular-nums',
            render: (s) => s.hm_awal,
        },
        {
            key: 'hm_akhir',
            label: 'HM Akhir',
            search: false,
            cellClassName: 'px-4 py-3 text-sm text-slate-700 tabular-nums',
            render: (s) => s.hm_akhir ?? '–',
        },
        {
            key: 'jumlah_jam',
            label: 'Total HM',
            search: false,
            cellClassName: 'px-4 py-3 text-sm font-semibold text-slate-800 tabular-nums',
            render: (s) => (Number(s.jumlah_jam) > 0 ? `${s.jumlah_jam} HM` : '–'),
        },
        {
            key: 'harga_per_jam_snapshot',
            label: 'Tarif/HM',
            search: false,
            cellClassName: 'px-4 py-3 text-sm text-slate-700 tabular-nums',
            render: (s) => `Rp ${Number(s.harga_per_jam_snapshot ?? 0).toLocaleString('id-ID')}`,
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'disetujui', label: 'Disetujui' },
                { value: 'ditagih', label: 'Ditagih' },
            ],
            cellClassName: 'px-4 py-3',
            render: (s) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {s.status}
                </span>
            ),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            cellClassName: 'px-4 py-3',
            render: (s) => (
                <div className="flex items-center gap-2 text-xs font-medium">
                    <Link href={route('fleet.armada.show', s.armada_id)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                        <Eye className="w-3 h-3" /> Detail
                    </Link>
                    <Link href={route('fleet.sewa-alat.serah-terima.show', s.id)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-semibold">
                        <Clock className="w-3 h-3" /> Serah Terima
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Sewa Alat Berat</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Rekap sewa alat berbasis Jam Mesin (HM)</p>
                    </div>
                    {(can?.create ?? true) && (
                        <Link
                            href={route('fleet.sewa-alat.create')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Catat Sewa
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Sewa Alat Berat" />

            {flash?.success && (
                <div className="mb-4 flex items-center bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    <span className="text-sm">{flash.success}</span>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Sewa Aktif" value={stats.total_aktif ?? 0} color="blue" />
                <StatCard label="HM Total Bulan Ini" value={`${Number(stats.hm_bulan ?? 0).toLocaleString('id-ID')} HM`} color="green" />
                <StatCard label="Pendapatan Bulan Ini" value={`Rp ${Number(stats.pendapatan_bulan ?? 0).toLocaleString('id-ID')}`} color="amber" />
                <StatCard label="Alat Tersewa Sekarang" value={stats.alat_tersewa ?? 0} color="purple" />
            </div>

            <DataTable
                routeName="fleet.sewa-alat.index"
                columns={columns}
                rows={sewaList}
                filters={filters}
                sort={sort}
                direction={direction}
                emptyMessage="Belum ada data sewa alat."
            />
        </AuthenticatedLayout>
    );
}
