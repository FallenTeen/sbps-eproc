<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DivisiRoleSeeder extends Seeder
{
    public function run(): void
    {
        app()->make(PermissionRegistrar::class)->forgetCachedPermissions();

        // 1. Permissions khusus divisi & approval
        $divisiPermissions = [
            'manage procurement',
            'approve procurement',
            'receive procurement',
            'pay procurement',
            'manage bahan baku',
            'manage supplier',
            'manage fleet',
            'view fleet',
            'record ritase',
            'record sewa',
            'manage procurement division',
            'approve procurement division',
            'approve procurement threshold',
            'manage fleet division',
            'manage production cbp division',
            'manage production amp division',
            'manage hr division',
            'manage finance division',
            'approve expense division',
            'approve payroll division',
        ];

        foreach ($divisiPermissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName]);
        }

        // 2. Roles & Mapping Permissions
        $divisiRoles = [
            'Ketua Divisi Finance' => [
                'manage finance division',
                'approve expense division',
                'approve payroll division',
                'approve procurement division',
                'approve procurement threshold',
                'manage rab',
                'manage finance',
                'pay procurement',
            ],
            'Ketua Divisi Keuangan' => [
                'manage finance division',
                'approve expense division',
                'approve payroll division',
                'approve procurement division',
                'approve procurement threshold',
                'manage rab',
                'manage finance',
                'pay procurement',
            ],
            'Ketua Divisi Armada' => [
                'manage fleet division',
                'approve procurement division',
                'manage fleet',
                'view fleet',
                'record ritase',
                'record sewa',
            ],
            'Ketua Divisi Kontraktor' => [
                'manage proyek',
                'manage rab',
                'approve procurement division',
            ],
            'Ketua Divisi Produksi CBP' => [
                'manage production cbp division',
                'approve procurement division',
                'manage production',
            ],
            'Ketua Divisi Produksi AMP' => [
                'manage production amp division',
                'approve procurement division',
                'manage production',
            ],
        ];

        foreach ($divisiRoles as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions($permissions);
        }
    }
}
