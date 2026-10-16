<?php

namespace Database\Seeders;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeder SEMENTARA — data operator alat berat BARU (satu kali migrasi data).
 *
 * Tujuan: menambahkan operator alat berat baru (+ akun login) ke database yang
 * SUDAH berjalan tanpa harus reset database. Seeder ini hanya berisi operator
 * yang belum ada di FleetDataSeeder sebelum perubahan, bukan seluruh data.
 *
 * Jalankan mandiri:
 *   php artisan db:seed --class=TemporaryNewFleetEmployeesSeeder --force
 *
 * Catatan:
 *   - Tidak menjalankan migration maupun seeder lain.
 *   - Tidak menghapus data apa pun.
 *   - Idempotent (updateOrCreate / firstOrCreate); dijalankan berulang aman.
 *   - Akun login mengikuti konvensi driver: email slug(nama)@real.com,
 *     password 'password', role 'Driver Armada', unit bisnis GCS. Password akun
 *     lama tidak pernah ditimpa.
 *   - Tidak membuat relasi armada: alat berat tidak dicatat sebagai Armada
 *     karena foto tidak menyediakan kode unit unik per alat.
 *   - Data yang sama sudah dimasukkan ke FleetDataSeeder; file ini boleh
 *     DIHAPUS setelah data diverifikasi masuk ke database.
 */
class TemporaryNewFleetEmployeesSeeder extends Seeder
{
    private const PASSWORD = 'password';

    public function run(): void
    {
        $gcs = UnitBisnis::where('kode', 'GCS')->first();

        $rows = $this->rows();

        foreach ($rows as $row) {
            $nama = $row['nama'];
            $email = Str::slug($nama).'@real.com';

            $user = User::where('email', $email)->first();
            if (! $user) {
                $user = User::create([
                    'name' => $nama,
                    'nama_lengkap' => $nama,
                    'jabatan' => $row['jabatan'],
                    'email' => $email,
                    'password' => Hash::make(self::PASSWORD),
                    'email_verified_at' => now(),
                    'unit_bisnis_id' => $gcs?->id,
                    'divisi' => 'Armada',
                    'is_active' => true,
                ]);
                $user->syncRoles(['Driver Armada']);
            }

            Karyawan::updateOrCreate(
                ['nama' => $nama],
                [
                    'user_id' => $user->id,
                    'tipe' => 'harian',
                    'jabatan' => $row['jabatan'],
                    'rate_gaji_pokok' => null,
                    'rate_harian' => null,
                    'no_hp' => $row['no_hp'],
                    'alias' => $row['alias'] ?? null,
                    'status' => 'aktif',
                ]
            );
        }

        $this->command?->info('[TemporaryNewFleetEmployeesSeeder] '.count($rows).' operator alat berat baru + akun login disinkronkan.');
    }

    /** @return array<int, array<string, mixed>> */
    private function rows(): array
    {
        return [
            ['nama' => 'TOBIL', 'jabatan' => 'Operator Excavator', 'no_hp' => '0857-2710-1200', 'alias' => null],
            ['nama' => 'ANTO', 'jabatan' => 'Operator Excavator', 'no_hp' => '0821-3332-1129', 'alias' => null],
            ['nama' => 'ROKHANI', 'jabatan' => 'Operator Excavator', 'no_hp' => '0857-0177-6117', 'alias' => null],
            ['nama' => 'SOKIB', 'jabatan' => 'Operator Alat Berat', 'no_hp' => '0852-3261-1908', 'alias' => null],
            ['nama' => 'ANDRI', 'jabatan' => 'Operator Vibro', 'no_hp' => '0812-2597-1326', 'alias' => null],
            ['nama' => 'MUKHSIN', 'jabatan' => 'Operator Bulldozer', 'no_hp' => '0851-4711-3033', 'alias' => null],
            ['nama' => 'ARI', 'jabatan' => 'Operator Excavator', 'no_hp' => '0813-9019-6117', 'alias' => null],
            ['nama' => 'HONO', 'jabatan' => 'Operator Excavator', 'no_hp' => '0856-4320-3501', 'alias' => null],
        ];
    }
}
