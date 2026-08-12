<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\QCSample;
use Carbon\Carbon;

class RecordQCSampleAction
{
    public function execute(array $data): QCSample
    {
        return QCSample::create([
            'production_session_id' => $data['production_session_id'],
            'jenis_uji' => $data['jenis_uji'],
            'nilai_slump' => $data['nilai_slump'] ?? null,
            'tanggal_uji_tekan_rencana' => $data['tanggal_uji_tekan_rencana'] ?? Carbon::now()->addDays(28),
            'catatan' => $data['catatan'] ?? null,
            'status' => 'menunggu_hasil',
        ]);
    }
}
