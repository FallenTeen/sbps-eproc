<?php

namespace App\Policies;

use App\Domain\HR\Models\Karyawan;
use App\Models\User;

class KaryawanPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('Owner')) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasRole([
            'Koordinator SDM',
            'Ketua Divisi Kontraktor',
            'Mandor Proyek',
            'Admin Keuangan',
        ])
            || $user->hasPermissionTo('manage hr')
            || $user->hasPermissionTo('view hr');
    }

    public function view(User $user, Karyawan $karyawan): bool
    {
        if ($this->viewAny($user)) {
            return true;
        }

        // Karyawan melihat profil diri sendiri
        return $karyawan->user_id && (string) $karyawan->user_id === (string) $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
            'Koordinator SDM',
            'Ketua Divisi Kontraktor',
        ])
            || $user->hasPermissionTo('manage hr');
    }

    public function update(User $user, Karyawan $karyawan): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, Karyawan $karyawan): bool
    {
        return $user->hasRole('Koordinator SDM') || $user->hasPermissionTo('manage hr');
    }

    public function assignTitik(User $user, Karyawan $karyawan): bool
    {
        return $this->create($user);
    }

    public function removeTitik(User $user, Karyawan $karyawan): bool
    {
        return $this->create($user);
    }

    public function updateStatus(User $user, Karyawan $karyawan): bool
    {
        return $this->update($user, $karyawan);
    }
}
