<?php

namespace App\Domain\Core\Actions;

use App\Domain\Core\Models\Rab;

class CompareRABRealisasiAction
{
    public function execute(Rab $rab): array
    {
        $realisasi = (new GetRABRealisasiAction)->execute($rab);
        $selisih = $rab->rencana - $realisasi;
        $persentase = $rab->rencana > 0 ? ($realisasi / $rab->rencana) * 100 : 0;

        return [
            'rencana' => $rab->rencana,
            'realisasi' => $realisasi,
            'selisih' => $selisih,
            'persentase' => round($persentase, 2),
        ];
    }
}
