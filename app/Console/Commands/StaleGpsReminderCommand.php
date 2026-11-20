<?php

namespace App\Console\Commands;

use App\Domain\Attendance\Models\Presensi;
use App\Domain\Attendance\Notifications\StaleGpsNotification;
use App\Models\User;
use App\Services\PushNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class StaleGpsReminderCommand extends Command
{
    protected $signature = 'tracking:stale-reminder {--stale-minutes=60 : Batas menit tanpa pembaruan lokasi}';

    protected $description = 'Kirim pengingat push ke user dengan presensi aktif yang berhenti memperbarui lokasi GPS';

    public function handle(): int
    {
        if (empty(config('services.firebase.service_account'))) {
            Log::warning('tracking:stale-reminder dilewati: kredensial Firebase belum dikonfigurasi.');
            $this->warn('Kredensial Firebase belum dikonfigurasi, pengingat GPS dilewati.');

            return self::SUCCESS;
        }

        $cutoff = now()->subMinutes((int) $this->option('stale-minutes'));

        $users = User::query()
            ->whereNotNull('device_token')
            ->whereExists(function ($query) use ($cutoff) {
                $query->selectRaw(1)
                    ->from('presensis')
                    ->join('karyawans', 'karyawans.id', '=', 'presensis.karyawan_id')
                    ->whereColumn('karyawans.user_id', 'users.id')
                    ->where('presensis.check_in', '>=', now()->subHours(36))
                    ->whereNull('presensis.check_out')
                    ->where(function ($query) use ($cutoff) {
                        $query->where(function ($query) use ($cutoff) {
                            $query->whereNull('users.last_tracking_at')
                                ->where('presensis.check_in', '<=', $cutoff);
                        })->orWhere('users.last_tracking_at', '<', $cutoff);
                    });
            })
            ->get();

        if ($users->isEmpty()) {
            $this->info('Tidak ada user dengan pemantauan lokasi stale.');

            return self::SUCCESS;
        }

        $push = app(PushNotificationService::class);
        $sent = 0;
        $skipped = 0;

        foreach ($users as $user) {
            // Maksimal 1 push per 3 jam per user.
            if (! Cache::add("stale-gps:notified:{$user->id}", now()->timestamp, now()->addHours(3))) {
                $skipped++;
                continue;
            }

            try {
                $ok = $push->sendToDevice(
                    $user->device_token,
                    'Pemantauan lokasi berhenti',
                    'Buka aplikasi agar pemantauan lokasi berjalan kembali.',
                    ['type' => 'stale_gps', 'category' => 'presensi', 'route' => '/presensi'],
                );
            } catch (\Throwable $e) {
                Log::error('Gagal kirim pengingat GPS stale', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                $skipped++;
                continue;
            }

            if (! $ok) {
                $skipped++;
                continue;
            }

            $user->notify(new StaleGpsNotification);
            $sent++;
        }

        $this->info("Selesai. {$sent} pengingat terkirim, {$skipped} dilewati.");

        return self::SUCCESS;
    }
}
