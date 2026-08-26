<?php

namespace App\Policies;

use App\Domain\Production\Models\Produk;
use App\Models\User;

class ProdukPolicy
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

    public function view(User $user, Produk $produk): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $produk->unit_bisnis_id);
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

    public function update(User $user, Produk $produk): bool
    {
        if (! $this->create($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $produk->unit_bisnis_id);
    }

    public function delete(User $user, Produk $produk): bool
    {
        return $this->update($user, $produk);
    }

    public function setHarga(User $user, Produk $produk): bool
    {
        return $this->update($user, $produk);
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if ($user->hasRole(['Admin Keuangan', 'Mandor Proyek'])) {
            return true;
        }
        if (! $user->unit_bisnis_id || ! $resourceUnitId) {
            return true;
        }

        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
