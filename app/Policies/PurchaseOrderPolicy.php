<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Procurement\Models\PurchaseOrder;

class PurchaseOrderPolicy
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
        return $user->hasPermissionTo('manage procurement') || 
               $user->hasPermissionTo('manage procurement division') || 
               $user->isKetuaDivisi();
    }

    public function view(User $user, PurchaseOrder $po): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        $poUnitId = $po->proyek ? $po->proyek->unit_bisnis_id : null;
        return !$user->unit_bisnis_id || !$poUnitId || $user->unit_bisnis_id == $poUnitId;
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, PurchaseOrder $po): bool
    {
        return $this->view($user, $po);
    }

    public function delete(User $user, PurchaseOrder $po): bool
    {
        if (!$user->isKetuaDivisi()) {
            return false;
        }
        return $this->view($user, $po);
    }

    public function approve(User $user, PurchaseOrder $po): bool
    {
        if (!$user->isKetuaDivisi() && !$user->hasPermissionTo('approve procurement division')) {
            return false;
        }

        // Cek divisi unit_bisnis_id
        $poUnitId = $po->proyek ? $po->proyek->unit_bisnis_id : null;
        if ($user->unit_bisnis_id && $poUnitId && $user->unit_bisnis_id != $poUnitId) {
            return false;
        }

        // Cek limit nominal approval ketua divisi (misal max Rp 50.000.000 per PO)
        $limitThreshold = 50000000;
        if ($po->total > $limitThreshold && !$user->hasPermissionTo('approve procurement threshold')) {
            return false; // Harus di-approve Owner/Admin jika lebih dari limit
        }

        return true;
    }
}
