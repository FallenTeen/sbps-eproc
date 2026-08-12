<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Production\Models\ProductionSession;

class ProductionSessionPolicy
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
        return $user->hasRole('Ketua Divisi Produksi CBP') || 
               $user->hasRole('Ketua Divisi Produksi AMP') || 
               $user->hasRole('Koordinator CBP') || 
               $user->hasRole('Koordinator AMP');
    }

    public function view(User $user, ProductionSession $session): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        $sessionUnitId = $session->produk ? $session->produk->unit_bisnis_id : ($session->proyek ? $session->proyek->unit_bisnis_id : null);
        return !$user->unit_bisnis_id || $user->unit_bisnis_id == $sessionUnitId;
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, ProductionSession $session): bool
    {
        return $this->view($user, $session);
    }

    public function delete(User $user, ProductionSession $session): bool
    {
        if (!($user->hasRole('Ketua Divisi Produksi CBP') || $user->hasRole('Ketua Divisi Produksi AMP'))) {
            return false;
        }
        return $this->view($user, $session);
    }

    public function approve(User $user, ProductionSession $session): bool
    {
        if (!($user->hasRole('Ketua Divisi Produksi CBP') || $user->hasRole('Ketua Divisi Produksi AMP'))) {
            return false;
        }
        return $this->view($user, $session);
    }
}
