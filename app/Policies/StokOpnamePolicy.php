<?php

namespace App\Policies;

use App\Domain\Inventory\Models\StokOpname;
use App\Models\User;

class StokOpnamePolicy
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
        return $user->hasPermissionTo('view stok opname')
            || $user->hasPermissionTo('manage stok opname')
            || $user->hasPermissionTo('view procurement')
            || $user->hasPermissionTo('manage procurement');
    }

    public function view(User $user, StokOpname $stokOpname): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage stok opname')
            || $user->hasPermissionTo('manage procurement');
    }

    public function update(User $user, StokOpname $stokOpname): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, StokOpname $stokOpname): bool
    {
        return $this->create($user);
    }

    public function restore(User $user, StokOpname $stokOpname): bool
    {
        return $this->create($user);
    }

    public function forceDelete(User $user, StokOpname $stokOpname): bool
    {
        return $this->create($user);
    }
}