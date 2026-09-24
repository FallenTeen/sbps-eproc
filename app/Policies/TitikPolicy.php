<?php

namespace App\Policies;

use App\Domain\Core\Models\Titik;
use App\Models\User;

class TitikPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('Owner')) {
            return true;
        }

        return null;
    }

    /**
     * viewAny: Owner, Koordinator terkait, dan role dengan permission
     *          "manage titik" atau "view titik".
     *          Sebagai fallback diizinkan pula role dengan view/manage proyek
     *          (titik adalah sub-resource dari proyek).
     */
    public function viewAny(User $user): bool
    {
        // Kontraktor eksternal: TIDAK pakai layar core titik — cukup portal/pivot.
        if ($user->hasRole('Kontraktor')) {
            return false;
        }

        return $user->hasAnyRole([
            'Koordinator Procurement',
            'Koordinator GCS',
            'Koordinator CBP',
            'Koordinator AMP',
            'Koordinator SDM',
            'Mandor Proyek',
            'Mandor Titik',
        ])
            || $user->hasPermissionTo('manage titik')
            || $user->hasPermissionTo('view titik')
            || $user->hasPermissionTo('manage proyek')
            || $user->hasPermissionTo('view proyek')
            || $user->isKetuaDivisi();
    }

    /**
     * view: Owner, Koordinator, Mandor Proyek yang ditugaskan di proyek.
     *       Scoping unit_bisnis_id via relasi proyek.
     */
    public function view(User $user, Titik $titik): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $titik->proyek?->unit_bisnis_id);
    }

    /**
     * create: Owner dan Koordinator dengan permission "manage titik"
     *         atau "manage proyek".
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage titik')
            || $user->hasPermissionTo('manage proyek')
            || $user->hasAnyRole([
                'Koordinator Procurement',
                'Koordinator GCS',
                'Koordinator CBP',
                'Koordinator AMP',
                'Koordinator SDM',
            ]);
    }

    /**
     * update: Owner dan Koordinator yang memiliki akses.
     */
    public function update(User $user, Titik $titik): bool
    {
        if (! ($user->hasPermissionTo('manage titik')
            || $user->hasPermissionTo('manage proyek')
            || $user->hasAnyRole([
                'Koordinator Procurement',
                'Koordinator GCS',
                'Koordinator CBP',
                'Koordinator AMP',
                'Koordinator SDM',
            ]))) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $titik->proyek?->unit_bisnis_id);
    }

    /**
     * delete: Owner saja, atau syarat tidak ada relasi (dicek controller).
     */
    public function delete(User $user, Titik $titik): bool
    {
        return $user->hasRole('Owner');
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (! $user->unit_bisnis_id || ! $resourceUnitId) {
            return true;
        }

        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
