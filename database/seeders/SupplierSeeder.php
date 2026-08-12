<?php

namespace Database\Seeders;

use App\Domain\Procurement\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        Supplier::query()->delete();

        Supplier::insert([
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'kode' => 'SUP-001',
                'nama' => 'PT. Bahan Bangunan Jaya',
                'kontak' => 'Budi',
                'telepon' => '08123456789',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'kode' => 'SUP-002',
                'nama' => 'CV. Sparepart Andal',
                'kontak' => 'Ani',
                'telepon' => '08198765432',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
