<?php

return [

    // Fleet - konfigurasi modul armada (TD-A, TD-C, TD-E).

    // Reminder: pengisian solar tanpa foto/nota lebih dari N hari
    // muncul di Notification Center untuk pemegang `manage pengisian solar`.
    'nota_reminder_days' => env('FLEET_NOTA_REMINDER_DAYS', 3),

];
