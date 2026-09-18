<?php

namespace Database\Seeders;

use App\Support\RoleMatrix;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()->make(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (RoleMatrix::PERMISSIONS as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Matriks kanonik (base + augment divisi). Idempotent —
        // firstOrCreate + syncPermissions({matriks}) tidak menghapus apa pun
        // selain yang TIDAK ada di matriks.
        foreach (RoleMatrix::ROLES as $name => $basePerms) {
            $role = Role::firstOrCreate(['name' => $name]);
            $role->syncPermissions(RoleMatrix::privilegesFor($name));
        }
    }
}