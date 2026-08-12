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
            // Core
            'manage procurement',
            'approve procurement',
            'approve procurement fleet',   // approve PO armada max 25jt
            'approve procurement produksi', // approve PO bahan baku max 20jt
            'approve procurement kontrak',  // approve PO kontrak max 30jt
            'approve procurement keuangan', // approve PO keuangan max 50jt
            'manage fleet',
            'manage production',
            'manage hr',
            'manage finance',
            'view owner dashboard',
            'manage rab',
            'manage proyek',
            'manage role',
            // Lapangan
            'manage presensi',
            'manage formulir lapangan',
            'view proyek',
            'view rab',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $roles = [
            // ─── Super Admin ───────────────────────────────────────────
            'Owner' => [
                'manage procurement', 'approve procurement',
                'approve procurement fleet', 'approve procurement produksi',
                'approve procurement kontrak', 'approve procurement keuangan',
                'manage fleet', 'manage production', 'manage hr',
                'manage finance', 'view owner dashboard',
                'manage rab', 'manage proyek', 'manage role',
                'manage presensi', 'manage formulir lapangan',
                'view proyek', 'view rab',
            ],
            // ─── Admin ─────────────────────────────────────────────────
            'Admin Keuangan' => [
                'approve procurement', 'approve procurement keuangan',
                'manage finance', 'manage rab', 'view proyek', 'view rab',
            ],
            'Koordinator Procurement' => ['manage procurement', 'view proyek', 'view rab'],
            'Koordinator GCS'         => ['manage fleet', 'view proyek'],
            'Koordinator CBP'         => ['manage production', 'view proyek', 'manage rab'],
            'Koordinator AMP'         => ['manage production', 'view proyek', 'manage rab'],
            'Koordinator SDM'         => ['manage hr', 'manage presensi', 'view proyek'],
            'Mandor Proyek'           => ['manage proyek', 'manage rab', 'view proyek', 'view rab'],
            'Kontraktor'              => ['view proyek'],

            // ─── Ketua Divisi ───────────────────────────────────────────
            'Ketua Divisi Keuangan' => [
                'manage finance', 'manage rab', 'view proyek', 'view rab',
                'approve procurement keuangan', // sampai 50jt
            ],
            'Ketua Divisi Armada' => [
                'manage fleet', 'view proyek',
                'approve procurement fleet', // sampai 25jt
            ],
            'Ketua Divisi Produksi CBP' => [
                'manage production', 'manage rab', 'view proyek', 'view rab',
                'approve procurement produksi', // sampai 20jt
            ],
            'Ketua Divisi Produksi AMP' => [
                'manage production', 'manage rab', 'view proyek', 'view rab',
                'approve procurement produksi', // sampai 20jt
            ],
            'Ketua Divisi Kontraktor' => [
                'manage proyek', 'manage rab', 'manage hr', 'manage presensi',
                'view proyek', 'view rab', 'manage finance',
                'approve procurement kontrak', // sampai 30jt
            ],

            // ─── Role Lapangan ──────────────────────────────────────────
            'Mandor Titik'              => ['view proyek', 'view rab', 'manage presensi', 'manage formulir lapangan'],
            'Driver Standby'            => ['view proyek', 'manage formulir lapangan'],
            'Driver Kondisional'        => ['view proyek', 'manage formulir lapangan'],
            'SDM Lapangan Kondisional'  => ['view proyek', 'manage presensi', 'manage formulir lapangan'],
        ];

        foreach ($roles as $name => $perms) {
            $role = Role::firstOrCreate(['name' => $name]);
            $role->syncPermissions($perms);
        }
    }
}
