<?php

namespace App\Domain\HR\Actions;

use App\Domain\HR\Models\Cuti;

class SubmitCutiAction
{
    public function execute(array $data): Cuti
    {
        return Cuti::create([
            'karyawan_id' => $data['karyawan_id'],
            'tipe' => $data['tipe'],
            'tanggal_mulai' => $data['tanggal_mulai'],
            'tanggal_selesai' => $data['tanggal_selesai'],
            'catatan' => $data['catatan'] ?? null,
            'status' => 'diajukan',
        ]);
    }
}
