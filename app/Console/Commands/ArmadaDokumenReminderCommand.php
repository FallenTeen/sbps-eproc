<?php

namespace App\Console\Commands;

use App\Domain\Fleet\Models\ArmadaDokumenBerkala;
use App\Domain\Fleet\Notifications\ArmadaDokumenJatuhTempoNotification;
use App\Models\User;
use Illuminate\Console\Command;

class ArmadaDokumenReminderCommand extends Command
{
    protected $signature = 'armada:dokumen-reminder {--days=30 : Batas hari sebelum jatuh tempo}';

    protected $description = 'Kirim notifikasi pengingat dokumen berkala armada yang akan/sudah jatuh tempo';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $this->info("Memeriksa dokumen berkala armada (H-{$days} dan lewat jatuh tempo)...");

        $dokumens = ArmadaDokumenBerkala::with(['armada.drivers.karyawan.user'])
            ->where('tanggal_jatuh_tempo', '<=', now()->addDays($days))
            ->get();

        if ($dokumens->isEmpty()) {
            $this->info('Tidak ada dokumen berkala yang memerlukan pengingat.');
            return self::SUCCESS;
        }

        $managers = User::permission('manage dokumen armada')->get();
        $notifiedCount = 0;

        foreach ($dokumens as $dokumen) {
            $now = now()->startOfDay();
            $sisaHari = (int) $now->diffInDays($dokumen->tanggal_jatuh_tempo, false);

            $recipients = collect($managers);

            // Tambahkan driver aktif pemegang unit bila ada user account
            foreach ($dokumen->armada->drivers as $driver) {
                if ($driver->status === 'aktif' && $driver->karyawan?->user) {
                    $recipients->push($driver->karyawan->user);
                }
            }

            $recipients = $recipients->unique('id');

            foreach ($recipients as $recipient) {
                $recipient->notify(new ArmadaDokumenJatuhTempoNotification($dokumen, $sisaHari));
                $notifiedCount++;
            }
        }

        $this->info("Selesai. {$dokumens->count()} dokumen diperiksa, {$notifiedCount} notifikasi terkirim.");

        return self::SUCCESS;
    }
}
