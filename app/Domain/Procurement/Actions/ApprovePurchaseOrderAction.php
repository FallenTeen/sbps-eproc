<?php

namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\PurchaseOrderApproval;
use App\Domain\Procurement\States\Disetujui;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApprovePurchaseOrderAction
{
    public function execute(PurchaseOrder $po, ?string $catatan = null): PurchaseOrder
    {
        DB::transaction(function () use ($po, $catatan) {
            // Simpan approval
            PurchaseOrderApproval::create([
                'purchase_order_id' => $po->id,
                'approved_by' => Auth::id(),
                'status' => 'disetujui',
                'catatan' => $catatan,
            ]);

            // Transisi ke Disetujui
            $po->status->transitionTo(Disetujui::class);
        });

        return $po->fresh();
    }
}
