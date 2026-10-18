<?php

namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\HargaBeli;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SetHargaBeliAction
{
    public function execute(
        BahanBaku $bahanBaku,
        $supplierId,
        $harga,
        $berlakuDari
    ): HargaBeli {
        return DB::transaction(function () use (
            $bahanBaku,
            $supplierId,
            $harga,
            $berlakuDari
        ) {
            // Ubah tanggal dari string menjadi objek Carbon.
            $tanggalMulai = Carbon::parse($berlakuDari)->startOfDay();

            // Tutup harga lama yang masih aktif.
            HargaBeli::where('bahan_baku_id', $bahanBaku->id)
                ->where('supplier_id', $supplierId)
                ->whereNull('berlaku_sampai')
                ->update([
                    'berlaku_sampai' => $tanggalMulai->copy()->subDay(),
                ]);

            // Simpan harga baru.
            return HargaBeli::create([
                'bahan_baku_id' => $bahanBaku->id,
                'supplier_id' => $supplierId,
                'harga' => $harga,
                'berlaku_dari' => $tanggalMulai,
            ]);
        });
    }
}