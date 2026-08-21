<?php

namespace App\Domain\Finance\Actions;

use App\Domain\Finance\Models\Invoice;

class GetPiutangOutstandingAction
{
    public function execute($proyekId = null, $unitBisnisId = null): float
    {
        $query = Invoice::where('status', '!=', 'lunas');
        if ($proyekId) {
            $query->where('proyek_id', $proyekId);
        }
        if ($unitBisnisId) {
            $query->where('unit_bisnis_id', $unitBisnisId);
        }

        $totalPiutang = 0;
        foreach ($query->get() as $invoice) {
            $total = $invoice->items->sum('subtotal');
            $paid = $invoice->pembayaranKlien->sum('jumlah');
            $totalPiutang += ($total - $paid);
        }

        return $totalPiutang;
    }
}
