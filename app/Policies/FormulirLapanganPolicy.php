<?php

namespace App\Policies;

use App\Domain\Attendance\Models\FormulirLapangan;
use App\Models\User;

class FormulirLapanganPolicy
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
            'Mandor Titik',
        ])
            || $user->hasPermissionTo('manage formulir lapangan')
            || $user->hasPermissionTo('view hr')
            || $user->hasPermissionTo('manage hr');
    }

    public function view(User $user, FormulirLapangan $formulir): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
            'Mandor Proyek',
            'Mandor Titik',
            'Driver Standby',
            'Driver Kondisional',
            'SDM Lapangan Kondisional',
        ])
            || $user->hasPermissionTo('manage formulir lapangan')
            || $user->hasPermissionTo('manage hr');
    }

    public function update(User $user, FormulirLapangan $formulir): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, FormulirLapangan $formulir): bool
    {
        return $user->hasRole('Koordinator SDM')
            || $user->hasPermissionTo('manage formulir lapangan')
            || $user->hasPermissionTo('manage hr');
    }
}
