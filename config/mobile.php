<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Radius Presensi
    |--------------------------------------------------------------------------
    | Radius default (meter) untuk validasi lokasi check-in / check-out
    | ketika Titik tidak memiliki radius sendiri.
    */

    'radius' => [
        'default_meter' => env('MOBILE_RADIUS_DEFAULT_METER', 100),
        'max_meter' => env('MOBILE_RADIUS_MAX_METER', 2000),
    ],

    /*
    |--------------------------------------------------------------------------
    | GPS Tracking Interval
    |--------------------------------------------------------------------------
    | Interval perekaman lokasi selama jam kerja.
    */

    'tracking' => [
        'interval_seconds' => env('MOBILE_TRACKING_INTERVAL_SECONDS', 300),
        'min_interval_seconds' => env('MOBILE_TRACKING_MIN_INTERVAL_SECONDS', 60),
        'max_batch' => env('MOBILE_TRACKING_MAX_BATCH', 500),
        // Tracking otomatis berhenti setelah jam ini.
        'auto_cutoff' => env('MOBILE_TRACKING_AUTO_CUTOFF', '18:00'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Jam Kerja Default
    |--------------------------------------------------------------------------
    | Rentang jam kerja untuk kategori & notifikasi presensi.
    */

    'working_hours' => [
        'start' => env('MOBILE_WORKING_HOURS_START', '07:00'),
        'end' => env('MOBILE_WORKING_HOURS_END', '18:00'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Upload
    |--------------------------------------------------------------------------
    */

    'upload' => [
        'max_files' => env('MOBILE_UPLOAD_MAX_FILES', 10),
        'max_size_mb' => env('MOBILE_UPLOAD_MAX_SIZE_MB', 10),
        'disk' => env('MEDIA_DISK', 'public'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Registrasi
    |--------------------------------------------------------------------------
    | Role yang boleh dipilih user saat registrasi mobile.
    */

    'registration_roles' => [
        'SDM Lapangan Kondisional',
        'Mandor Titik',
        'Kontraktor',
    ],

    'default_register_role' => 'SDM Lapangan Kondisional',

];
