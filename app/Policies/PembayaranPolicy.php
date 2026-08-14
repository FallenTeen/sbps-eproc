<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Procurement\Models\Pembayaran;

class PembayaranPolicy
{
    /**
     * Super-admin shortcut: Owner bypass semua cek individual.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('Owner')) {
            return true;
        }
        return null;
    }

    /**
     * viewAny: role/permission yang sama dengan yang boleh membayar/lihat PO
     * (Pembayaran adalah sub-resource finansial dari Purchase Order).
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole([
                    'Admin Keuangan',
                    'Ketua Divisi Finance',
                    'Ketua Divisi Keuangan',
                    'Koordinator Procurement',
                ])
            || $user->hasPermissionTo('pay procurement')
            || $user->hasPermissionTo('view procurement')
            || $user->hasPermissionTo('manage procurement');
    }

    /**
     * view: viewAny() + dibatasi unit_bisnis_id milik PO terkait.
     */
    public function view(User $user, Pembayaran $pembayaran): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        $pembayaran->loadMissing('purchaseOrder.proyek');

        return $this->unitBisnisAllowed(
            $user,
            $pembayaran->purchaseOrder?->proyek?->unit_bisnis_id
        );
    }

    /**
     * print: sama dengan view (hanya butuh akses lihat untuk cetak bukti).
     */
    public function print(User $user, Pembayaran $pembayaran): bool
    {
        return $this->view($user, $pembayaran);
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (!$user->unit_bisnis_id || !$resourceUnitId) {
            return true;
        }
        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
