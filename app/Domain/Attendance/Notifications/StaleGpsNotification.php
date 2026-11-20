<?php

namespace App\Domain\Attendance\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StaleGpsNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Pemantauan lokasi berhenti',
            'body' => 'Buka aplikasi agar pemantauan lokasi berjalan kembali.',
            'type' => 'stale_gps',
            'category' => 'presensi',
            'route' => '/presensi',
        ];
    }
}
