<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;

class TestRoleSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        $this->call([
            RolePermissionSeeder::class,
            DivisiRoleSeeder::class,
        ]);
    }
}
