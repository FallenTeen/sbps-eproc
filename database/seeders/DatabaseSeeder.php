<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CleanDataSeeder::class,
            UnitBisnisSeeder::class,
            RolePermissionSeeder::class,
            DivisiRoleSeeder::class,
            UserSeeder::class,
            BahanBakuSeeder::class,
            SupplierSeeder::class,
            ProyekSeeder::class,
            KaryawanSeeder::class,
            AkunKasBankSeeder::class,
            FleetDataSeeder::class,
            ProcurementDataSeeder::class,
            ProductionDataSeeder::class,
            FinanceDataSeeder::class,
            AttendanceDataSeeder::class,
            AppVersionSeeder::class,
        ]);
    }
}
