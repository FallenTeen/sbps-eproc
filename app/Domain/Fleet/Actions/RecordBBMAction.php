<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\BbmLog;

class RecordBBMAction
{
    public function execute($serviceable, array $data): BbmLog
    {
        return $serviceable->bbmLogs()->create([
            'tanggal' => $data['tanggal'] ?? now(),
            'liter' => $data['liter'],
            'biaya' => $data['biaya'] ?? null,
            'jam_operasional_saat_isi' => $data['jam_operasional_saat_isi'] ?? null,
            'purchase_order_id' => $data['purchase_order_id'] ?? null,
            'dicatat_oleh' => auth()->id(),
        ]);
    }
}
