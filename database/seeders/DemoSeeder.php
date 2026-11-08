<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $this->call([
            ProcurementDataSeeder::class,
            ProductionDataSeeder::class,
            FinanceDataSeeder::class,
            FinanceManualRekapDemoSeeder::class,
            AttendanceDataSeeder::class,
            ArmadaDokumenBerkalaSeeder::class,
            InventoryDemoSeeder::class,
            LogistikDemoSeeder::class,
            MobileTestUserSeeder::class,
            SecurityDemoSeeder::class,
            MobileDemoDataSeeder::class,
            MobileArmadaDemoSeeder::class,
            ServisEksternalDemoSeeder::class,
        ]);
    }
}
