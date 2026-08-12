<?php
namespace App\Domain\Production\Actions;
use App\Domain\Production\Models\Pengiriman;

class CompleteDeliveryAction
{
    public function execute(Pengiriman $pengiriman, array $data): Pengiriman
    {
        $pengiriman->update([
            'waktu_tiba_tujuan' => $data['waktu_tiba_tujuan'] ?? now(),
            'waktu_selesai_tuang' => $data['waktu_selesai_tuang'] ?? now(),
            'status' => 'selesai',
            'catatan' => $data['catatan'] ?? null,
        ]);

        // Validasi batas waktu tuang
        $batas = now()->addMinutes(120); // configurable
        if ($pengiriman->waktu_selesai_tuang > $pengiriman->waktu_muat->addMinutes(120)) {
            // Warning (tidak block)
// Kirim notifikasi
        }

        return $pengiriman;
    }
}
