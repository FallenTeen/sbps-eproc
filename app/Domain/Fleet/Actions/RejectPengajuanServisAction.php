<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\States\Diajukan;
use App\Domain\Fleet\States\Ditolak;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Bagian 21.8 #2 - Tolak ajuan oleh Ketua Divisi Armada.
 */
class RejectPengajuanServisAction
{
    public function execute(PengajuanServisArmada $pengajuan, User $user, ?string $catatan = null): PengajuanServisArmada
    {
        if (! $pengajuan->status instanceof Diajukan) {
            throw ValidationException::withMessages([
                'status' => 'Pengajuan servis ini sudah diproses dan tidak dapat ditolak lagi.',
            ]);
        }

        DB::transaction(function () use ($pengajuan, $user, $catatan) {
            $pengajuan->update([
                'catatan_acc' => $catatan,
                'disetujui_oleh' => $user->id,
                'tanggal_acc' => now()->toDateString(),
            ]);
            $pengajuan->status->transitionTo(Ditolak::class);

            activity('fleet')
                ->causedBy($user)
                ->performedOn($pengajuan)
                ->withProperties(['status' => 'ditolak', 'alasan' => $catatan])
                ->log('Menolak ajuan servis armada');
        });

        return $pengajuan->fresh();
    }
}
