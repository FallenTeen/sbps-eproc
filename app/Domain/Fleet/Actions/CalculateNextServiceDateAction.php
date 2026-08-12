<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\ServiceInterval;
use Carbon\Carbon;

class CalculateNextServiceDateAction
{
    public function execute(ServiceInterval $interval): Carbon
    {
        $lastService = $interval->serviceable->serviceHistories()->latest('tanggal')->first();
        $lastDate = $lastService ? Carbon::parse($lastService->tanggal) : Carbon::parse($interval->serviceable->tanggal_mulai_pakai ?? now());

        // Cek interval bulan
        $nextByMonth = $lastDate->copy()->addMonths($interval->interval_bulan);

        // Cek interval jam operasional (jika ada)
        if ($interval->interval_jam_operasional) {
            // Asumsikan ada field total_jam_operasional di serviceable
            $totalJam = $interval->serviceable->total_jam_operasional ?? 0;
            $estimatedJamPerBulan = 200; // estimasi
            $nextByHours = $lastDate->copy()->addDays(($interval->interval_jam_operasional / $estimatedJamPerBulan) * 30);
            return $nextByHours->lt($nextByMonth) ? $nextByHours : $nextByMonth;
        }

        return $nextByMonth;
    }
}
