<?php

namespace App\Policies;

use App\Domain\Procurement\Models\Supplier;
use App\Models\User;

class SupplierPolicy
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
            || $user->hasPermissionTo('manage supplier')
            || $user->hasPermissionTo('view supplier')
            || $user->hasPermissionTo('manage procurement')
            || $user->hasPermissionTo('view procurement')
            || $user->isKetuaDivisi();
    }

    public function view(User $user, Supplier $supplier): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('Koordinator Procurement')
            || $user->hasPermissionTo('manage supplier')
            || $user->hasPermissionTo('manage procurement');
    }

    public function update(User $user, Supplier $supplier): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return $this->create($user);
    }
}
