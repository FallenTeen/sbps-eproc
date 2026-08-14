<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Finance\Models\AkunKasBank;

class AkunKasBankPolicy
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
                    'Admin Keuangan',
                    'Ketua Divisi Finance',
                    'Ketua Divisi Keuangan',
                ])
            || $user->hasPermissionTo('manage finance')
            || $user->hasPermissionTo('manage kas')
            || $user->hasPermissionTo('view finance');
    }

    public function view(User $user, AkunKasBank $akunKas): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $akunKas->unit_bisnis_id);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
                    'Admin Keuangan',
                    'Ketua Divisi Finance',
                    'Ketua Divisi Keuangan',
                ])
            || $user->hasPermissionTo('manage finance')
            || $user->hasPermissionTo('manage kas');
    }

    public function update(User $user, AkunKasBank $akunKas): bool
    {
        if (!$this->create($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $akunKas->unit_bisnis_id);
    }

    public function transfer(User $user): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, AkunKasBank $akunKas): bool
    {
        return $user->hasRole('Admin Keuangan') || $user->hasPermissionTo('manage finance');
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if ($user->hasRole('Admin Keuangan')) {
            return true;
        }
        if (!$user->unit_bisnis_id || !$resourceUnitId) {
            return true;
        }
        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
