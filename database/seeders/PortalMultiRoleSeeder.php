<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder demo (staging/dev) untuk user dengan banyak role.
 *
 * User ini dipakai untuk menguji halaman /portal-pilih: setelah login via
 * salah satu portal, PortalController mendeteksi lebih dari satu portal yang
 * cocok lalu mengarahkan ke halaman pilih portal.
 *
 * Role di bawah sengaja tersebar di beberapa portal (tidak termasuk
 * Kontraktor agar tidak mencampur akun eksternal dengan internal).
 */
class PortalMultiRoleSeeder extends Seeder
{
    use StagingOnly;

    public const TEST_EMAIL = 'demo.multirole@dummy.com';

    public const TEST_PASSWORD = 'password';

    /** Role → portal: admin, armada, produksi, keuangan, sdm. */
    private const ROLES = [
        'Koordinator Procurement',
        'Koordinator GCS',
        'Koordinator CBP',
        'Admin Keuangan',
        'Koordinator SDM',
    ];

    public function run(): void
    {
        $this->assertNotProduction();

        $user = User::updateOrCreate(
            ['email' => self::TEST_EMAIL],
            [
                'name' => 'dUser Multi Role',
                'nama_lengkap' => 'Demo User Multi Role',
                'jabatan' => 'Penguji Portal Select',
                'divisi' => 'Manajemen',
                'password' => Hash::make(self::TEST_PASSWORD),
                'is_active' => true,
            ]
        );

        $user->forceFill(['email_verified_at' => now()])->save();
        $user->syncRoles(self::ROLES);

        $this->command?->info(
            'User multi-role dibuat (password: '.self::TEST_PASSWORD.'): '.self::TEST_EMAIL
            .' — '.count(self::ROLES).' portal akan muncul di /portal-pilih.'
        );
    }
}
