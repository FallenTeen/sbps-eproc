<?php

namespace App\Policies;

use App\Models\User;

/**
 * User Management: mengelola user, role, dan permission.
 * Hanya Owner dan Admin Keuangan yang boleh mengakses.
 * Tidak boleh menghapus diri sendiri.
 */
class UserManagementPolicy
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
            || $user->hasPermissionTo('manage user');
    }

    public function view(User $user, User $targetUser): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, User $targetUser): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user, User $targetUser): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }
        // Tidak boleh menghapus diri sendiri
        return (string) $user->id !== (string) $targetUser->id;
    }

    public function assignRole(User $user, User $targetUser): bool
    {
        return $this->update($user, $targetUser);
    }

    public function removeRole(User $user, User $targetUser): bool
    {
        return $this->update($user, $targetUser);
    }

    public function toggleActive(User $user, User $targetUser): bool
    {
        return $this->update($user, $targetUser);
    }

    public function syncPermissions(User $user, User $targetUser): bool
    {
        return $this->update($user, $targetUser);
    }
}