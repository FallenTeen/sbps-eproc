<?php

namespace App\Policies;

use App\Domain\Fleet\Models\WorkshopTodo;
use App\Models\User;

/**
 * Bagian 21.9 — otorisasi modul Workshop.
 *
 * View (to-do, ajuan sparepart, riwayat, monitoring) untuk siapa pun yang punya
 * satu dari permission fleet service/sparepart/fleet. Kelola to-do (CRUD,
 * selesai, ajukan sparepart) hanya role Workshop (`manage fleet service`).
 * Catat pengadaan sparepart hanya Inventory (`manage sparepart`).
 */
class WorkshopTodoPolicy
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
        return $user->hasAnyPermission([
            'view fleet service',
            'manage fleet service',
            'manage sparepart',
            'view sparepart',
            'view fleet',
            'manage fleet',
        ]);
    }

    public function view(User $user, WorkshopTodo $todo): bool
    {
        return $this->viewAny($user);
    }

    public function manage(User $user): bool
    {
        return $user->hasAnyPermission(['manage fleet service', 'manage fleet']);
    }

    public function recordSparepart(User $user): bool
    {
        return $user->hasAnyPermission(['manage sparepart', 'manage fleet']);
    }
}