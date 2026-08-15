<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\RuteTarif;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RuteTarifFactory extends Factory
{
    protected $model = RuteTarif::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'unit_bisnis_id' => UnitBisnis::factory(),
            'lokasi_asal' => $this->faker->city,
            'lokasi_tujuan' => $this->faker->city,
            'jarak_km' => $this->faker->numberBetween(5, 100),
            'tarif_per_rit' => $this->faker->numberBetween(50000, 500000),
            'indeks_liter_solar_per_km' => $this->faker->randomFloat(2, 0.2, 0.6),
            'berlaku_dari' => $this->faker->date(),
            'berlaku_sampai' => null,
        ];
    }
}