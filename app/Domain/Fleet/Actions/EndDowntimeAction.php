<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\DowntimeLog;

class EndDowntimeAction
{
    /**
     * Akhiri downtime
     */
    public function execute(DowntimeLog $downtime): DowntimeLog
    {
        $downtime->update(['selesai' => now()]);

        return $downtime;
    }
}
