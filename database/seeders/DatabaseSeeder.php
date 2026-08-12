<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UnitBisnisSeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            BahanBakuSeeder::class,
            SupplierSeeder::class,
        ]);
    }
}
