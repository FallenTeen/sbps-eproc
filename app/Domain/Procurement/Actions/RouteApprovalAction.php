<?php

namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\States\MenungguApprovalFinance;
use App\Domain\Procurement\States\MenungguApprovalOwner;
use Illuminate\Support\Facades\Config;

class RouteApprovalAction
{
    public function execute(PurchaseOrder $po): void
    {
        $thresholdFinance = Config::get('procurement.approval_threshold.finance', 5000000);
        $thresholdOwner = Config::get('procurement.approval_threshold.owner', 20000000);

        if ($po->total > $thresholdOwner) {
            $po->status->transitionTo(MenungguApprovalOwner::class);
        } elseif ($po->total > $thresholdFinance) {
            $po->status->transitionTo(MenungguApprovalFinance::class);
        } else {
            // Jika total di bawah threshold finance, bisa langsung disetujui otomatis?
            // Atau tetap masuk finance? Sesuai manual: minimal finance.
            $po->status->transitionTo(MenungguApprovalFinance::class);
        }
    }
}
