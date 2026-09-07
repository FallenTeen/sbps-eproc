<?php

namespace App\Policies;

use App\Domain\Fleet\Models\HelperArmada;
use App\Models\User;

/**
 * Helper Armada — visibility OBJECT-LEVEL (Bagian 21.6), bukan role-based generik.
 *
 * Hanya PIC yang membuat helper (created_by) atau PIC aktif armada yang boleh
 * melihat/mengelola helper & presensinya. Management (Owner/Koordinator GCS)
 * secara sengaja TIDAK diberi akses — sesuai keputusan rapat.
 */
class HelperArmadaPolicy
{
    public function viewAny(User $user, $armada): bool
    {
        return $armada->isActivePicFor($user->karyawan);
    }

    public function view(User $user, HelperArmada $helper): bool
    {
        return $this->owns($user, $helper);
    }

    public function create(User $user, $armada): bool
    {
        return $armada->isActivePicFor($user->karyawan);
    }

    public function update(User $user, HelperArmada $helper): bool
    {
        return $this->owns($user, $helper);
    }

    public function delete(User $user, HelperArmada $helper): bool
    {
        return $this->owns($user, $helper);
    }

    /**
     * Creator helper boleh terus kelola, atau PIC aktif armada saat ini.
     */
    protected function owns(User $user, HelperArmada $helper): bool
    {
        return $helper->created_by === $user->id
            || $helper->armada->isActivePicFor($user->karyawan);
    }
}