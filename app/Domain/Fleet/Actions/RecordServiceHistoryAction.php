<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Fleet\Models\ServiceInterval;
use Illuminate\Support\Facades\Schema;

class RecordServiceHistoryAction
{
    public function execute($serviceable, array $data): ServiceHistory
    {
        $history = $serviceable->serviceHistories()->create([
            'tanggal' => $data['tanggal'],
            'jenis_servis' => $data['jenis_servis'] ?? null,
            'biaya' => $data['biaya'] ?? 0,
            'notes' => $data['notes'] ?? null,
            'purchase_order_id' => $data['purchase_order_id'] ?? null,
        ]);

        // Update tanggal_servis_terakhir di serviceable (jika kolomnya ada)
        if (Schema::hasColumn($serviceable->getTable(), 'tanggal_servis_terakhir')) {
            $serviceable->update(['tanggal_servis_terakhir' => $data['tanggal']]);
        }

        // Update interval (perbarui tanggal terakhir)
        $interval = ServiceInterval::firstOrCreate(
            ['serviceable_type' => get_class($serviceable), 'serviceable_id' => $serviceable->id],
            ['interval_bulan' => 2]
        );

        return $history;
    }
}
