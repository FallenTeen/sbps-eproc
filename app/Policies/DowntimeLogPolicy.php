<?php

namespace App\Policies;

use App\Domain\Fleet\Models\DowntimeLog;
use App\Models\User;

class DowntimeLogPolicy
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

    public function view(User $user, DowntimeLog $downtime): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $this->resolveUnitId($downtime));
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
            'Koordinator GCS',
            'Ketua Divisi Armada',
        ])
            || $user->hasPermissionTo('manage fleet');
    }

    public function update(User $user, DowntimeLog $downtime): bool
    {
        if (! $this->create($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $this->resolveUnitId($downtime));
    }

    public function delete(User $user, DowntimeLog $downtime): bool
    {
        if (! ($user->hasRole('Ketua Divisi Armada')
            || $user->hasPermissionTo('manage fleet'))) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $this->resolveUnitId($downtime));
    }

    public function end(User $user, DowntimeLog $downtime): bool
    {
        return $this->update($user, $downtime);
    }

    protected function resolveUnitId(DowntimeLog $downtime): ?string
    {
        $serviceable = $downtime->serviceable;

        return $serviceable?->unit_bisnis_id ?? $serviceable?->mesinProduksi?->unit_bisnis_id;
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (! $user->unit_bisnis_id || ! $resourceUnitId) {
            return true;
        }

        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
