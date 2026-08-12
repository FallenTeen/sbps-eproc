<?php

namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\HargaBeli;

class SetHargaBeliAction
{
    public function execute(BahanBaku $bahanBaku, $supplierId, $harga, $berlakuDari): HargaBeli
    {
        // Tutup harga lama yang masih aktif
        HargaBeli::where('bahan_baku_id', $bahanBaku->id)
            ->where('supplier_id', $supplierId)
            ->whereNull('berlaku_sampai')
            ->update(['berlaku_sampai' => $berlakuDari->subDay()]);

        return HargaBeli::create([
            'bahan_baku_id' => $bahanBaku->id,
            'supplier_id' => $supplierId,
            'harga' => $harga,
            'berlaku_dari' => $berlakuDari,
        ]);
    }
}
