<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder resmi untuk environment PRODUCTION.
 *
 * Hanya memanggil seeder yang berisi DATA ASLI (role, divisi, unit bisnis,
 * user esensial, armada real + driver asli). Tidak boleh memuat data dummy/demo.
 *
 * Seeder lain (dummy/demo) dijamin gagal jika dipanggil langsung di production
 * melalui trait StagingOnly pada masing-masing seeder.
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info('[ProductionSeeder] Menyiapkan data produksi (role, unit bisnis, user esensial, armada real)...');

        $this->call([
            UnitBisnisSeeder::class,
            RolePermissionSeeder::class,
            DivisiRoleSeeder::class,
            UserSeeder::class,
            FleetDataSeeder::class,
        ]);
    }
}
