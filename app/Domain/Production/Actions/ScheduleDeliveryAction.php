<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\Pengiriman;

class ScheduleDeliveryAction
{
    public function execute(array $data): Pengiriman
    {
        return Pengiriman::create([
            'production_session_id' => $data['production_session_id'],
            'armada_id' => $data['armada_id'] ?? null,
            'driver_karyawan_id' => $data['driver_karyawan_id'] ?? null,
            'tujuan_alamat' => $data['tujuan_alamat'],
            'waktu_muat' => $data['waktu_muat'],
            'status' => 'dijadwalkan',
        ]);
    }
}
