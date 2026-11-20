<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Core\Models\Proyek;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaOdoAwalProyek;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ArmadaOdoAwalProyekFactory extends Factory
{
    protected $model = ArmadaOdoAwalProyek::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'armada_id' => Armada::factory(),
            'proyek_id' => Proyek::factory(),
            'odo_awal' => $this->faker->randomFloat(2, 1000, 50000),
            'jarak_ke_pusat_km' => $this->faker->randomFloat(2, 5, 500),
            'dicatat_oleh_karyawan_id' => Karyawan::factory(),
            'tanggal' => now()->toDateString(),
        ];
    }
}