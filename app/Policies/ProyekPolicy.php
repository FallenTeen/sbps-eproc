<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Core\Models\Proyek;

class ProyekPolicy
{
    /**
     * Super-admin shortcut: Owner + role terkait bypass semua cek individual.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('Owner')) {
            return true;
        }
        return null;
    }

    /**
     * viewAny: Owner, Koordinator terkait, role dengan permission
     *          "manage proyek" atau "view proyek".
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
                    'Koordinator Procurement',
                    'Koordinator GCS',
                    'Koordinator CBP',
                    'Koordinator AMP',
                    'Koordinator SDM',
                    'Mandor Proyek',
                    'Mandor Titik',
                    'Kontraktor',
                ])
            || $user->hasPermissionTo('manage proyek')
            || $user->hasPermissionTo('view proyek')
            || $user->isKetuaDivisi();
    }

    /**
     * view: Owner, Koordinator, Mandor Proyek yang ditugaskan di proyek.
     *       Ditambah pembatasan unit_bisnis_id jika user hanya punya akses unit.
     */
    public function view(User $user, Proyek $proyek): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        // Mandor Proyek / Mandor Titik -> cek assignment (jika ada relasi assignment ke proyek/titik)
        if ($user->hasRole('Mandor Proyek') || $user->hasRole('Mandor Titik')) {
            // Jika sudah ada relasi formal assignment bisa ditambahkan di sini.
            // Sementara: izinkan access dengan asumsi view-level untuk role lapangan.
            // Ditambah unit bisnis cek di bawah.
        }

        return $this->unitBisnisAllowed($user, $proyek->unit_bisnis_id);
    }

    /**
     * create: Owner dan Koordinator dengan permission "manage proyek".
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage proyek')
            || $user->hasAnyRole([
                'Koordinator Procurement',
                'Koordinator GCS',
                'Koordinator CBP',
                'Koordinator AMP',
                'Koordinator SDM',
            ]);
    }

    /**
     * update: Owner dan Koordinator yang memiliki akses (manage proyek / unit terkait).
     */
    public function update(User $user, Proyek $proyek): bool
    {
        if (!($user->hasPermissionTo('manage proyek')
            || $user->hasAnyRole([
                'Koordinator Procurement',
                'Koordinator GCS',
                'Koordinator CBP',
                'Koordinator AMP',
                'Koordinator SDM',
            ]))) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $proyek->unit_bisnis_id);
    }

    /**
     * delete: Owner saja, ditambah syarat tidak ada relasi (dicek di controller).
     */
    public function delete(User $user, Proyek $proyek): bool
    {
        return $user->hasRole('Owner');
    }

    /**
     * Helper: jika user dibatasi unit_bisnis_id, cocokkan dengan resource.
     */
    protected function unitBisnisAllowed(User $user, ?string $resourceUnitId): bool
    {
        if (!$user->unit_bisnis_id || !$resourceUnitId) {
            return true;
        }
        return $user->unit_bisnis_id === $resourceUnitId;
    }
}
