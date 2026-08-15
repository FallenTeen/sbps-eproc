<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Attendance\Models\Presensi;

class PresensiPolicy
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
                    'Koordinator SDM',
                    'Ketua Divisi Kontraktor',
                    'Mandor Proyek',
                    'Mandor Titik',
                    'Admin Keuangan',
                ])
            || $user->hasPermissionTo('manage presensi')
            || $user->hasPermissionTo('view hr')
            || $user->hasPermissionTo('manage hr');
    }

    public function view(User $user, Presensi $presensi): bool
    {
        if ($this->viewAny($user)) {
            return true;
        }

        return $presensi->karyawan_id
            && $presensi->karyawan?->user_id
            && (string) $presensi->karyawan->user_id === (string) $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
                    'Mandor Proyek',
                    'Mandor Titik',
                    'Ketua Divisi Kontraktor',
                    'SDM Lapangan Kondisional',
                ])
            || $user->hasPermissionTo('manage presensi')
            || $user->hasPermissionTo('manage hr');
    }

    public function checkOut(User $user, Presensi $presensi): bool
    {
        if ($this->create($user)) {
            return true;
        }

        return $presensi->karyawan_id
            && $presensi->karyawan?->user_id
            && (string) $presensi->karyawan->user_id === (string) $user->id;
    }

    public function review(User $user, Presensi $presensi): bool
    {
        return $user->hasRole([
                    'Koordinator SDM',
                    'Mandor Proyek',
                ])
            || $user->hasPermissionTo('manage presensi')
            || $user->hasPermissionTo('manage hr');
    }
}