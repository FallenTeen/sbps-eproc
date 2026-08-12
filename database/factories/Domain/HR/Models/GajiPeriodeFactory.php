<?php

namespace Database\Factories\Domain\HR\Models;

use App\Domain\HR\Models\GajiPeriode;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Factories\Factory;

class GajiPeriodeFactory extends Factory
{
    protected $model = GajiPeriode::class;

    public function definition()
    {
        return [
            'karyawan_id' => Karyawan::factory(),
            'periode_bulan' => now()->month,
            'periode_tahun' => now()->year,
            'jumlah_hadir' => 20,
            'status' => 'draft',
            'tanggal_dibayar' => null,
            'akun_kas_bank_id' => null,
        ];
    }
}
