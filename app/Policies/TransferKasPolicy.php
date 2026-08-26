<?php

namespace App\Policies;

use App\Domain\Finance\Models\TransferAntarKas;
use App\Models\User;

/**
 * Transfer Antar Kas dibuat MANUAL oleh Admin Keuangan / Ketua Divisi Finance.
 * Setiap transfer otomatis menghasilkan 2 mutasi (keluar di sumber, masuk di tujuan).
 */
class TransferKasPolicy
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
            'Ketua Divisi Finance',
            'Ketua Divisi Keuangan',
        ])
            || $user->hasPermissionTo('manage finance')
            || $user->hasPermissionTo('view finance')
            || $user->hasPermissionTo('manage kas')
            || $user->hasPermissionTo('view kas');
    }

    public function view(User $user, TransferAntarKas $transfer): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        // Cek unit bisnis dari salah satu akun (sumber atau tujuan)
        $dariAkun = $transfer->dariAkun;
        $keAkun = $transfer->keAkun;
        $unitId = $dariAkun?->unit_bisnis_id ?? $keAkun?->unit_bisnis_id;

        return $this->unitBisnisAllowed($user, $unitId);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
            'Admin Keuangan',
            'Ketua Divisi Finance',
            'Ketua Divisi Keuangan',
        ])
            || $user->hasPermissionTo('manage finance')
            || $user->hasPermissionTo('manage kas');
    }

    public function store(User $user): bool
    {
        return $this->create($user);
    }

    /**
     * byUnit: untuk melihat riwayat transfer per unit bisnis.
     */
    public function byUnit(User $user): bool
    {
        return $this->viewAny($user);
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if ($user->hasRole(['Admin Keuangan', 'Ketua Divisi Finance', 'Ketua Divisi Keuangan'])) {
            return true;
        }
        if (! $user->unit_bisnis_id || ! $resourceUnitId) {
            return true;
        }

        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
