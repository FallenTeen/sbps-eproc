<?php

namespace App\Policies;

use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use App\Models\User;

class ArmadaPenanggungJawabPolicy
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
            'Koordinator GCS',
            'Ketua Divisi Armada',
            'Admin Keuangan',
        ])
            || $user->hasPermissionTo('manage fleet')
            || $user->hasPermissionTo('view fleet');
    }

    public function view(User $user, ArmadaPenanggungJawab $penanggungJawab): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $penanggungJawab->armada?->unit_bisnis_id);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
            'Koordinator GCS',
            'Ketua Divisi Armada',
        ])
            || $user->hasPermissionTo('manage fleet');
    }

    public function update(User $user, ArmadaPenanggungJawab $penanggungJawab): bool
    {
        if (! $this->create($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $penanggungJawab->armada?->unit_bisnis_id);
    }

    public function delete(User $user, ArmadaPenanggungJawab $penanggungJawab): bool
    {
        if (! ($user->hasRole('Ketua Divisi Armada')
            || $user->hasPermissionTo('manage fleet'))) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $penanggungJawab->armada?->unit_bisnis_id);
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (! $user->unit_bisnis_id || ! $resourceUnitId) {
            return true;
        }

        return $user->unit_bisnis_id === $resourceUnitId;
    }
}