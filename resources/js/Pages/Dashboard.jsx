import Layout from '@/Components/Layout';
import { Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
    return (
        <Layout>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow">
                    <div className="text-sm text-gray-500">Total Proyek Aktif</div>
                    <div className="text-2xl font-bold">{stats.total_proyek_aktif}</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <div className="text-sm text-gray-500">PO Menunggu Approval</div>
                    <div className="text-2xl font-bold">{stats.po_menunggu_approval}</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <div className="text-sm text-gray-500">Produksi Hari Ini</div>
                    <div className="text-2xl font-bold">{stats.produksi_hari_ini} m³</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <div className="text-sm text-gray-500">Piutang Outstanding</div>
                    <div className="text-2xl font-bold">Rp {Number(stats.piutang_outstanding).toLocaleString()}</div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-semibold">Ritase Hari Ini</h2>
                    <ul>
                        {stats.ritase_hari_ini?.map((rit, i) => (
                            <li key={i}>{rit.armada_plat} - {rit.jumlah_rit} rit</li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-semibold">Sesi Produksi Berjalan</h2>
                    <ul>
                        {stats.sesi_produksi_berjalan?.map((s, i) => (
                            <li key={i}>{s.produk_nama} - {s.mesin_nama}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
