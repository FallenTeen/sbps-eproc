<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\States\Disetujui;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Bagian 21.8 #2 — ACC ajuan oleh Ketua Divisi Armada.
 */
class ApprovePengajuanServisAction
{
    public function execute(PengajuanServisArmada $pengajuan, User $user, ?string $catatan = null): PengajuanServisArmada
    {
        DB::transaction(function () use ($pengajuan, $user, $catatan) {
            $pengajuan->update([
                'catatan_acc' => $catatan,
                'disetujui_oleh' => $user->id,
                'tanggal_acc' => now()->toDateString(),
            ]);
            $pengajuan->status->transitionTo(Disetujui::class);
        });

        return $pengajuan->fresh();
    }
}
