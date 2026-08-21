<?php

namespace App\Domain\Procurement\Http\Controllers;

use App\Domain\Procurement\Models\Pembayaran;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * NOTE PENTING:
 * Controller ini SENGAJA tidak punya method create()/store()/edit()/update()/destroy().
 * Pembayaran adalah transaksi finansial yang tidak boleh diubah/dihapus setelah
 * tercatat (lihat catatan di dokumen spesifikasi). Proses "membuat" pembayaran
 * sudah ditangani oleh PurchaseOrderController::paymentForm() & storePayment(),
 * yang memakai RecordPaymentAction yang sama. Controller ini murni untuk
 * melihat & mencetak riwayat pembayaran yang sudah ada.
 *
 * Kalau di masa depan mau dipindah supaya create/store ada di sini juga,
 * cukup pindahkan 2 method itu dari PurchaseOrderController ke sini dan
 * update route resource-nya menjadi ->only(['index','show','create','store']).
 */
class PembayaranController extends Controller
{
    /**
     * Display a listing of all pembayaran with filters.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Pembayaran::class);

        $query = Pembayaran::with(['purchaseOrder.proyek', 'purchaseOrder.supplier', 'akunKasBank', 'dicatatOleh']);

        if ($request->user()->unit_bisnis_id) {
            $query->whereHas('purchaseOrder.proyek', function ($q) use ($request) {
                $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
            });
        }

        if ($request->filled('purchase_order_id')) {
            $query->where('purchase_order_id', $request->purchase_order_id);
        }

        if ($request->filled('metode')) {
            $query->where('metode', $request->metode);
        }

        if ($request->filled('tanggal_dari')) {
            $query->whereDate('tanggal', '>=', $request->tanggal_dari);
        }

        if ($request->filled('tanggal_sampai')) {
            $query->whereDate('tanggal', '<=', $request->tanggal_sampai);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('purchaseOrder', function ($q) use ($search) {
                $q->where('kode_po', 'like', "%{$search}%");
            });
        }

        $pembayarans = $query->orderBy('tanggal', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Procurement/Pembayaran/Index', [
            'pembayarans' => $pembayarans,
            'filters' => $request->only(['purchase_order_id', 'metode', 'tanggal_dari', 'tanggal_sampai', 'search']),
        ]);
    }

    /**
     * Display the specified pembayaran with proof of payment.
     */
    public function show(Pembayaran $pembayaran)
    {
        $this->authorize('view', $pembayaran);

        $pembayaran->load(['purchaseOrder.proyek', 'purchaseOrder.supplier', 'akunKasBank', 'dicatatOleh', 'mutasiKasBank']);

        return Inertia::render('Procurement/Pembayaran/Show', [
            'pembayaran' => $pembayaran,
        ]);
    }

    /**
     * Print/cetak bukti pembayaran (PDF).
     */
    public function print(Pembayaran $pembayaran)
    {
        $this->authorize('print', $pembayaran);

        $pembayaran->load(['purchaseOrder.proyek', 'purchaseOrder.supplier', 'akunKasBank', 'dicatatOleh']);

        $pdf = Pdf::loadView('pdf.bukti-pembayaran', [
            'pembayaran' => $pembayaran,
        ]);

        return $pdf->stream('bukti-pembayaran-'.$pembayaran->purchaseOrder->kode_po.'.pdf');
    }
}
