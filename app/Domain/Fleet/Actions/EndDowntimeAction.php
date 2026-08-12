<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\DowntimeLog;

class EndDowntimeAction
{
    /**
     * Akhiri downtime
     *
     * @param DowntimeLog $downtime
     * @return DowntimeLog
     */
    public function execute(DowntimeLog $downtime): DowntimeLog
    {
        $downtime->update(['selesai' => now()]);
        return $downtime;
    }
}
