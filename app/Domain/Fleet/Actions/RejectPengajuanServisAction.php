<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\States\Ditolak;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Bagian 21.8 #2 — Tolak ajuan oleh Ketua Divisi Armada.
 */
class RejectPengajuanServisAction
{
    public function execute(PengajuanServisArmada $pengajuan, User $user, ?string $catatan = null): PengajuanServisArmada
    {
        DB::transaction(function () use ($pengajuan, $user, $catatan) {
            $pengajuan->update([
                'catatan_acc' => $catatan,
                'disetujui_oleh' => $user->id,
                'tanggal_acc' => now()->toDateString(),
            ]);
            $pengajuan->status->transitionTo(Ditolak::class);
        });

        return $pengajuan->fresh();
    }
}
