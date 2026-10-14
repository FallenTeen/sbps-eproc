<?php

namespace App\Policies;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\HelperArmada;
use App\Models\User;

/**
 * Helper Armada (Bagian 21.6 / v7).
 *
 * Pengelolaan (create/update/delete) kini HANYA untuk pemegang permission
 * `manage helper armada` (Ketua Armada / HR / Owner). Driver mengajukan helper
 * di luar aplikasi, jadi tidak lagi boleh create.
 *
 * Melihat & mengabsen helper (view/presensi) tetap boleh: pemegang
 * `manage helper armada` ATAU PIC/driver aktif armada terkait.
 */
class HelperArmadaPolicy
{
    public function viewAny(User $user, ?Armada $armada = null): bool
    {
        return $user->can('manage helper armada') || ($armada && $this->holdsArmada($user, $armada));
    }

    public function view(User $user, HelperArmada $helper): bool
    {
        return $user->can('manage helper armada') || $this->holdsArmada($user, $helper->armada);
    }

    /**
     * Mengabsenkan helper (check-in/out). Boleh manajer atau PIC/driver pemegang armada.
     */
    public function presensi(User $user, HelperArmada $helper): bool
    {
        return $user->can('manage helper armada') || $this->holdsArmada($user, $helper->armada);
    }

    public function create(User $user, Armada $armada): bool
    {
        return $user->can('manage helper armada');
    }

    public function update(User $user, HelperArmada $helper): bool
    {
        return $user->can('manage helper armada');
    }

    public function delete(User $user, HelperArmada $helper): bool
    {
        return $user->can('manage helper armada');
    }

    /**
     * PIC aktif armada, atau driver aktif yang memegang armada tersebut.
     */
    protected function holdsArmada(User $user, ?Armada $armada): bool
    {
        if (! $armada || ! $user->karyawan) {
            return false;
        }

        if ($armada->isActivePicFor($user->karyawan)) {
            return true;
        }

        return $armada->driverAssignments()
            ->where('karyawan_id', $user->karyawan->id)
            ->where('status', 'aktif')
            ->exists();
    }
}
