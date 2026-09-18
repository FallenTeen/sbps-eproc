<?php

namespace App\Console\Commands;

use App\Domain\Core\Models\UnitBisnis;
use App\Models\User;
use App\Support\RoleMatrix;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SeedProduction extends Command
{
    protected $signature = 'app:seed-production';

    protected $description = 'Seed production: matriks role & permission kanonik + unit bisnis + 1 user Owner + 1 user Procurement';

    public function handle(): int
    {
        $this->seedPermissions();
        $this->seedRoles();
        $this->seedUnitBisnis();
        $this->seedUsers();

        $this->info('Production seeding completed successfully.');

        return Command::SUCCESS;
    }

    private function seedPermissions(): void
    {
        foreach (RoleMatrix::PERMISSIONS as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $this->info('Permissions seeded ('.count(RoleMatrix::PERMISSIONS).').');
    }

    private function seedRoles(): void
    {
        foreach (RoleMatrix::ROLES as $roleName => $basePerms) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions(RoleMatrix::privilegesFor($roleName));
        }

        $this->info('Roles seeded ('.count(RoleMatrix::ROLES).').');
    }

    private function seedUnitBisnis(): void
    {
        $units = [
            ['kode' => 'GCS', 'nama' => 'General Contractor & Supplier', 'deskripsi' => 'Jasa angkutan & sewa alat berat'],
            ['kode' => 'CBP', 'nama' => 'Concrete Batching Plant', 'deskripsi' => 'Produksi beton ready-mix'],
            ['kode' => 'AMP', 'nama' => 'Asphalt Mixing Plant', 'deskripsi' => 'Produksi hotmix'],
        ];

        foreach ($units as $unit) {
            UnitBisnis::updateOrCreate(
                ['kode' => $unit['kode']],
                ['nama' => $unit['nama'], 'deskripsi' => $unit['deskripsi'], 'aktif' => true]
            );
        }

        $this->info('Unit Bisnis seeded.');
    }

    private function seedUsers(): void
    {
        // Production hanya butuh 2 user: Owner (guard admin web/mobile) dan
        // Koordinator Procurement (untuk setup PO/supplier). User operasional
        // & demo TIDAK dibuat di production — gunakan app:seed-mobile-demo
        // atau DatabaseSeeder bila env staging/development.
        $users = [
            [
                'email' => 'owner@example.com',
                'name' => 'Owner Utama',
                'nama_lengkap' => 'Bapak Owner Holding',
                'jabatan' => 'Owner / Direktur Utama',
                'role' => 'Owner',
                'unit_bisnis_id' => null,
                'divisi' => 'Manajemen',
            ],
            [
                'email' => 'procurement@example.com',
                'name' => 'Koordinator Procurement',
                'nama_lengkap' => 'Staf Koordinator Procurement',
                'jabatan' => 'Procurement Officer',
                'role' => 'Koordinator Procurement',
                'unit_bisnis_id' => null,
                'divisi' => 'Procurement',
            ],
        ];

        foreach ($users as $uData) {
            $roleName = $uData['role'];
            unset($uData['role']);

            $user = User::updateOrCreate(
                ['email' => $uData['email']],
                array_merge($uData, [
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ])
            );
            $user->syncRoles([$roleName]);
        }

        $this->info('Users seeded (owner + procurement only).');
    }
}