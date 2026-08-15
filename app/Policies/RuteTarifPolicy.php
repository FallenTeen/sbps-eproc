<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Fleet\Models\RuteTarif;

class RuteTarifPolicy
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

    public function view(User $user, RuteTarif $ruteTarif): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }
        return $this->unitBisnisAllowed($user, $ruteTarif->unit_bisnis_id);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
                    'Koordinator GCS',
                    'Ketua Divisi Armada',
                ])
            || $user->hasPermissionTo('manage fleet');
    }

    public function update(User $user, RuteTarif $ruteTarif): bool
    {
        if (!$this->create($user)) {
            return false;
        }
        return $this->unitBisnisAllowed($user, $ruteTarif->unit_bisnis_id);
    }

    public function delete(User $user, RuteTarif $ruteTarif): bool
    {
        if (!($user->hasRole('Ketua Divisi Armada')
            || $user->hasPermissionTo('manage fleet'))) {
            return false;
        }
        return $this->unitBisnisAllowed($user, $ruteTarif->unit_bisnis_id);
    }

    public function setHarga(User $user, ?RuteTarif $ruteTarif = null): bool
    {
        if (!$this->create($user)) {
            return false;
        }
        if ($ruteTarif) {
            return $this->unitBisnisAllowed($user, $ruteTarif->unit_bisnis_id);
        }
        return true;
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (!$user->unit_bisnis_id || !$resourceUnitId) {
            return true;
        }
        return $user->unit_bisnis_id === $resourceUnitId;
    }
}