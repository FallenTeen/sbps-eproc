<?php

namespace Database\Seeders;

use App\Domain\Core\Models\UnitBisnis;
use Illuminate\Database\Seeder;

class UnitBisnisSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            [
                'kode' => 'GCS',
                'nama' => 'General Contractor & Supplier',
                'deskripsi' => 'Jasa angkutan & sewa alat berat',
            ],
            [
                'kode' => 'CBP',
                'nama' => 'Concrete Batching Plant',
                'deskripsi' => 'Produksi beton ready-mix',
            ],
            [
                'kode' => 'AMP',
                'nama' => 'Asphalt Mixing Plant',
                'deskripsi' => 'Produksi hotmix',
            ],
        ];

        foreach ($units as $unit) {
            UnitBisnis::updateOrCreate(
                ['kode' => $unit['kode']],
                [
                    'nama' => $unit['nama'],
                    'deskripsi' => $unit['deskripsi'],
                    'aktif' => true,
                ]
            );
        }
    }
}
