<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use Illuminate\Support\Facades\DB;

class AssignPenanggungJawabArmadaAction
{
    public function execute(array $data): ArmadaPenanggungJawab
    {
        return DB::transaction(function () use ($data) {
            return ArmadaPenanggungJawab::create([
                'armada_id' => $data['armada_id'],
                'karyawan_id' => $data['karyawan_id'],
                'peran' => $data['peran'] ?? 'utama',
                'mulai_dari' => $data['mulai_dari'] ?? now(),
                'sampai' => $data['sampai'] ?? null, // null = masih aktif
                'alasan' => $data['alasan'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);
        });
    }
}
