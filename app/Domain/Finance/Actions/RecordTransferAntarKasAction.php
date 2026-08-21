<?php

namespace App\Domain\Finance\Actions;

use App\Domain\Finance\Models\TransferAntarKas;
use Illuminate\Support\Facades\DB;

class RecordTransferAntarKasAction
{
    public function execute(array $data, string $userId): TransferAntarKas
    {
        return DB::transaction(function () use ($data, $userId) {
            // 1. Buat record TransferAntarKas
            $transfer = TransferAntarKas::create([
                'dari_akun_kas_bank_id' => $data['dari_akun_kas_bank_id'],
                'ke_akun_kas_bank_id' => $data['ke_akun_kas_bank_id'],
                'jumlah' => $data['jumlah'],
                'tanggal' => $data['tanggal'],
                'catatan' => $data['catatan'] ?? null,
                'created_by' => $userId,
            ]);

            $transfer->load(['dariAkun', 'keAkun']);

            // 2. Buat mutasi keluar dari akun asal
            $transfer->dariAkun->mutasis()->create([
                'kategori' => 'transfer_keluar',
                'tipe' => 'keluar',
                'jumlah' => $data['jumlah'],
                'tanggal' => $data['tanggal'],
                'catatan' => 'Transfer ke kas tujuan',
                'referensi_type' => TransferAntarKas::class,
                'referensi_id' => $transfer->id,
                'created_by' => $userId,
            ]);

            // 3. Buat mutasi masuk ke akun tujuan
            $transfer->keAkun->mutasis()->create([
                'kategori' => 'transfer_masuk',
                'tipe' => 'masuk',
                'jumlah' => $data['jumlah'],
                'tanggal' => $data['tanggal'],
                'catatan' => 'Terima transfer dari kas asal',
                'referensi_type' => TransferAntarKas::class,
                'referensi_id' => $transfer->id,
                'created_by' => $userId,
            ]);

            return $transfer;
        });
    }
}
