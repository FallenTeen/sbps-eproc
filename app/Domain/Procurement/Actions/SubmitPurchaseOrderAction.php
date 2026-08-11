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

            // Catat audit log nanti
        });

        return $po->fresh();
    }
}
