<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Seeder resmi untuk environment PRODUCTION.
 *
 * Menyiapkan role, divisi, unit bisnis, akun operasional penting, dan versi
 * aplikasi. Tidak memuat data transaksi dummy atau menghapus data production.
 *
 * Seeder lain (dummy/demo) dijamin gagal jika dipanggil langsung di production
 * melalui trait StagingOnly pada masing-masing seeder.
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('production')) {
            throw new RuntimeException('ProductionSeeder hanya boleh dijalankan saat APP_ENV=production.');
        }

        $this->call([
            UnitBisnisSeeder::class,
            RolePermissionSeeder::class,
            DivisiRoleSeeder::class,
            UserSeeder::class,
            AppVersionSeeder::class,
        ]);

        $this->command?->info('[ProductionSeeder] Role, permission, unit bisnis, akun penting, dan versi aplikasi siap.');
    }
}
