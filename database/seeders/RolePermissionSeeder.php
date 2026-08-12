<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Hapus data lama (opsional, hati-hati)
        // Jika mau hapus semua, aktifkan baris di bawah:
        // DB::table('role_has_permissions')->truncate();
        // DB::table('model_has_roles')->truncate();
        // DB::table('model_has_permissions')->truncate();
        // DB::table('permissions')->truncate();
        // DB::table('roles')->truncate();

        $permissions = [
            'manage procurement',
            'approve procurement',
            'manage fleet',
            'manage production',
            'manage hr',
            'manage finance',
            'view owner dashboard',
            'manage rab',
            'manage proyek',
            'manage role',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $roles = [
            'Owner' => ['manage procurement', 'approve procurement', 'manage fleet', 'manage production', 'manage hr', 'manage finance', 'view owner dashboard', 'manage rab', 'manage proyek', 'manage role'],
            'Admin Keuangan' => ['approve procurement', 'manage finance', 'manage rab'],
            'Koordinator Procurement' => ['manage procurement'],
            'Koordinator GCS' => ['manage fleet'],
            'Koordinator CBP' => ['manage production'],
            'Koordinator AMP' => ['manage production'],
            'Koordinator SDM' => ['manage hr'],
            'Mandor Proyek' => ['manage proyek', 'manage rab'],
            'Kontraktor' => [],
        ];

        foreach ($roles as $name => $perms) {
            $role = Role::firstOrCreate(['name' => $name]);
            $role->syncPermissions($perms);
        }
    }
}
