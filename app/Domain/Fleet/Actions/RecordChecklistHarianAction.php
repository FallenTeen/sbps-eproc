<?php
namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
class RecordChecklistHarianAction
{
    public function execute($checkable, array $data): ArmadaChecklistHarian
    {
        $checklist = $checkable->checklists()->create([
            'tanggal' => $data['tanggal'] ?? now(),
            'kondisi_baik' => $data['kondisi_baik'],
            'item_bermasalah' => $data['item_bermasalah'] ?? null,
            'dicatat_oleh_karyawan_id' => $data['dicatat_oleh_karyawan_id'],
        ]);

        if (!$data['kondisi_baik']) {
            // Kirim notifikasi ke koordinator
            // (bisa pakai Notification Center)
        }

        return $checklist;
    }
}
