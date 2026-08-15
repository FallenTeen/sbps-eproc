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
            // Core & Proyek
            'manage proyek',
            'view proyek',
            'manage rab',
            'view rab',
            'manage role',
            'view owner dashboard',

            // Procurement
            'manage procurement',
            'view procurement',
            'approve procurement',
            'receive procurement',
            'pay procurement',
            'manage bahan baku',
            'view bahan baku',
            'manage supplier',
            'view supplier',
            'approve procurement fleet',   // approve PO armada max 25jt
            'approve procurement produksi', // approve PO bahan baku max 20jt
            'approve procurement kontrak',  // approve PO kontrak max 30jt
            'approve procurement keuangan', // approve PO keuangan max 50jt

            // Fleet
            'manage fleet',
            'view fleet',
            'record ritase',
            'record sewa',

            // Production
            'manage production',
            'manage production cbp',
            'manage production amp',
            'view production',
            'start session',
            'end session',
            'manage qc',

            // HR & Payroll
            'manage hr',
            'view hr',
            'manage payroll',
            'view payroll',

            // Finance
            'manage finance',
            'view finance',
            'manage kas',
            'manage invoice',
            'view invoice',

            // Lapangan
            'manage presensi',
            'manage formulir lapangan',

            // Portal Kontraktor
            'view kontraktor',
            'manage kontraktor',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $roles = [
            // ─── Super Admin ───────────────────────────────────────────
            'Owner' => [
                'manage proyek', 'view proyek', 'manage rab', 'view rab', 'manage role', 'view owner dashboard',
                'manage procurement', 'view procurement', 'approve procurement', 'receive procurement', 'pay procurement',
                'manage bahan baku', 'view bahan baku', 'manage supplier', 'view supplier',
                'approve procurement fleet', 'approve procurement produksi', 'approve procurement kontrak', 'approve procurement keuangan',
                'manage fleet', 'view fleet', 'record ritase', 'record sewa',
                'manage production', 'manage production cbp', 'manage production amp', 'view production', 'start session', 'end session', 'manage qc',
                'manage hr', 'view hr', 'manage payroll', 'view payroll',
                'manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice',
                'manage presensi', 'manage formulir lapangan',
            ],

            // ─── Admin & Koordinator ───────────────────────────────────
            'Admin Keuangan' => [
                'view owner dashboard',
                'approve procurement', 'pay procurement', 'approve procurement keuangan', 'view procurement',
                'manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice',
                'manage rab', 'view rab', 'view proyek', 'view fleet',
                'view production',
                'manage payroll', 'view payroll',
            ],
            'Koordinator Procurement' => [
                'manage procurement', 'view procurement', 'receive procurement',
                'manage bahan baku', 'view bahan baku', 'manage supplier', 'view supplier',
                'view proyek', 'view rab',
            ],
            'Koordinator GCS' => [
                'manage fleet', 'view fleet', 'record ritase', 'record sewa', 'view proyek',
            ],
            'Koordinator CBP' => [
                'manage production', 'manage production cbp', 'view production',
                'start session', 'end session', 'manage qc',
                'view proyek', 'manage rab', 'view rab',
            ],
            'Koordinator AMP' => [
                'manage production', 'manage production amp', 'view production',
                'start session', 'end session',
                'view proyek', 'manage rab', 'view rab',
            ],
            'Koordinator SDM' => [
                'manage hr', 'view hr', 'manage payroll', 'view payroll', 'manage presensi', 'view proyek',
            ],
            'Mandor Proyek' => [
                'manage proyek', 'view proyek', 'manage rab', 'view rab',
                'view production', 'start session', 'end session', 'manage qc',
                'manage presensi', 'manage formulir lapangan',
            ],
            'Kontraktor' => [
                'view proyek', 'view kontraktor',
            ],

            // ─── Ketua Divisi ───────────────────────────────────────────
            'Ketua Divisi Keuangan' => [
                'manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice',
                'manage rab', 'view rab', 'view proyek',
                'approve procurement keuangan', 'pay procurement',
            ],
            'Ketua Divisi Finance' => [
                'manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice',
                'manage rab', 'view rab', 'view proyek',
                'approve procurement keuangan', 'pay procurement',
            ],
            'Ketua Divisi Armada' => [
                'manage fleet', 'view fleet', 'record ritase', 'record sewa', 'view proyek',
                'approve procurement fleet',
            ],
            'Ketua Divisi Produksi CBP' => [
                'manage production', 'manage production cbp', 'view production',
                'start session', 'end session', 'manage qc',
                'manage rab', 'view rab', 'view proyek',
                'approve procurement produksi',
            ],
            'Ketua Divisi Produksi AMP' => [
                'manage production', 'manage production amp', 'view production',
                'start session', 'end session',
                'manage rab', 'view rab', 'view proyek',
                'approve procurement produksi',
            ],
            'Ketua Divisi Kontraktor' => [
                'manage proyek', 'view proyek', 'manage rab', 'view rab',
                'manage hr', 'view hr', 'view payroll',
                'manage invoice', 'view invoice',
                'manage finance', 'manage presensi',
                'approve procurement kontrak',
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
