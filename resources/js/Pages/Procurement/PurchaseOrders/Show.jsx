import Layout from '@/Components/Layout';
import { router } from '@inertiajs/react';

export default function Show({ po }) {
    const handleSubmit = (action) => {
        if (window.confirm(`Yakin ${action} PO ini?`)) {
            router.post(route(`procurement.purchase-orders.${action}`, po.id));
        }
    };

    return (
        <Layout>
            <h1 className="text-2xl font-bold">Detail PO: {po.kode_po}</h1>
            <div className="bg-white p-6 rounded shadow mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><strong>Supplier:</strong> {po.supplier?.nama}</div>
                    <div><strong>Proyek:</strong> {po.proyek?.nama}</div>
                    <div><strong>Total:</strong> Rp {Number(po.total).toLocaleString()}</div>
                    <div><strong>Status:</strong> {po.status}</div>
                </div>

                <h3 className="font-semibold mt-4">Item</h3>
                <table className="w-full mt-2">
                    <thead><tr><th>Bahan</th><th>Jumlah</th><th>Harga</th><th>Subtotal</th></tr></thead>
                    <tbody>
                        {po.items.map(item => (
                            <tr key={item.id}>
                                <td>{item.bahan_baku?.nama}</td>
                                <td>{item.jumlah}</td>
                                <td>Rp {Number(item.harga_satuan_snapshot).toLocaleString()}</td>
                                <td>Rp {Number(item.subtotal).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-4 space-x-2">
                    {po.status === 'draft' && (
                        <button onClick={() => handleSubmit('submit')} className="bg-yellow-600 text-white px-4 py-2 rounded">Ajukan</button>
                    )}
                    {['menunggu_approval_finance', 'menunggu_approval_owner'].includes(po.status) && (
                        <>
                            <button onClick={() => handleSubmit('approve')} className="bg-green-600 text-white px-4 py-2 rounded">Setujui</button>
                            <button onClick={() => handleSubmit('reject')} className="bg-red-600 text-white px-4 py-2 rounded">Tolak</button>
                        </>
                    )}
                    {po.status === 'disetujui' && (
                        <button onClick={() => handleSubmit('receive')} className="bg-blue-600 text-white px-4 py-2 rounded">Terima Barang</button>
                    )}
                    {['diterima', 'dibayar_sebagian'].includes(po.status) && (
                        <Link href={route('procurement.purchase-orders.payment', po.id)} className="bg-purple-600 text-white px-4 py-2 rounded">Bayar</Link>
                    )}
                </div>
            </div>
        </Layout>
    );
}
