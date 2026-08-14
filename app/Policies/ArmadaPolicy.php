<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Fleet\Models\Armada;

class ArmadaPolicy
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

    public function view(User $user, Armada $armada): bool
    {
        if (!($user->hasRole([
            'Koordinator GCS',
            'Ketua Divisi Armada',
        ])
            || $user->hasPermissionTo('manage fleet')
            || $user->hasPermissionTo('view fleet'))) {
            if ($user->hasRole('Admin Keuangan')) {
                return $this->unitBisnisAllowed($user, $armada->unit_bisnis_id);
            }
            return false;
        }

        return $this->unitBisnisAllowed($user, $armada->unit_bisnis_id);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
                    'Koordinator GCS',
                    'Ketua Divisi Armada',
                ])
            || $user->hasPermissionTo('manage fleet');
    }

    public function update(User $user, Armada $armada): bool
    {
        if (!($user->hasRole([
            'Koordinator GCS',
            'Ketua Divisi Armada',
        ])
            || $user->hasPermissionTo('manage fleet'))) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $armada->unit_bisnis_id);
    }

    public function delete(User $user, Armada $armada): bool
    {
        if (!($user->hasRole('Ketua Divisi Armada')
            || $user->hasPermissionTo('manage fleet'))) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $armada->unit_bisnis_id);
    }

    public function recordRitase(User $user, Armada $armada): bool
    {
        if (!($user->hasRole([
            'Koordinator GCS',
            'Ketua Divisi Armada',
        ])
            || $user->hasPermissionTo('manage fleet')
            || $user->hasPermissionTo('record ritase'))) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $armada->unit_bisnis_id);
    }

    public function recordSewa(User $user, Armada $armada): bool
    {
        if (!($user->hasRole([
            'Koordinator GCS',
            'Ketua Divisi Armada',
        ])
            || $user->hasPermissionTo('manage fleet')
            || $user->hasPermissionTo('record sewa'))) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $armada->unit_bisnis_id);
    }

    public function recordService(User $user, Armada $armada): bool
    {
        return $this->update($user, $armada);
    }

    public function recordChecklist(User $user, Armada $armada): bool
    {
        return $this->update($user, $armada);
    }

    public function recordBbm(User $user, Armada $armada): bool
    {
        return $this->update($user, $armada);
    }

    public function startDowntime(User $user, Armada $armada): bool
    {
        return $this->update($user, $armada);
    }

    public function endDowntime(User $user, Armada $armada): bool
    {
        return $this->update($user, $armada);
    }

    public function assignDriver(User $user, Armada $armada): bool
    {
        return $this->update($user, $armada);
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (!$user->unit_bisnis_id || !$resourceUnitId) {
            return true;
        }
        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
