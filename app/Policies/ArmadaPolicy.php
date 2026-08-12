<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Fleet\Models\Armada;
use Illuminate\Auth\Access\Response;

class ArmadaPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('Owner') || $user->hasRole('Admin') || $user->hasRole('Admin Keuangan')) {
            return true;
        }
        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasRole('Ketua Divisi Armada') || $user->hasRole('Koordinator GCS');
    }

    public function view(User $user, Armada $armada): bool
    {
        if (!($user->hasRole('Ketua Divisi Armada') || $user->hasRole('Koordinator GCS'))) {
            return false;
        }
        return !$user->unit_bisnis_id || $user->unit_bisnis_id == $armada->unit_bisnis_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('Ketua Divisi Armada') || $user->hasRole('Koordinator GCS');
    }

    public function update(User $user, Armada $armada): bool
    {
        if (!($user->hasRole('Ketua Divisi Armada') || $user->hasRole('Koordinator GCS'))) {
            return false;
        }
        return !$user->unit_bisnis_id || $user->unit_bisnis_id == $armada->unit_bisnis_id;
    }

    public function delete(User $user, Armada $armada): bool
    {
        if (!$user->hasRole('Ketua Divisi Armada')) {
            return false;
        }
        return !$user->unit_bisnis_id || $user->unit_bisnis_id == $armada->unit_bisnis_id;
    }

    public function approve(User $user, Armada $armada): bool
    {
        if (!$user->hasRole('Ketua Divisi Armada')) {
            return false;
        }
        return !$user->unit_bisnis_id || $user->unit_bisnis_id == $armada->unit_bisnis_id;
    }
}
