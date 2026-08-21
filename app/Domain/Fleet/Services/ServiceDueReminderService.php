<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Actions\CalculateNextServiceDateAction;
use App\Domain\Fleet\Models\ServiceInterval;
use Carbon\Carbon;

class ServiceDueReminderService
{
    public function handle(): void
    {
        $intervals = ServiceInterval::all();
        $now = Carbon::now();

        foreach ($intervals as $interval) {
            $nextDate = (new CalculateNextServiceDateAction)->execute($interval);
            if ($nextDate->lte($now->addDays(7))) {
                // Kirim notifikasi ke koordinator unit terkait
                // (gunakan Notification Center)
                // Contoh: NotifyKoordinator::dispatch($interval->serviceable);
            }
        }
    }
}
