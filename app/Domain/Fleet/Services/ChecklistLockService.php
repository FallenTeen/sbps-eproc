<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\HR\Models\Karyawan;

/**
 * Aturan kunci checklist awal: terkunci bila presensi hari itu sudah check-out
 * ATAU checklist akhir sudah disubmit (mana yang lebih dulu).
 */
class ChecklistLockService
{
    /**
     * @return array{locked: bool, alasan: ?string}
     */
    public function isAwalLocked(ArmadaChecklistHarian $awal, ?Karyawan $karyawan): array
    {
        if ($awal->akhir()->exists()) {
            return ['locked' => true, 'alasan' => 'Checklist akhir sudah disubmit.'];
        }

        if ($karyawan) {
            $sudahPulang = Presensi::where('karyawan_id', $karyawan->id)
                ->whereDate('check_in', $awal->tanggal)
                ->whereNotNull('check_out')
                ->exists();

            if ($sudahPulang) {
                return ['locked' => true, 'alasan' => 'Presensi pulang sudah dilakukan.'];
            }
        }

        return ['locked' => false, 'alasan' => null];
    }
}
