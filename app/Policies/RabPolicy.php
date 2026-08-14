<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Core\Models\Rab;

class RabPolicy
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
     *          "manage rab" atau "view rab".
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
                    'Koordinator Procurement',
                    'Koordinator CBP',
                    'Koordinator AMP',
                    'Admin Keuangan',
                    'Mandor Proyek',
                ])
            || $user->hasPermissionTo('manage rab')
            || $user->hasPermissionTo('view rab')
            || $user->isKetuaDivisi();
    }

    /**
     * view: Owner, Koordinator, Mandor Proyek yang ditugaskan di proyek.
     */
    public function view(User $user, Rab $rab): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $rab->proyek?->unit_bisnis_id);
    }

    /**
     * create: Owner dan Koordinator dengan permission "manage rab".
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage rab')
            || $user->hasAnyRole([
                'Koordinator Procurement',
                'Koordinator CBP',
                'Koordinator AMP',
                'Admin Keuangan',
                'Mandor Proyek',
            ]);
    }

    /**
     * update: Owner dan Koordinator yang memiliki akses manage rab.
     */
    public function update(User $user, Rab $rab): bool
    {
        if (!($user->hasPermissionTo('manage rab')
            || $user->hasAnyRole([
                'Koordinator Procurement',
                'Koordinator CBP',
                'Koordinator AMP',
                'Admin Keuangan',
                'Mandor Proyek',
            ]))) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $rab->proyek?->unit_bisnis_id);
    }

    /**
     * delete: Owner saja.
     */
    public function delete(User $user, Rab $rab): bool
    {
        return $user->hasRole('Owner');
    }

    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (!$user->unit_bisnis_id || !$resourceUnitId) {
            return true;
        }
        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
