<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Production\Models\ProductionSession;

class ProductionSessionPolicy
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

    public function view(User $user, ProductionSession $session): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        $sessionUnitId = $this->resolveSessionUnitId($session);
        return $this->unitBisnisAllowed($user, $sessionUnitId);
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

    public function update(User $user, ProductionSession $session): bool
    {
        if (!$this->create($user)) {
            return false;
        }

        $sessionUnitId = $this->resolveSessionUnitId($session);
        return $this->unitBisnisAllowed($user, $sessionUnitId);
    }

    public function delete(User $user, ProductionSession $session): bool
    {
        return $this->update($user, $session);
    }

    public function startSession(User $user, ProductionSession $session): bool
    {
        if ($user->hasRole(['Koordinator CBP', 'Koordinator AMP', 'Ketua Divisi Produksi CBP', 'Ketua Divisi Produksi AMP'])
            || $user->hasPermissionTo('start session')) {
            $sessionUnitId = $this->resolveSessionUnitId($session);
            return $this->unitBisnisAllowed($user, $sessionUnitId);
        }

        if ($user->hasRole('Mandor Proyek')) {
            return true;
        }

        return false;
    }

    public function endSession(User $user, ProductionSession $session): bool
    {
        if ($user->hasRole(['Koordinator CBP', 'Koordinator AMP', 'Ketua Divisi Produksi CBP', 'Ketua Divisi Produksi AMP', 'Mandor Proyek'])
            || $user->hasPermissionTo('end session')) {
            $sessionUnitId = $this->resolveSessionUnitId($session);
            return $this->unitBisnisAllowed($user, $sessionUnitId);
        }

        return false;
    }

    public function recordQC(User $user, ProductionSession $session): bool
    {
        // Hanya untuk CBP
        $isCbp = $this->isCbpSession($session);
        if (!$isCbp) {
            return false;
        }

        if ($user->hasRole(['Koordinator CBP', 'Ketua Divisi Produksi CBP', 'Mandor Proyek'])
            || $user->hasPermissionTo('manage qc')) {
            $sessionUnitId = $this->resolveSessionUnitId($session);
            return $this->unitBisnisAllowed($user, $sessionUnitId);
        }

        return false;
    }

    protected function resolveSessionUnitId(ProductionSession $session): ?string
    {
        $session->loadMissing(['mesin', 'produk']);
        if ($session->mesin?->unit_bisnis_id) {
            return $session->mesin->unit_bisnis_id;
        }
        if ($session->produk?->unit_bisnis_id) {
            return $session->produk->unit_bisnis_id;
        }
        return null;
    }

    protected function isCbpSession(ProductionSession $session): bool
    {
        $session->loadMissing(['mesin.unitBisnis', 'produk.unitBisnis']);
        $unitKode = $session->mesin?->unitBisnis?->kode ?? $session->produk?->unitBisnis?->kode;
        if ($unitKode) {
            return strtoupper($unitKode) === 'CBP';
        }
        return true;
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
