<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Activitylog\Models\Activity;

/**
 * Audit Log adalah fitur melihat riwayat perubahan data.
 * Hanya Owner dan Admin Keuangan yang boleh mengakses.
 */
class AuditLogPolicy
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
                ])
            || $user->hasPermissionTo('view audit log');
    }

    public function view(User $user, Activity $log): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Export log (jika ada fitur export) - akses sama dengan viewAny.
     */
    public function export(User $user): bool
    {
        return $this->viewAny($user);
    }

    /**
     * byModel: melihat riwayat perubahan per model/record.
     */
    public function byModel(User $user): bool
    {
        return $this->viewAny($user);
    }

    /**
     * byUser: melihat aktivitas user tertentu.
     */
    public function byUser(User $user): bool
    {
        return $this->viewAny($user);
    }
}