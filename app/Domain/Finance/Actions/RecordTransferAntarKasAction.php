<?php

namespace App\Domain\Finance\Actions;

use App\Domain\Finance\Models\TransferAntarKas;
use App\Domain\Finance\Models\MutasiKasBank;
use Illuminate\Support\Facades\Auth;

class RecordTransferAntarKasAction
{
    public function execute(array $data): TransferAntarKas
    {
        $transfer = TransferAntarKas::create([
            'dari_akun_kas_bank_id' => $data['dari_akun_kas_bank_id'],
            'ke_akun_kas_bank_id' => $data['ke_akun_kas_bank_id'],
            'jumlah' => $data['jumlah'],
            'tanggal' => $data['tanggal'] ?? now(),
            'catatan' => $data['catatan'] ?? null,
            'created_by' => Auth::id(),
        ]);

        // Buat mutasi keluar (dari)
        MutasiKasBank::create([
            'akun_kas_bank_id' => $data['dari_akun_kas_bank_id'],
            'kategori' => 'TRANSFER_KELUAR',
            'tipe' => 'keluar',
            'jumlah' => $data['jumlah'],
            'referensi_type' => TransferAntarKas::class,
            'referensi_id' => $transfer->id,
            'tanggal' => $data['tanggal'] ?? now(),
            'catatan' => "Transfer ke kas lain",
            'created_by' => Auth::id(),
        ]);

        // Buat mutasi masuk (ke)
        MutasiKasBank::create([
            'akun_kas_bank_id' => $data['ke_akun_kas_bank_id'],
            'kategori' => 'TRANSFER_MASUK',
            'tipe' => 'masuk',
            'jumlah' => $data['jumlah'],
            'referensi_type' => TransferAntarKas::class,
            'referensi_id' => $transfer->id,
            'tanggal' => $data['tanggal'] ?? now(),
            'catatan' => "Transfer dari kas lain",
            'created_by' => Auth::id(),
        ]);

        return $transfer;
    }
}
