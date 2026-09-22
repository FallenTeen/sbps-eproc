<?php

namespace Database\Seeders;

use App\Domain\Procurement\Models\Supplier;
use Database\Seeders\Concerns\StagingOnly;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SupplierSeeder extends Seeder
{
    use StagingOnly;

    public function run(): void
    {
        $this->assertNotProduction();

        Supplier::query()->delete();

        Supplier::insert([
            [
                'id' => (string) Str::uuid(),
                'kode' => 'SUP-001',
                'nama' => 'PT. Bahan Bangunan Jaya',
                'kontak' => 'Budi',
                'telepon' => '08123456789',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'kode' => 'SUP-002',
                'nama' => 'CV. Sparepart Andal',
                'kontak' => 'Ani',
                'telepon' => '08198765432',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'kode' => 'SUP-003',
                'nama' => 'PT Aspal Nusantara',
                'kontak' => 'Cahyo',
                'telepon' => '082122334455',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'kode' => 'SUP-004',
                'nama' => 'Toko Bangunan Berkah Jaya',
                'kontak' => 'Dewi',
                'telepon' => '082145678901',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'kode' => 'SUP-005',
                'nama' => 'PT Quarry Agrekon',
                'kontak' => 'Eko',
                'telepon' => '082189012345',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
