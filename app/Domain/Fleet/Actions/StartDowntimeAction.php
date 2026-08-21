<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\DowntimeLog;

class StartDowntimeAction
{
    /**
     * Mulai downtime tak terjadwal
     *
     * @param  mixed  $serviceable  Armada atau MesinProduksi
     */
    public function execute($serviceable, array $data): DowntimeLog
    {
        return $serviceable->downtimes()->create([
            'mulai' => now(),
            'penyebab' => $data['penyebab'] ?? null,
            'kategori' => $data['kategori'] ?? 'kerusakan',
            'catatan' => $data['catatan'] ?? null,
        ]);
    }
}
