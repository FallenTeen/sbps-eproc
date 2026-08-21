<?php

namespace App\Policies;

use App\Domain\Finance\Models\PembayaranKlien;
use App\Models\User;

class PembayaranKlienPolicy
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
            'Ketua Divisi Kontraktor',
            'Ketua Divisi Finance',
            'Ketua Divisi Keuangan',
        ])
            || $user->hasPermissionTo('manage finance')
            || $user->hasPermissionTo('manage invoice')
            || $user->hasPermissionTo('view invoice')
            || $user->hasPermissionTo('view finance');
    }

    public function view(User $user, PembayaranKlien $pembayaran): bool
    {
        return $this->viewAny($user);
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

    public function update(User $user, PembayaranKlien $pembayaran): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, PembayaranKlien $pembayaran): bool
    {
        return $user->hasRole('Admin Keuangan') || $user->hasPermissionTo('manage finance');
    }
}
