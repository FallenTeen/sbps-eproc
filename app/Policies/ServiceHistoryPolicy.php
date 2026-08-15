<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Fleet\Models\ServiceHistory;

class ServiceHistoryPolicy
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
                ])
            || $user->hasPermissionTo('manage fleet')
            || $user->hasPermissionTo('view fleet');
    }

    public function view(User $user, ServiceHistory $serviceHistory): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }
        return $this->unitBisnisAllowed($user, $this->resolveUnitId($serviceHistory));
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
                    'Koordinator GCS',
                    'Ketua Divisi Armada',
                ])
            || $user->hasPermissionTo('manage fleet');
    }

    public function update(User $user, ServiceHistory $serviceHistory): bool
    {
        if (!$this->create($user)) {
            return false;
        }
        return $this->unitBisnisAllowed($user, $this->resolveUnitId($serviceHistory));
    }

    public function delete(User $user, ServiceHistory $serviceHistory): bool
    {
        if (!($user->hasRole('Ketua Divisi Armada')
            || $user->hasPermissionTo('manage fleet'))) {
            return false;
        }
        return $this->unitBisnisAllowed($user, $this->resolveUnitId($serviceHistory));
    }

    protected function resolveUnitId(ServiceHistory $serviceHistory): ?string
    {
        $serviceable = $serviceHistory->serviceable;
        if (!$serviceable) {
            return null;
        }
        if (method_exists($serviceable, 'unit_bisnis_id')) {
            return $serviceable->unit_bisnis_id;
        }
        if (isset($serviceable->unit_bisnis_id)) {
            return $serviceable->unit_bisnis_id;
        }
        return null;
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (!$user->unit_bisnis_id || !$resourceUnitId) {
            return true;
        }
        return $user->unit_bisnis_id === $resourceUnitId;
    }
}