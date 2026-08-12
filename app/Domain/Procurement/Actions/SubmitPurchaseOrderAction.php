<?php

namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\States\Diajukan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SubmitPurchaseOrderAction
{
    public function execute(PurchaseOrder $po): PurchaseOrder
    {
        DB::transaction(function () use ($po) {
            // Cek apakah ada item
            if ($po->items->count() === 0) {
                throw new \Exception('PO tidak memiliki item');
            }

            // Validasi RAB
            (new ValidateBudgetAction())->execute($po);

            // Hitung total
            $total = $po->items->sum('subtotal');
            $po->total = $total;
            $po->save();

            // Transisi status ke Diajukan
            $po->status->transitionTo(Diajukan::class);

            // Route approval (tier)
            (new RouteApprovalAction())->execute($po);
        });

        return $po->fresh();
    }

    public function executeAsOwner(PurchaseOrder $po): PurchaseOrder
    {
        DB::transaction(function () use ($po) {
            if ($po->items->count() === 0) {
                throw new \Exception('PO tidak memiliki item');
            }

            $total = $po->items->sum('subtotal');
            $po->total = $total;
            $po->rab_overridden = true;
            $po->save();

            $po->status->transitionTo(Diajukan::class);
            (new RouteApprovalAction())->execute($po);
        });

        return $po->fresh();
    }
}
