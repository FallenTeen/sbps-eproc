<?php

namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\Supplier;

class GetCurrentHargaAction
{
    public function execute(BahanBaku $bahanBaku, Supplier $supplier, $tanggal = null): ?float
    {
        $tanggal = $tanggal ?? now();
        $harga = $bahanBaku->hargaBeli()
            ->where('supplier_id', $supplier->id)
            ->where('berlaku_dari', '<=', $tanggal)
            ->where(function ($q) use ($tanggal) {
                $q->whereNull('berlaku_sampai')
                    ->orWhere('berlaku_sampai', '>=', $tanggal);
            })
            ->first();

        return $harga ? $harga->harga : null;
    }
}
