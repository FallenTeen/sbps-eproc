<?php

namespace App\Policies;

use App\Domain\Procurement\Models\PurchaseOrder;
use App\Models\User;

class PurchaseOrderPolicy
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
            'Koordinator Procurement',
        ])
            || $user->hasPermissionTo('manage procurement')
            || $user->hasPermissionTo('view procurement')
            || $user->isKetuaDivisi();
    }

    public function view(User $user, PurchaseOrder $po): bool
    {
        if ($po->created_by === $user->id) {
            return true;
        }

        if (! $this->viewAny($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $po->proyek?->unit_bisnis_id);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
            'Koordinator Procurement',
        ])
            || $user->hasPermissionTo('manage procurement')
            || $this->isKetuaDivisiWithScope($user);
    }

    public function update(User $user, PurchaseOrder $po): bool
    {
        if (! $this->create($user)) {
            return false;
        }
        if ($po->created_by === $user->id) {
            return true;
        }

        return $this->unitBisnisAllowed($user, $po->proyek?->unit_bisnis_id);
    }

    public function delete(User $user, PurchaseOrder $po): bool
    {
        if ($user->hasRole('Koordinator Procurement') && $po->created_by === $user->id) {
            return true;
        }
        if ($this->isKetuaDivisiWithScope($user)) {
            return $this->unitBisnisAllowed($user, $po->proyek?->unit_bisnis_id);
        }

        return false;
    }

    public function approve(User $user, PurchaseOrder $po): bool
    {
        $total = (float) $po->total;
        $poUnitId = $po->proyek?->unit_bisnis_id;

        if ($user->hasRole('Admin Keuangan') || $user->hasPermissionTo('approve procurement')) {
            return $this->unitBisnisAllowed($user, $poUnitId);
        }

        if ($user->hasRole(['Ketua Divisi Finance', 'Ketua Divisi Keuangan'])) {
            return $total <= 50000000 && $this->unitBisnisAllowed($user, $poUnitId);
        }

        if ($user->hasRole('Ketua Divisi Armada')) {
            if ($total > 25000000) {
                return false;
            }
            if (! $this->unitBisnisAllowed($user, $poUnitId)) {
                return false;
            }

            return $this->poHasSparepartArmada($po);
        }

        if ($user->hasRole(['Ketua Divisi Produksi CBP', 'Ketua Divisi Produksi AMP'])) {
            if ($total > 20000000) {
                return false;
            }
            if (! $this->unitBisnisAllowed($user, $poUnitId)) {
                return false;
            }

            return $this->poHasBahanBakuProduksi($po);
        }

        if ($user->hasRole('Ketua Divisi Kontraktor')) {
            if ($total > 30000000) {
                return false;
            }
            if (! $this->unitBisnisAllowed($user, $poUnitId)) {
                return false;
            }

            return $this->poIsKontrakKlien($po);
        }

        return false;
    }

    public function reject(User $user, PurchaseOrder $po): bool
    {
        return $this->approve($user, $po);
    }

    public function receive(User $user, PurchaseOrder $po): bool
    {
        if ($user->hasRole('Koordinator Procurement')
            || $user->hasPermissionTo('receive procurement')
            || $user->hasPermissionTo('manage procurement')) {
            return $this->unitBisnisAllowed($user, $po->proyek?->unit_bisnis_id);
        }

        return false;
    }

    public function pay(User $user, PurchaseOrder $po): bool
    {
        if ($user->hasRole([
            'Admin Keuangan',
            'Ketua Divisi Finance',
            'Ketua Divisi Keuangan',
        ])
            || $user->hasPermissionTo('pay procurement')) {
            return $this->unitBisnisAllowed($user, $po->proyek?->unit_bisnis_id);
        }

        return false;
    }

    protected function isKetuaDivisiWithScope(User $user): bool
    {
        return $user->isKetuaDivisi();
    }

    protected function poHasSparepartArmada(PurchaseOrder $po): bool
    {
        $po->loadMissing('items.bahanBaku');

        return $po->items->isNotEmpty() && $po->items->every(function ($item) {
            return $item->bahanBaku && $item->bahanBaku->kategori === 'sparepart';
        });
    }

    protected function poHasBahanBakuProduksi(PurchaseOrder $po): bool
    {
        $po->loadMissing('items.bahanBaku');

        return $po->items->isNotEmpty() && $po->items->every(function ($item) {
            return $item->bahanBaku && $item->bahanBaku->kategori === 'bahan_baku';
        });
    }

    protected function poIsKontrakKlien(PurchaseOrder $po): bool
    {
        $po->loadMissing('proyek');

        return $po->proyek && $po->proyek->tipe_proyek === 'kontrak_klien';
    }

    protected function poUnitMatchesUser(User $user, PurchaseOrder $po): bool
    {
        $poUnitId = $po->proyek?->unit_bisnis_id;

        return $this->unitBisnisAllowed($user, $poUnitId);
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (! $user->unit_bisnis_id || ! $resourceUnitId) {
            return true;
        }

        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
