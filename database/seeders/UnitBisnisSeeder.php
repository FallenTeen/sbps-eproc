<?php

namespace Database\Seeders;

use App\Domain\Core\Models\UnitBisnis;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UnitBisnisSeeder extends Seeder
{
    public function run(): void
    {
        // Nonaktifkan foreign key checks agar bisa truncate
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        UnitBisnis::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Insert data
        UnitBisnis::insert([
            [
                'id' => (string) Str::uuid(),
                'kode' => 'GCS',
                'nama' => 'General Contractor & Supplier',
                'deskripsi' => 'Jasa angkutan & sewa alat berat',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'kode' => 'CBP',
                'nama' => 'Concrete Batching Plant',
                'deskripsi' => 'Produksi beton ready-mix',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'kode' => 'AMP',
                'nama' => 'Asphalt Mixing Plant',
                'deskripsi' => 'Produksi hotmix',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
