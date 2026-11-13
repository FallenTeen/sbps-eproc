<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Bersihkan entri Idempotency-Key kedaluwarsa (TTL 24 jam).
Schedule::command('idempotency:prune')->daily();

// Reminder dokumen berkala armada (pajak/STNK/KIR).
Schedule::command('armada:dokumen-reminder')->dailyAt('07:00');

// Pengingat GPS stale untuk user dengan presensi aktif yang berhenti memperbarui lokasi.
Schedule::command('tracking:stale-reminder')->hourly();
