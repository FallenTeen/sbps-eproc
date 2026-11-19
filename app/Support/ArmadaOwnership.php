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
 * daftar ini - mereka melihat/mengelola semua armada.
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

    public const WORKSHOP_ROLE = 'Workshop';

    /** Status servis yang boleh dibuka dan dikerjakan Workshop. */
    public const WORKSHOP_SERVIS_STATUSES = [
        'disetujui',
        'dikerjakan',
        'menunggu_sparepart',
        'sparepart_tersedia',
        'selesai',
    ];

    public static function isManager(?User $user): bool
    {
        return $user !== null && $user->hasAnyRole(self::MANAGER_ROLES);
    }

    public static function isWorkshop(?User $user): bool
    {
        return $user !== null && $user->hasRole(self::WORKSHOP_ROLE);
    }

    public static function canWorkOnServis(?User $user, ?string $status = null): bool
    {
        if (self::isManager($user)) {
            return true;
        }

        if (! self::isWorkshop($user)) {
            return false;
        }

        return $status === null || in_array($status, self::WORKSHOP_SERVIS_STATUSES, true);
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

        $ids = $picIds->merge($driverIds)->unique()->values()->all();

        if ($user && $user->hasRole('Operator Alat Berat') && ! self::isManager($user)) {
            return \App\Domain\Fleet\Models\Armada::query()
                ->whereIn('id', $ids)
                ->where('tipe_unit', 'alat_berat')
                ->pluck('id')
                ->all();
        }

        return $ids;
    }

    public static function holds(?User $user, string $armadaId): bool
    {
        return in_array($armadaId, self::heldIds($user), true);
    }
}
