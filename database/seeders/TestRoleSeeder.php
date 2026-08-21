<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TestRoleSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            DivisiRoleSeeder::class,
        ]);
    }
}
