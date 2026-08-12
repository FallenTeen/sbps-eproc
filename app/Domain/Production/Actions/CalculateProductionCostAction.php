<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\ProductionSession;
use App\Domain\Procurement\Actions\GetCurrentHargaAction;

class CalculateProductionCostAction
{
    public function execute(ProductionSession $session): float
    {
        $durasi = $session->mulai->diffInHours($session->selesai);
        $biayaMesin = $durasi * ($session->mesin->biaya_per_jam ?? 0);

        $biayaBahan = 0;
        foreach ($session->items as $item) {
            $harga = (new GetCurrentHargaAction())->execute($item->bahanBaku, null, $session->tanggal);
            $biayaBahan += $item->jumlah_terpakai * ($harga ?? 0);
        }

        return $biayaMesin + $biayaBahan;
    }
}
