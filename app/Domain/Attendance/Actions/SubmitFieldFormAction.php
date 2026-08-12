<?php

namespace App\Domain\Attendance\Actions;

use App\Domain\Attendance\Models\FormulirLapangan;

class SubmitFieldFormAction
{
    public function execute(array $data): FormulirLapangan
    {
        return FormulirLapangan::create([
            'presensi_id' => $data['presensi_id'],
            'kondisi_area' => $data['kondisi_area'] ?? null,
            'aktivitas_dilakukan' => $data['aktivitas_dilakukan'],
            'kendala' => $data['kendala'] ?? null,
            'foto' => $data['foto'] ?? null,
            'catatan_tambahan' => $data['catatan_tambahan'] ?? null,
        ]);
    }
}
