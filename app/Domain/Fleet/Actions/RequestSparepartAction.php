<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\PengajuanServisSparepart;
use App\Domain\Fleet\States\MenungguSparepart;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Bagian 21.8 #3→#4 — Workshop ajukan sparepart ke Inventory.
 * Menyimpan daftar item yang dibutuhkan (status `diajukan`) dan memastikan
 * status pengajuan jadi `menunggu_sparepart`.
 */
class RequestSparepartAction
{
    public function execute(PengajuanServisArmada $pengajuan, User $user, array $items): PengajuanServisArmada
    {
        DB::transaction(function () use ($pengajuan, $items) {
            $pengajuan->update([
                'butuh_sparepart' => true,
                'status_pengadaan_sparepart' => 'diajukan',
            ]);

            foreach ($items as $item) {
                if (empty($item['nama_item'])) {
                    continue;
                }
                PengajuanServisSparepart::create([
                    'pengajuan_servis_armada_id' => $pengajuan->id,
                    'nama_item' => $item['nama_item'],
                    'jumlah' => $item['jumlah'] ?? 1,
                    'satuan' => $item['satuan'] ?? null,
                    'nominal' => $item['nominal'] ?? 0,
                    'tanggal' => $item['tanggal'] ?? now()->toDateString(),
                    'status' => 'diajukan',
                ]);
            }

            if (! $pengajuan->status->equals(MenungguSparepart::class)) {
                $pengajuan->status->transitionTo(MenungguSparepart::class);
            }
        });

        return $pengajuan->fresh();
    }
}
