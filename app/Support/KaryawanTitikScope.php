<?php

namespace App\Support;

use App\Domain\HR\Models\KaryawanTitikAssignment;
use App\Models\User;

/**
 * Scoping titik kerja untuk endpoint mobile berbasis KaryawanTitikAssignment aktif.
 *
 * Karyawan dengan penugasan titik aktif hanya melihat data milik titik tsb.
 * Tanpa penugasan aktif (atau user tanpa karyawan) berarti tanpa scoping
 * (return list kosong = tampilkan semua).
 */
class KaryawanTitikScope
{
    /**
     * ID titik aktif milik karyawan user. List kosong = tanpa scoping.
     *
     * @return array<int, string>
     */
    public static function activeTitikIds(?User $user): array
    {
        $karyawan = $user?->karyawan;

        if (! $karyawan) {
            return [];
        }

        return KaryawanTitikAssignment::query()
            ->where('karyawan_id', $karyawan->id)
            ->where('status', 'aktif')
            ->pluck('titik_id')
            ->all();
    }
}
