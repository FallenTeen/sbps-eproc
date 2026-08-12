<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ArmadaDriver;

class AssignDriverToArmadaAction
{
    public function execute(array $data): ArmadaDriver
    {
        // Tutup assignment lama
        ArmadaDriver::where('armada_id', $data['armada_id'])
            ->where('status', 'aktif')
            ->update(['status' => 'selesai', 'tanggal_selesai' => now()]);

        return ArmadaDriver::create([
            'armada_id' => $data['armada_id'],
            'karyawan_id' => $data['karyawan_id'],
            'tipe' => $data['tipe'] ?? 'standby',
            'tanggal_mulai' => $data['tanggal_mulai'] ?? now(),
            'status' => 'aktif',
        ]);
    }
}
