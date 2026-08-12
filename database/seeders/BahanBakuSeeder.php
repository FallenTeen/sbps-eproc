<?php

namespace Database\Seeders;

use App\Domain\Procurement\Models\BahanBaku;
use Illuminate\Database\Seeder;

class BahanBakuSeeder extends Seeder
{
    public function run(): void
    {
        BahanBaku::query()->delete();

        BahanBaku::insert([
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'kode' => 'BB-001',
                'nama' => 'Semen',
                'kategori' => 'bahan_baku',
                'sparepart_untuk' => null,
                'satuan' => 'kg',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'kode' => 'BB-002',
                'nama' => 'Pasir',
                'kategori' => 'bahan_baku',
                'sparepart_untuk' => null,
                'satuan' => 'kg',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'kode' => 'BB-003',
                'nama' => 'Split 1/2',
                'kategori' => 'bahan_baku',
                'sparepart_untuk' => null,
                'satuan' => 'kg',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'kode' => 'BB-004',
                'nama' => 'Air',
                'kategori' => 'bahan_baku',
                'sparepart_untuk' => null,
                'satuan' => 'liter',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'kode' => 'SP-001',
                'nama' => 'Oli Mesin',
                'kategori' => 'sparepart',
                'sparepart_untuk' => 'armada',
                'satuan' => 'liter',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'kode' => 'SP-002',
                'nama' => 'Filter Udara',
                'kategori' => 'sparepart',
                'sparepart_untuk' => 'armada',
                'satuan' => 'unit',
                'aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
