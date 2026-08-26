<?php

namespace App\Policies;

use App\Domain\Procurement\Models\BahanBaku;
use App\Models\User;

class BahanBakuPolicy
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
            'Koordinator Procurement',
            'Admin Keuangan',
        ])
            || $user->hasPermissionTo('manage bahan baku')
            || $user->hasPermissionTo('view bahan baku')
            || $user->hasPermissionTo('manage procurement')
            || $user->hasPermissionTo('view procurement')
            || $user->isKetuaDivisi();
    }

    public function view(User $user, BahanBaku $bahanBaku): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('Koordinator Procurement')
            || $user->hasPermissionTo('manage bahan baku')
            || $user->hasPermissionTo('manage procurement');
    }

    public function update(User $user, BahanBaku $bahanBaku): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, BahanBaku $bahanBaku): bool
    {
        return $this->create($user);
    }

    public function setHarga(User $user, BahanBaku $bahanBaku): bool
    {
        return $this->create($user);
    }
}
