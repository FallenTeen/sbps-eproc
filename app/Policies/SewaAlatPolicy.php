<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Fleet\Models\SewaAlatJam;

class SewaAlatPolicy
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
            || $user->hasPermissionTo('view fleet')
            || $user->hasPermissionTo('record sewa');
    }

    public function view(User $user, SewaAlatJam $sewaAlat): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        $unitId = $sewaAlat->armada?->unit_bisnis_id;
        return $this->unitBisnisAllowed($user, $unitId);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
                    'Koordinator GCS',
                    'Ketua Divisi Armada',
                ])
            || $user->hasPermissionTo('manage fleet')
            || $user->hasPermissionTo('record sewa');
    }

    public function update(User $user, SewaAlatJam $sewaAlat): bool
    {
        if (!$this->create($user)) {
            return false;
        }

        $unitId = $sewaAlat->armada?->unit_bisnis_id;
        return $this->unitBisnisAllowed($user, $unitId);
    }

    public function delete(User $user, SewaAlatJam $sewaAlat): bool
    {
        if (!($user->hasRole('Ketua Divisi Armada')
            || $user->hasPermissionTo('manage fleet'))) {
            return false;
        }

        $unitId = $sewaAlat->armada?->unit_bisnis_id;
        return $this->unitBisnisAllowed($user, $unitId);
    }

    public function recordSewa(User $user, SewaAlatJam $sewaAlat = null): bool
    {
        if (!$this->create($user)) {
            return false;
        }
        if ($sewaAlat) {
            $unitId = $sewaAlat->armada?->unit_bisnis_id;
            return $this->unitBisnisAllowed($user, $unitId);
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
