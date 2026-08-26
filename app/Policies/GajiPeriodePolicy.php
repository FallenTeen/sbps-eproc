<?php

namespace App\Policies;

use App\Domain\HR\Models\GajiPeriode;
use App\Models\User;

class GajiPeriodePolicy
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
            'Admin Keuangan',
            'Ketua Divisi Kontraktor',
        ])
            || $user->hasPermissionTo('manage payroll')
            || $user->hasPermissionTo('view payroll')
            || $user->hasPermissionTo('manage hr');
    }

    public function view(User $user, GajiPeriode $periode): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
            'Koordinator SDM',
            'Admin Keuangan',
        ])
            || $user->hasPermissionTo('manage payroll')
            || $user->hasPermissionTo('manage hr');
    }

    public function generate(User $user): bool
    {
        return $this->create($user);
    }

    public function update(User $user, GajiPeriode $periode): bool
    {
        return $this->create($user);
    }

    public function pay(User $user, GajiPeriode $periode): bool
    {
        return $this->create($user);
    }

    public function review(User $user, GajiPeriode $periode): bool
    {
        return $this->create($user);
    }

    public function addKomponen(User $user, GajiPeriode $periode): bool
    {
        return $this->create($user);
    }

    public function deleteKomponen(User $user, GajiPeriode $periode): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, GajiPeriode $periode): bool
    {
        return $user->hasRole('Koordinator SDM') || $user->hasPermissionTo('manage hr');
    }
}
