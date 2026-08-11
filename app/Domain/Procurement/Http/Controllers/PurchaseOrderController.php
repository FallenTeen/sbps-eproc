<?php
namespace App\Domain\Procurement\Http\Controllers;

use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Actions\SubmitPurchaseOrderAction;
use App\Domain\Procurement\Actions\ApprovePurchaseOrderAction;
use App\Domain\Procurement\Actions\RejectPurchaseOrderAction;
use App\Domain\Procurement\Actions\RecordPaymentAction;
use App\Domain\Procurement\Actions\RecordStockMutationAction;
use App\Domain\Core\Models\Proyek;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Procurement\Models\BahanBaku;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        $pos = PurchaseOrder::with(['supplier', 'proyek', 'items.bahanBaku'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        return Inertia::render('Procurement/PurchaseOrders/Index', ['pos' => $pos]);
    }

    public function create()
    {
        $proyeks = Proyek::where('status', 'aktif')->get();
        $suppliers = Supplier::where('aktif', true)->get();
        $bahanBakus = BahanBaku::where('aktif', true)->get();
        return Inertia::render('Procurement/PurchaseOrders/Create', [
            'proyeks' => $proyeks,
            'suppliers' => $suppliers,
            'bahanBakus' => $bahanBakus,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'proyek_id' => 'required|exists:proyek,id',
            'titik_id' => 'nullable|exists:titik,id',
            'supplier_id' => 'required|exists:supplier,id',
            'tanggal_pesan' => 'required|date',
            'tanggal_diperlukan' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:bahan_baku,id',
            'items.*.jumlah' => 'required|numeric|min:0.01',
            'items.*.harga_satuan_snapshot' => 'required|numeric|min:0',
            'catatan' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            $po = PurchaseOrder::create([
                'kode_po' => 'PO-' . date('Ymd') . '-' . str_pad(PurchaseOrder::count() + 1, 4, '0', STR_PAD_LEFT),
                'proyek_id' => $request->proyek_id,
                'titik_id' => $request->titik_id,
                'supplier_id' => $request->supplier_id,
                'created_by' => Auth::id(),
                'tanggal_pesan' => $request->tanggal_pesan,
                'tanggal_diperlukan' => $request->tanggal_diperlukan,
                'catatan' => $request->catatan,
            ]);

            foreach ($request->items as $item) {
                $po->items()->create([
                    'bahan_baku_id' => $item['bahan_baku_id'],
                    'jumlah' => $item['jumlah'],
                    'harga_satuan_snapshot' => $item['harga_satuan_snapshot'],
                    'subtotal' => $item['jumlah'] * $item['harga_satuan_snapshot'],
                ]);
            }

            // Submit otomatis? Atau user akan submit terpisah.
            // Kita buat tombol submit terpisah.
        });

        return redirect()->route('procurement.purchase-orders.index')->with('success', 'PO berhasil dibuat.');
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $po = $purchaseOrder->load(['supplier', 'proyek', 'titik', 'items.bahanBaku', 'approvals.approver', 'pembayaran']);
        return Inertia::render('Procurement/PurchaseOrders/Show', ['po' => $po]);
    }

    public function submit(PurchaseOrder $purchaseOrder)
    {
        try {
            $po = (new SubmitPurchaseOrderAction())->execute($purchaseOrder);
            return back()->with('success', 'PO berhasil diajukan.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function approve(PurchaseOrder $purchaseOrder, Request $request)
    {
        $request->validate(['catatan' => 'nullable|string']);
        $po = (new ApprovePurchaseOrderAction())->execute($purchaseOrder, $request->catatan);
        return back()->with('success', 'PO disetujui.');
    }

    public function reject(PurchaseOrder $purchaseOrder, Request $request)
    {
        $request->validate(['catatan' => 'nullable|string']);
        $po = (new RejectPurchaseOrderAction())->execute($purchaseOrder, $request->catatan);
        return back()->with('success', 'PO ditolak.');
    }

    public function receive(PurchaseOrder $purchaseOrder)
    {
        // Ubah status ke Diterima dan catat stok
        $purchaseOrder->status->transitionTo(\App\Domain\Procurement\States\Diterima::class);
        (new RecordStockMutationAction())->execute($purchaseOrder);
        return back()->with('success', 'PO diterima dan stok bertambah.');
    }

    public function paymentForm(PurchaseOrder $purchaseOrder)
    {
        $akunKas = \App\Domain\Finance\Models\AkunKasBank::where('unit_bisnis_id', $purchaseOrder->proyek->unit_bisnis_id)->get();
        return Inertia::render('Procurement/PurchaseOrders/Payment', [
            'po' => $purchaseOrder,
            'akunKas' => $akunKas,
        ]);
    }

    public function storePayment(PurchaseOrder $purchaseOrder, Request $request)
    {
        $request->validate([
            'jumlah' => 'required|numeric|min:0.01|max:' . $purchaseOrder->total - $purchaseOrder->pembayaran->sum('jumlah'),
            'tanggal' => 'required|date',
            'metode' => 'required|in:tunai,transfer,cek,lainnya',
            'akun_kas_bank_id' => 'required|exists:akun_kas_bank,id',
            'catatan' => 'nullable|string',
        ]);

        (new RecordPaymentAction())->execute($purchaseOrder, $request->all());
        return redirect()->route('procurement.purchase-orders.show', $purchaseOrder)->with('success', 'Pembayaran dicatat.');
    }
}
