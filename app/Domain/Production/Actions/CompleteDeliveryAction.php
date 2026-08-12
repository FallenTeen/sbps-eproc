<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\Pengiriman;

class CompleteDeliveryAction
{
    public const BATAS_TUANG_MENIT = 120; // configurable (Bagian 18.2)

    public function execute(Pengiriman $pengiriman, array $data): Pengiriman
    {
        $pengiriman->load('session');

        $pengiriman->update([
            'waktu_tiba_tujuan' => $data['waktu_tiba_tujuan'] ?? now(),
            'waktu_selesai_tuang' => $data['waktu_selesai_tuang'] ?? now(),
            'status' => 'selesai',
            'catatan' => $data['catatan'] ?? null,
        ]);

        // Validasi batas waktu tuang: warning, bukan block (normalisasi alur Bagian 18.2)
        if ($pengiriman->waktu_muat && $pengiriman->waktu_selesai_tuang) {
            $durasiMenit = (float) $pengiriman->waktu_muat->diffInMinutes($pengiriman->waktu_selesai_tuang);
            if ($durasiMenit > self::BATAS_TUANG_MENIT) {
                $flag = "Waktu tuang melebihi batas {$durasiMenit} menit (>) " . self::BATAS_TUANG_MENIT . " menit — berpotensi terganggu kualitasnya.";
                $pengiriman->update([
                    'catatan' => trim(($data['catatan'] ?? '') . " | " . $flag, " |"),
                ]);
            }
        }

        return $pengiriman->fresh();
    }
}