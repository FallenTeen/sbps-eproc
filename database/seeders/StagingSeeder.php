<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder untuk environment STAGING/DEV (bukan production).
 *
 * Memanggil seluruh seeder: data asli (armada, user esensial) + data dummy
 * (user/role/karyawan/transaksional demo) yang ditandai jelas dengan prefix "d"
 * pada nama dan domain @dummy.com pada email.
 */
class StagingSeeder extends Seeder
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
            MobileTestUserSeeder::class,
            MobileDemoDataSeeder::class,
            MobileArmadaDemoSeeder::class,
        ]);
    }
}
