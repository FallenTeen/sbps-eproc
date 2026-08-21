<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\ProductionSession;

class CalculateProductionRevenueAction
{
    public function execute(ProductionSession $session): float
    {
        $session->load('produk');
        $through = ($session->selesai ?? $session->mulai);

        $hargaJual = $session->produk->hargaJual()
            ->where('berlaku_dari', '<=', $through)
            ->where(function ($q) use ($through) {
                $q->whereNull('berlaku_sampai')
                    ->orWhere('berlaku_sampai', '>=', $through);
            })
            ->orderBy('berlaku_dari', 'desc')
            ->first();

        return (float) $session->hasil_output * (float) ($hargaJual->harga ?? 0);
    }
}
