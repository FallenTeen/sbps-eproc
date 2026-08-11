<?php
namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\PurchaseOrderApproval;
use App\Domain\Procurement\States\Ditolak;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RejectPurchaseOrderAction
{
    public function execute(PurchaseOrder $po, string $catatan = null): PurchaseOrder
    {
        DB::transaction(function () use ($po, $catatan) {
            PurchaseOrderApproval::create([
                'purchase_order_id' => $po->id,
                'approved_by' => Auth::id(),
                'status' => 'ditolak',
                'catatan' => $catatan,
            ]);

            $po->status->transitionTo(Ditolak::class);
        });

        return $po->fresh();
    }
}
