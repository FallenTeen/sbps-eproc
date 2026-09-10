<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class SeedMobileDemo extends Command
{
    protected $signature = 'app:seed-mobile-demo {--fresh : Hapus data demo sebelum seed ulang}';

    protected $description = 'Seed semua data demo untuk aplikasi mobile (staging). Menjalankan MobileTestUserSeeder + MobileDemoDataSeeder + armada data.';

    public function handle(): int
    {
        $this->info('═══════════════════════════════════════════════════');
        $this->info('  SBPS Mobile — Demo Data Seeder (Staging)');
        $this->info('═══════════════════════════════════════════════════');
        $this->newLine();

        // Step 1: MobileTestUserSeeder (users + armada + ritase)
        $this->info('▶ Step 1/3: Menyiapkan user test & data master...');
        Artisan::call('db:seed', [
            '--class' => \Database\Seeders\MobileTestUserSeeder::class,
            '--force' => true,
        ]);
        $this->info('  ' . Artisan::output());

        // Step 2: MobileDemoDataSeeder (presensi, produksi, QC, tracking)
        $this->info('▶ Step 2/3: Menyiapkan data transaksi demo...');
        Artisan::call('db:seed', [
            '--class' => \Database\Seeders\MobileDemoDataSeeder::class,
            '--force' => true,
        ]);
        $this->info('  ' . Artisan::output());

        // Step 3: MobileArmadaDemoSeeder (checklist, ODO, servis, workshop)
        $this->info('▶ Step 3/3: Menyiapkan data armada demo...');
        Artisan::call('db:seed', [
            '--class' => \Database\Seeders\MobileArmadaDemoSeeder::class,
            '--force' => true,
        ]);
        $this->info('  ' . Artisan::output());

        $this->newLine();
        $this->info('═══════════════════════════════════════════════════');
        $this->info('  ✓ Seed selesai! Data demo mobile siap digunakan.');
        $this->info('═══════════════════════════════════════════════════');
        $this->newLine();

        $this->info('Akun test (password: password):');
        $this->table(['Role', 'Email', 'Portal', 'Modul'], [
            ['Mandor Titik', 'test.mandor@example.com', 'Presensi + Proyek', 'produksi, qc, tracking, dashboard, armada'],
            ['SDM Lapangan', 'test.sdm@example.com', 'Presensi', '—'],
            ['Kontraktor', 'test.kontraktor@example.com', 'Proyek', 'dashboard, kontraktor'],
            ['Owner', 'test.owner@example.com', 'Proyek', 'semua modul'],
            ['Admin Keuangan', 'test.keuangan@example.com', 'Proyek', 'tracking, dashboard, keuangan, armada'],
            ['Operator Mesin', 'test.operator.mesin@example.com', 'Proyek', 'produksi, qc, tracking, dashboard'],
            ['Driver Armada', 'test.driver.armada@example.com', 'Proyek', 'armada'],
        ]);

        return Command::SUCCESS;
    }
}
