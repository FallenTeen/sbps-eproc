<?php

namespace Database\Factories\Domain\HR\Models;

use App\Domain\HR\Models\Cuti;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Factories\Factory;

class CutiFactory extends Factory
{
    protected $model = Cuti::class;

    public function definition()
    {
        return [
            'karyawan_id' => Karyawan::factory(),
            'tipe' => 'tahunan',
            'tanggal_mulai' => now()->addDays(2)->format('Y-m-d'),
            'tanggal_selesai' => now()->addDays(5)->format('Y-m-d'),
            'status' => 'diajukan',
            'disetujui_oleh' => null,
            'catatan' => $this->faker->sentence(),
        ];
    }
}
