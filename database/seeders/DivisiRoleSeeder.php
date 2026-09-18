<?php

namespace Database\Seeders;

use App\Support\RoleMatrix;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DivisiRoleSeeder extends Seeder
{
    /**
     * Menyinkronkan role divisi ke matriks kanonik (base + augment divisi).
     *
     * AMAN & NON-DESTRUKTIF terhadap privilege lain: syncPermissions diisi
     * hasil union matriks RoleMatrix, sehingga tidak pernah menghilangkan
     * permission seperti `approve fleet service` yang sebelumnya tertimpa
     * (root cause tombol approval hilang untuk ketua.armada@example.com).
     */
    public function run(): void
    {
        app()->make(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (array_keys(RoleMatrix::DIVISI_AUGMENTS) as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions(RoleMatrix::privilegesFor($roleName));
        }
    }
}