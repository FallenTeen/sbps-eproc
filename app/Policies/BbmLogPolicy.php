<?php

namespace App\Policies;

use App\Domain\Fleet\Models\BbmLog;
use App\Models\User;

/**
 * CATATAN DESAIN (sama seperti ArmadaChecklistHarianPolicy):
 * create/store/update/destroy TIDAK memakai policy ini. Karena BbmLog
 * bersifat polymorphic (serviceable = Armada atau MesinProduksi), otorisasi
 * untuk aksi-aksi itu didelegasikan ke ability yang SUDAH ADA di
 * ArmadaPolicy::recordBbm() / MesinProduksiPolicy::recordBbm() lewat
 * $this->authorize('recordBbm', $serviceable) di controller.
 *
 * Policy ini hanya untuk ability yang tidak terikat ke satu serviceable
 * spesifik: viewAny, view, anomaly.
 */
class BbmLogPolicy
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
            'Koordinator CBP',
            'Koordinator AMP',
            'Ketua Divisi Armada',
            'Ketua Divisi Produksi CBP',
            'Ketua Divisi Produksi AMP',
            'Admin Keuangan',
            'Mandor Proyek',
        ])
            || $user->hasPermissionTo('manage fleet')
            || $user->hasPermissionTo('view fleet')
            || $user->hasPermissionTo('manage production')
            || $user->hasPermissionTo('view production');
    }

    public function view(User $user, BbmLog $bbmLog): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        $bbmLog->loadMissing('serviceable');

        return $this->unitBisnisAllowed($user, $bbmLog->serviceable?->unit_bisnis_id);
    }

    /**
     * Laporan anomali lintas unit - akses sama dengan viewAny, scoping
     * per unit bisnis dilakukan di controller saat query.
     */
    public function anomaly(User $user): bool
    {
        return $this->viewAny($user);
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
