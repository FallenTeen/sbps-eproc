<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;

/**
 * CATATAN DESAIN:
 * Membuat/mengubah checklist (create, store, update) TIDAK memakai policy ini.
 * Karena checklist bersifat polymorphic (checkable = Armada atau MesinProduksi),
 * otorisasi create/update didelegasikan langsung ke ability yang SUDAH ADA di
 * ArmadaPolicy::recordChecklist() / MesinProduksiPolicy::recordChecklist()
 * lewat $this->authorize('recordChecklist', $checkable) di controller.
 * Ini menghindari duplikasi aturan unit_bisnis_id yang sudah didefinisikan
 * di kedua policy tersebut.
 *
 * Policy ini HANYA menangani ability yang tidak terikat ke satu checkable
 * spesifik: viewAny, view, byDate (laporan lintas armada & mesin).
 */
class ArmadaChecklistHarianPolicy
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

    public function view(User $user, ArmadaChecklistHarian $checklist): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        $checklist->loadMissing('checkable');

        return $this->unitBisnisAllowed($user, $checklist->checkable?->unit_bisnis_id);
    }

    /**
     * Laporan checklist harian lintas unit (byDate) - akses sama dengan viewAny,
     * scoping per unit dilakukan di controller saat query.
     */
    public function byDate(User $user): bool
    {
        return $this->viewAny($user);
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
