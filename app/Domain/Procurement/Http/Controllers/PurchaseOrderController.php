<?php

namespace App\Domain\Procurement\Http\Controllers;

use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Procurement\Actions\SubmitPurchaseOrderAction;
use App\Domain\Procurement\Actions\ApprovePurchaseOrderAction;
use App\Domain\Procurement\Actions\RejectPurchaseOrderAction;
use App\Domain\Procurement\Actions\RecordPaymentAction;
use App\Domain\Procurement\Actions\RecordStockMutationAction;
use App\Domain\Finance\Models\AkunKasBank;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', PurchaseOrder::class);

        $query = PurchaseOrder::with(['supplier', 'proyek', 'items.bahanBaku']);

        if ($request->user()->unit_bisnis_id) {
            $query->whereHas('proyek', function ($q) use ($request) {
                $q->where('unit_bisnis_id', $request->user()->unit_bisnis_id);
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where('kode_po', 'like', '%' . $request->search . '%')
                ->orWhereHas('supplier', fn($q) => $q->where('nama', 'like', '%' . $request->search . '%'));
        }

        $pos = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Procurement/PurchaseOrders/Index', [
            'pos' => $pos,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', PurchaseOrder::class);

        $user = auth()->user();
        $proyeksQuery = Proyek::where('status', 'aktif');
        if ($user->unit_bisnis_id) {
            $proyeksQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }
        $proyeks = $proyeksQuery->get();
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
        $this->authorize('create', PurchaseOrder::class);

        $request->validate([
            'proyek_id' => 'required|exists:proyeks,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'tanggal_pesan' => 'required|date',
            'tanggal_diperlukan' => 'nullable|date|after_or_equal:tanggal_pesan',
            'items' => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
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
                'status' => 'draft',
            ]);

            foreach ($request->items as $item) {
                $po->items()->create([
                    'bahan_baku_id' => $item['bahan_baku_id'],
                    'jumlah' => $item['jumlah'],
                    'harga_satuan_snapshot' => $item['harga_satuan_snapshot'],
                    'subtotal' => $item['jumlah'] * $item['harga_satuan_snapshot'],
                ]);
            }
        });

        return redirect()->route('procurement.purchase-orders.index')
            ->with('success', 'PO berhasil dibuat.');
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $this->authorize('view', $purchaseOrder);

        $po = $purchaseOrder->load([
            'supplier',
            'proyek',
            'titik',
            'items.bahanBaku',
            'approvals.approver',
            'pembayarans'
        ]);

        $user = Auth::user();
        $canApprove = $user->can('approve', $purchaseOrder);
        $canReject = $user->can('reject', $purchaseOrder);
        $canReceive = $user->can('receive', $purchaseOrder);
        $canPay = $user->can('pay', $purchaseOrder);
        $canUpdate = $user->can('update', $purchaseOrder);
        $canDelete = $user->can('delete', $purchaseOrder);

        return Inertia::render('Procurement/PurchaseOrders/Show', [
            'po' => $po,
            'canApprove' => $canApprove,
            'canReject' => $canReject,
            'canReceive' => $canReceive,
            'canPay' => $canPay,
            'can' => [
                'approve' => $canApprove,
                'reject' => $canReject,
                'receive' => $canReceive,
                'pay' => $canPay,
                'update' => $canUpdate,
                'delete' => $canDelete,
            ],
        ]);
    }

    public function edit(PurchaseOrder $purchaseOrder)
    {
        $this->authorize('update', $purchaseOrder);

        if ($purchaseOrder->status !== 'draft') {
            return back()->with('error', 'PO sudah diajukan, tidak bisa diedit.');
        }

        $user = auth()->user();
        $proyeksQuery = Proyek::where('status', 'aktif');
        if ($user->unit_bisnis_id) {
            $proyeksQuery->where('unit_bisnis_id', $user->unit_bisnis_id);
        }
        $proyeks = $proyeksQuery->get();
        $suppliers = Supplier::where('aktif', true)->get();
        $bahanBakus = BahanBaku::where('aktif', true)->get();

        return Inertia::render('Procurement/PurchaseOrders/Edit', [
            'po' => $purchaseOrder->load('items.bahanBaku'),
            'proyeks' => $proyeks,
            'suppliers' => $suppliers,
            'bahanBakus' => $bahanBakus,
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $this->authorize('update', $purchaseOrder);

        if ($purchaseOrder->status !== 'draft') {
            return back()->with('error', 'PO sudah diajukan, tidak bisa diupdate.');
        }

        $request->validate([
            'proyek_id' => 'required|exists:proyeks,id',
            'titik_id' => 'nullable|exists:titiks,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'tanggal_pesan' => 'required|date',
            'tanggal_diperlukan' => 'nullable|date|after_or_equal:tanggal_pesan',
            'items' => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.jumlah' => 'required|numeric|min:0.01',
            'items.*.harga_satuan_snapshot' => 'required|numeric|min:0',
            'catatan' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $purchaseOrder) {
            $purchaseOrder->update([
                'proyek_id' => $request->proyek_id,
                'titik_id' => $request->titik_id,
                'supplier_id' => $request->supplier_id,
                'tanggal_pesan' => $request->tanggal_pesan,
                'tanggal_diperlukan' => $request->tanggal_diperlukan,
                'catatan' => $request->catatan,
            ]);

            $purchaseOrder->items()->delete();
            foreach ($request->items as $item) {
                $purchaseOrder->items()->create([
                    'bahan_baku_id' => $item['bahan_baku_id'],
                    'jumlah' => $item['jumlah'],
                    'harga_satuan_snapshot' => $item['harga_satuan_snapshot'],
                    'subtotal' => $item['jumlah'] * $item['harga_satuan_snapshot'],
                ]);
            }
        });

        return redirect()->route('procurement.purchase-orders.show', $purchaseOrder)
            ->with('success', 'PO berhasil diupdate.');
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        $this->authorize('delete', $purchaseOrder);

        if ($purchaseOrder->status !== 'draft') {
            return back()->with('error', 'PO sudah diajukan, tidak bisa dihapus.');
        }
        $purchaseOrder->delete();
        return redirect()->route('procurement.purchase-orders.index')
            ->with('success', 'PO dihapus.');
    }

    public function submit(PurchaseOrder $purchaseOrder)
    {
        $this->authorize('update', $purchaseOrder);

        try {
            $po = (new SubmitPurchaseOrderAction())->execute($purchaseOrder);
            return back()->with('success', 'PO berhasil diajukan.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function approve(PurchaseOrder $purchaseOrder, Request $request)
    {
        $this->authorize('approve', $purchaseOrder);

        $request->validate(['catatan' => 'nullable|string']);
        try {
            $po = (new ApprovePurchaseOrderAction())->execute($purchaseOrder, $request->catatan);
            return back()->with('success', 'PO disetujui.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function reject(PurchaseOrder $purchaseOrder, Request $request)
    {
        $this->authorize('reject', $purchaseOrder);

        $request->validate(['catatan' => 'nullable|string']);
        try {
            $po = (new RejectPurchaseOrderAction())->execute($purchaseOrder, $request->catatan);
            return back()->with('success', 'PO ditolak.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function receive(PurchaseOrder $purchaseOrder)
    {
        $this->authorize('receive', $purchaseOrder);

        try {
            $purchaseOrder->status->transitionTo(\App\Domain\Procurement\States\Diterima::class);
            (new RecordStockMutationAction())->execute($purchaseOrder);
            return back()->with('success', 'PO diterima dan stok bertambah.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function paymentForm(PurchaseOrder $purchaseOrder)
    {
        $this->authorize('pay', $purchaseOrder);

        $akunKasQuery = AkunKasBank::where('aktif', true);
        if ($purchaseOrder->proyek?->unit_bisnis_id) {
            $akunKasQuery->where('unit_bisnis_id', $purchaseOrder->proyek->unit_bisnis_id);
        }
        $akunKas = $akunKasQuery->get();

        return Inertia::render('Procurement/PurchaseOrders/Payment', [
            'po' => $purchaseOrder->load('pembayarans'),
            'akunKas' => $akunKas,
            'sisaTagihan' => $purchaseOrder->total - $purchaseOrder->pembayarans->sum('jumlah'),
        ]);
    }

    public function storePayment(Request $request, PurchaseOrder $purchaseOrder)
    {
        $this->authorize('pay', $purchaseOrder);

        $sisa = $purchaseOrder->total - $purchaseOrder->pembayarans->sum('jumlah');

        $request->validate([
            'jumlah' => 'required|numeric|min:0.01|max:' . $sisa,
            'tanggal' => 'required|date',
            'metode' => 'required|in:tunai,transfer,cek,lainnya',
            'akun_kas_bank_id' => 'required|exists:akun_kas_banks,id',
            'catatan' => 'nullable|string',
        ]);

        try {
            (new RecordPaymentAction())->execute($purchaseOrder, $request->all());
            return redirect()->route('procurement.purchase-orders.show', $purchaseOrder)
                ->with('success', 'Pembayaran dicatat.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
