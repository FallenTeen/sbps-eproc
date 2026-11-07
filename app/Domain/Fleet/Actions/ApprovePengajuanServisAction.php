<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\States\Diajukan;
use App\Domain\Fleet\States\Disetujui;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Bagian 21.8 #2 - ACC ajuan oleh Ketua Divisi Armada.
 */
class ApprovePengajuanServisAction
{
    public function execute(PengajuanServisArmada $pengajuan, User $user, ?string $catatan = null): PengajuanServisArmada
    {
        if (! $pengajuan->status instanceof Diajukan) {
            throw ValidationException::withMessages([
                'status' => 'Pengajuan servis ini sudah diproses dan tidak dapat disetujui lagi.',
            ]);
        }

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
