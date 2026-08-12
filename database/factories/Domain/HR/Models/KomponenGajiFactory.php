<?php

namespace Database\Factories\Domain\HR\Models;

use App\Domain\HR\Models\KomponenGaji;
use App\Domain\HR\Models\GajiPeriode;
use Illuminate\Database\Eloquent\Factories\Factory;

class KomponenGajiFactory extends Factory
{
    protected $model = KomponenGaji::class;

    public function definition()
    {
        return [
            'gaji_periode_id' => GajiPeriode::factory(),
            'jenis' => 'tunjangan',
            'jumlah' => 500000,
            'keterangan' => 'Tunjangan Makan',
        ];
    }
}
