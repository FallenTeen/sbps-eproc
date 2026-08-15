<?php

namespace App\Domain\Shared\Actions;

use Illuminate\Database\Eloquent\Model;

class RecordAuditLogAction
{
    public function execute(
        string $description,
        ?Model $subject = null,
        ?string $event = null,
        array $properties = [],
        string $logName = 'default'
    ): void {
        $activity = activity($logName)
            ->performedOn($subject)
            ->causedBy(auth()->user())
            ->event($event)
            ->withProperties(array_merge($properties, [
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]));

        $activity->log($description);
    }
}