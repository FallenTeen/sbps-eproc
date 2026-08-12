<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\ProductionSession;

class CalculateProductionRevenueAction
{
    public function execute(ProductionSession $session): float
    {
        $hargaJual = $session->produk->hargaJual()
            ->where('berlaku_dari', '<=', $session->tanggal)
            ->where(function ($q) use ($session) {
                $q->whereNull('berlaku_sampai')
                  ->orWhere('berlaku_sampai', '>=', $session->tanggal);
            })->first();

        return $session->hasil_output * ($hargaJual->harga ?? 0);
    }
}
