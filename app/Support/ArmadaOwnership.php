<?php

namespace App\Support;

use App\Domain\Fleet\Models\ArmadaDriver;
use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use App\Models\User;

/**
 * Kepemilikan armada oleh seorang user (mobile driver/PIC).
 *
 * Satu user "menguasai" armada lewat dua jalur:
 * - PIC aktif (`armada_penanggung_jawabs` dengan `sampai` null);
 * - Driver aktif (`armada_drivers` dengan `status` aktif).
 *
 * Manajer (Owner/Admin Keuangan/Ketua Divisi Armada dll.) TIDAK dibatasi
 * daftar ini — mereka melihat/mengelola semua armada.
 */
class ArmadaOwnership
{
    /** Role yang boleh melihat semua armada (tanpa scope kepemilikan). */
    public const MANAGER_ROLES = [
        'Owner',
        'Admin Keuangan',
        'Kepala Divisi Armada',
        'Ketua Divisi Armada',
        'Ketua Armada',
    ];

    public static function isManager(?User $user): bool
    {
        return $user !== null && $user->hasAnyRole(self::MANAGER_ROLES);
    }

    /**
     * ID seluruh armada yang diampu user (PIC aktif + driver aktif).
     *
     * @return array<int, string>
     */
    public static function heldIds(?User $user): array
    {
        $karyawan = $user?->karyawan;

        if (! $karyawan) {
            return [];
        }

        $picIds = ArmadaPenanggungJawab::query()
            ->where('karyawan_id', $karyawan->id)
            ->whereNull('sampai')
            ->pluck('armada_id');

        $driverIds = ArmadaDriver::query()
            ->where('karyawan_id', $karyawan->id)
            ->where('status', 'aktif')
            ->pluck('armada_id');

        return $picIds->merge($driverIds)->unique()->values()->all();
    }

    public static function holds(?User $user, string $armadaId): bool
    {
        return in_array($armadaId, self::heldIds($user), true);
    }
}
