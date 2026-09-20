<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('Environment production terdeteksi: hanya ProductionSeeder (data asli) yang diizinkan.');

            $this->call(ProductionSeeder::class);

            return;
        }

        $this->call(StagingSeeder::class);
    }
}
