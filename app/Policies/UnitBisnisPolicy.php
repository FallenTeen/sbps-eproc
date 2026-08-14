<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Core\Models\UnitBisnis;

class UnitBisnisPolicy
{
    /**
     * Super-admin shortcut: Owner bypass semua cek individual.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('Owner')) {
            return true;
        }
        return null;
    }

    /**
     * Unit Bisnis adalah master data fondasi (dipakai semua modul),
     * sehingga CRUD-nya dibatasi hanya untuk Owner dan Admin tertentu
     * (Admin / Admin Keuangan), sesuai User::isAdmin().
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, UnitBisnis $unitBisnis): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, UnitBisnis $unitBisnis): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, UnitBisnis $unitBisnis): bool
    {
        return $user->isAdmin();
    }
}
