<?php

namespace Database\Seeders;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Seeder SEKALI-PAKAI untuk akun role baru (Security, Logistik, Operator Alat Berat).
 *
 * Aman dijalankan di lokal maupun server (production) — idempotent
 * (updateOrCreate), tidak menghapus data. Tidak memakai trait StagingOnly
 * karena akun ini dibutuhkan operasional di server.
 *
 * Jalankan:  php artisan db:seed --class=NewRoleUsersSeeder
 * Password :  env NEW_ROLE_PASSWORD (default "password"; WAJIB diganti di server).
 */
class NewRoleUsersSeeder extends Seeder
{
    private const PASSWORD_ENV = 'NEW_ROLE_PASSWORD';

    /** @var array<int, array{email:string,name:string,jabatan:string,role:string,unit:?string,karyawan:bool}> */
    private array $accounts = [
        [
            'email' => 'security@real.com',
            'name' => 'Petugas Security',
            'jabatan' => 'Security Kantor Pusat',
            'role' => 'Security',
            'unit' => null,
            'karyawan' => true,
        ],
        [
            'email' => 'logistik@real.com',
            'name' => 'Petugas Logistik',
            'jabatan' => 'Logistik & Timbang',
            'role' => 'Logistik',
            'unit' => null,
            'karyawan' => true,
        ],
        [
            'email' => 'operator.berat@real.com',
            'name' => 'Operator Alat Berat',
            'jabatan' => 'Operator Alat Berat',
            'role' => 'Operator Alat Berat',
            'unit' => 'GCS',
            'karyawan' => true,
        ],
    ];

    public function run(): void
    {
        $password = (string) env(self::PASSWORD_ENV, 'password');

        if (app()->environment('production') && $password === 'password') {
            $this->command?->warn('[NewRoleUsersSeeder] PERINGATAN: password default dipakai di production. Set env '.self::PASSWORD_ENV.' atau segera ganti setelah seeding.');
        }

        foreach ($this->accounts as $acc) {
            Role::firstOrCreate(['name' => $acc['role'], 'guard_name' => 'web']);

            $unitId = $acc['unit'] ? UnitBisnis::where('kode', $acc['unit'])->value('id') : null;

            $user = User::updateOrCreate(
                ['email' => $acc['email']],
                [
                    'name' => $acc['name'],
                    'nama_lengkap' => $acc['name'],
                    'jabatan' => $acc['jabatan'],
                    'unit_bisnis_id' => $unitId,
                    'is_active' => true,
                    'password' => Hash::make($password),
                    'email_verified_at' => now(),
                ]
            );

            $user->syncRoles([$acc['role']]);

            if ($acc['karyawan']) {
                Karyawan::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'nama' => $acc['name'],
                        'tipe' => 'tetap',
                        'jabatan' => $acc['jabatan'],
                        'status' => 'aktif',
                    ]
                );
            }

            $this->command?->info("  [OK] {$acc['role']} -> {$acc['email']}");
        }

        $this->command?->info('[NewRoleUsersSeeder] Selesai. Password akun: env '.self::PASSWORD_ENV." (default \"password\"). Ganti segera jika dipakai di server.");
    }
}
