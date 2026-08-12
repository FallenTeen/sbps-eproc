<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\RuteTarif;

class GetCurrentRuteTarifAction
{
    public function execute($asal, $tujuan, $tanggal = null): ?RuteTarif
    {
        $tanggal = $tanggal ?? now();
        return RuteTarif::where('lokasi_asal', $asal)
            ->where('lokasi_tujuan', $tujuan)
            ->where('berlaku_dari', '<=', $tanggal)
            ->where(function ($q) use ($tanggal) {
                $q->whereNull('berlaku_sampai')
                    ->orWhere('berlaku_sampai', '>=', $tanggal);
            })
            ->first();
    }
}
