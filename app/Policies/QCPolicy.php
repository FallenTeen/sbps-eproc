<?php

namespace App\Policies;

use App\Domain\Production\Models\QCSample;
use App\Models\User;

class QCPolicy
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
            'Koordinator CBP',
            'Ketua Divisi Produksi CBP',
            'Mandor Proyek',
        ])
            || $user->hasPermissionTo('manage qc')
            || $user->hasPermissionTo('manage production cbp')
            || $user->hasPermissionTo('view production');
    }

    public function view(User $user, QCSample $qc): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
            'Koordinator CBP',
            'Ketua Divisi Produksi CBP',
            'Mandor Proyek',
        ])
            || $user->hasPermissionTo('manage qc')
            || $user->hasPermissionTo('manage production cbp');
    }

    public function update(User $user, QCSample $qc): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, QCSample $qc): bool
    {
        return $this->create($user);
    }

    public function recordResult(User $user, QCSample $qc): bool
    {
        return $this->create($user);
    }
}
