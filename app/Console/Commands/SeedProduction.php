<?php

namespace App\Console\Commands;

use App\Domain\Core\Models\UnitBisnis;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SeedProduction extends Command
{
    protected $signature = 'app:seed-production';

    protected $description = 'Seed production data: roles, permissions, unit bisnis, and users';

    public function handle(): int
    {
        $this->seedPermissions();
        $this->seedRoles();
        $this->seedDivisiRoles();
        $this->seedUnitBisnis();
        $this->seedUsers();

        $this->info('Production seeding completed successfully.');

        return Command::SUCCESS;
    }

    private function seedPermissions(): void
    {
        $permissions = [
            'manage proyek', 'view proyek', 'manage rab', 'view rab', 'manage role', 'view owner dashboard',
            'manage procurement', 'view procurement', 'approve procurement', 'receive procurement', 'pay procurement',
            'manage bahan baku', 'view bahan baku', 'manage supplier', 'view supplier',
            'approve procurement fleet', 'approve procurement produksi', 'approve procurement kontrak', 'approve procurement keuangan',
            'manage fleet', 'view fleet', 'record ritase', 'record sewa',
            'manage production', 'manage production cbp', 'manage production amp', 'view production', 'start session', 'end session', 'manage qc',
            'manage hr', 'view hr', 'manage payroll', 'view payroll',
            'manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice',
            'manage presensi', 'manage formulir lapangan',
            'view kontraktor', 'manage kontraktor',
            'manage procurement division', 'approve procurement division', 'approve procurement threshold',
            'manage fleet division', 'manage production cbp division', 'manage production amp division',
            'manage hr division', 'manage finance division', 'approve expense division', 'approve payroll division',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $this->info('Permissions seeded.');
    }

    private function seedRoles(): void
    {
        $roles = [
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
            'Mandor Titik'              => ['view proyek', 'view rab', 'manage presensi', 'manage formulir lapangan'],
            'Driver Standby'            => ['view proyek', 'manage formulir lapangan'],
            'Driver Kondisional'        => ['view proyek', 'manage formulir lapangan'],
            'SDM Lapangan Kondisional'  => ['view proyek', 'manage presensi', 'manage formulir lapangan'],
        ];

        foreach ($roles as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions($permissions);
        }

        $this->info('Roles seeded.');
    }

    private function seedDivisiRoles(): void
    {
        $divisiRoles = [
            'Ketua Divisi Finance' => [
                'manage finance division', 'approve expense division', 'approve payroll division',
                'approve procurement division', 'approve procurement threshold',
                'manage rab', 'manage finance', 'pay procurement',
            ],
            'Ketua Divisi Keuangan' => [
                'manage finance division', 'approve expense division', 'approve payroll division',
                'approve procurement division', 'approve procurement threshold',
                'manage rab', 'manage finance', 'pay procurement',
            ],
            'Ketua Divisi Armada' => [
                'manage fleet division', 'approve procurement division',
                'manage fleet', 'view fleet', 'record ritase', 'record sewa',
            ],
            'Ketua Divisi Kontraktor' => [
                'manage proyek', 'manage rab', 'approve procurement division',
            ],
            'Ketua Divisi Produksi CBP' => [
                'manage production cbp division', 'approve procurement division', 'manage production',
            ],
            'Ketua Divisi Produksi AMP' => [
                'manage production amp division', 'approve procurement division', 'manage production',
            ],
        ];

        foreach ($divisiRoles as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions(array_unique(array_merge($role->permissions->pluck('name')->toArray(), $permissions)));
        }

        $this->info('Divisi roles augmented.');
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
        $gcs = UnitBisnis::where('kode', 'GCS')->first();
        $cbp = UnitBisnis::where('kode', 'CBP')->first();
        $amp = UnitBisnis::where('kode', 'AMP')->first();

        $users = [
            ['email' => 'owner@example.com', 'name' => 'Owner Utama', 'nama_lengkap' => 'Bapak Owner Holding', 'jabatan' => 'Owner / Direktur Utama', 'role' => 'Owner', 'unit_bisnis_id' => null, 'divisi' => 'Manajemen'],
            ['email' => 'adminkeug@example.com', 'name' => 'Admin Keuangan', 'nama_lengkap' => 'Ibu Admin Keuangan Pusat', 'jabatan' => 'Admin Keuangan & RAB', 'role' => 'Admin Keuangan', 'unit_bisnis_id' => null, 'divisi' => 'Finance'],
            ['email' => 'ketua.finance@example.com', 'name' => 'Ketua Divisi Keuangan', 'nama_lengkap' => 'Bapak Ketua Finance', 'jabatan' => 'Head of Finance Division', 'role' => 'Ketua Divisi Keuangan', 'unit_bisnis_id' => null, 'divisi' => 'Finance'],
            ['email' => 'ketua.armada@example.com', 'name' => 'Ketua Divisi Armada', 'nama_lengkap' => 'Bapak Ketua Armada GCS', 'jabatan' => 'Head of Fleet & Transport', 'role' => 'Ketua Divisi Armada', 'unit_bisnis_id' => $gcs?->id, 'divisi' => 'Armada'],
            ['email' => 'ketua.kontraktor@example.com', 'name' => 'Ketua Divisi Kontraktor', 'nama_lengkap' => 'Bapak Ketua Divisi Kontraktor', 'jabatan' => 'Head of Contractor Relations', 'role' => 'Ketua Divisi Kontraktor', 'unit_bisnis_id' => null, 'divisi' => 'Kontraktor'],
            ['email' => 'ketua.cbp@example.com', 'name' => 'Ketua Divisi Produksi CBP', 'nama_lengkap' => 'Bapak Ketua Produksi CBP', 'jabatan' => 'Head of CBP Plant', 'role' => 'Ketua Divisi Produksi CBP', 'unit_bisnis_id' => $cbp?->id, 'divisi' => 'Produksi'],
            ['email' => 'ketua.amp@example.com', 'name' => 'Ketua Divisi Produksi AMP', 'nama_lengkap' => 'Bapak Ketua Produksi AMP', 'jabatan' => 'Head of AMP Plant', 'role' => 'Ketua Divisi Produksi AMP', 'unit_bisnis_id' => $amp?->id, 'divisi' => 'Produksi'],
            ['email' => 'procurement@example.com', 'name' => 'Koordinator Procurement', 'nama_lengkap' => 'Staf Koordinator Procurement', 'jabatan' => 'Procurement Officer', 'role' => 'Koordinator Procurement', 'unit_bisnis_id' => null, 'divisi' => 'Procurement'],
            ['email' => 'gcs@example.com', 'name' => 'Koordinator GCS', 'nama_lengkap' => 'Staf Operasional Armada GCS', 'jabatan' => 'GCS Fleet Officer', 'role' => 'Koordinator GCS', 'unit_bisnis_id' => $gcs?->id, 'divisi' => 'Armada'],
            ['email' => 'cbp@example.com', 'name' => 'Koordinator CBP', 'nama_lengkap' => 'Staf Operasional Batching Plant', 'jabatan' => 'CBP Plant Officer', 'role' => 'Koordinator CBP', 'unit_bisnis_id' => $cbp?->id, 'divisi' => 'Produksi'],
            ['email' => 'amp@example.com', 'name' => 'Koordinator AMP', 'nama_lengkap' => 'Staf Operasional Hotmix Plant', 'jabatan' => 'AMP Plant Officer', 'role' => 'Koordinator AMP', 'unit_bisnis_id' => $amp?->id, 'divisi' => 'Produksi'],
            ['email' => 'sdm@example.com', 'name' => 'Koordinator SDM', 'nama_lengkap' => 'Staf HRD & General Affairs', 'jabatan' => 'HR Coordinator', 'role' => 'Koordinator SDM', 'unit_bisnis_id' => null, 'divisi' => 'HR'],
            ['email' => 'mandor@example.com', 'name' => 'Mandor Proyek', 'nama_lengkap' => 'Mandor Lapangan Utama', 'jabatan' => 'Site Supervisor', 'role' => 'Mandor Proyek', 'unit_bisnis_id' => null, 'divisi' => 'Lapangan'],
            ['email' => 'mandor.titik@example.com', 'name' => 'Mandor Titik', 'nama_lengkap' => 'Mandor Per-Titik Lapangan', 'jabatan' => 'Mandor Titik', 'role' => 'Mandor Titik', 'unit_bisnis_id' => $gcs?->id, 'divisi' => 'Lapangan'],
            ['email' => 'driver.standby@example.com', 'name' => 'Driver Standby', 'nama_lengkap' => 'Pengemudi Standby Harian', 'jabatan' => 'Driver Standby', 'role' => 'Driver Standby', 'unit_bisnis_id' => $gcs?->id, 'divisi' => 'Armada'],
            ['email' => 'driver.kondisional@example.com', 'name' => 'Driver Kondisional', 'nama_lengkap' => 'Pengemudi Borongan/Kondisional', 'jabatan' => 'Driver Kondisional', 'role' => 'Driver Kondisional', 'unit_bisnis_id' => $gcs?->id, 'divisi' => 'Armada'],
            ['email' => 'sdm.lapangan@example.com', 'name' => 'SDM Lapangan', 'nama_lengkap' => 'Tenaga Harian Lapangan', 'jabatan' => 'SDM Lapangan Kondisional', 'role' => 'SDM Lapangan Kondisional', 'unit_bisnis_id' => null, 'divisi' => 'Lapangan'],
            ['email' => 'kontraktor@example.com', 'name' => 'Mitra Kontraktor Klien', 'nama_lengkap' => 'Perwakilan Kontraktor Klien', 'jabatan' => 'External Contractor Lead', 'role' => 'Kontraktor', 'unit_bisnis_id' => null, 'divisi' => 'Eksternal'],
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

        $this->info('Users seeded.');
    }
}
