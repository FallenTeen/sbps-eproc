<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Production\Models\MesinProduksi;

class MesinProduksiPolicy
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
                    'Koordinator AMP',
                    'Ketua Divisi Produksi CBP',
                    'Ketua Divisi Produksi AMP',
                    'Mandor Proyek',
                ])
            || $user->hasPermissionTo('manage production')
            || $user->hasPermissionTo('manage production cbp')
            || $user->hasPermissionTo('manage production amp')
            || $user->hasPermissionTo('view production');
    }

    public function view(User $user, MesinProduksi $mesin): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $mesin->unit_bisnis_id);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
                    'Koordinator CBP',
                    'Koordinator AMP',
                    'Ketua Divisi Produksi CBP',
                    'Ketua Divisi Produksi AMP',
                ])
            || $user->hasPermissionTo('manage production cbp')
            || $user->hasPermissionTo('manage production amp')
            || $user->hasPermissionTo('manage production');
    }

    public function update(User $user, MesinProduksi $mesin): bool
    {
        if (!$this->create($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $mesin->unit_bisnis_id);
    }

    public function delete(User $user, MesinProduksi $mesin): bool
    {
        return $this->update($user, $mesin);
    }

    public function recordService(User $user, MesinProduksi $mesin): bool
    {
        return $this->update($user, $mesin);
    }

    public function recordChecklist(User $user, MesinProduksi $mesin): bool
    {
        return $this->update($user, $mesin);
    }

    public function recordBbm(User $user, MesinProduksi $mesin): bool
    {
        return $this->update($user, $mesin);
    }

    public function startDowntime(User $user, MesinProduksi $mesin): bool
    {
        return $this->update($user, $mesin);
    }

    public function endDowntime(User $user, MesinProduksi $mesin): bool
    {
        return $this->update($user, $mesin);
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if ($user->hasRole(['Admin Keuangan', 'Mandor Proyek'])) {
            return true;
        }
        if (!$user->unit_bisnis_id || !$resourceUnitId) {
            return true;
        }
        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
