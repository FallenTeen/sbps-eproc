<?php

namespace Database\Factories;

use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\Proyek;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TitikFactory extends Factory
{
    protected $model = Titik::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'proyek_id' => Proyek::factory(),
            'nama' => 'Titik ' . $this->faker->word,
            'latitude' => $this->faker->latitude(-8, -6),
            'longitude' => $this->faker->longitude(106, 114),
            'radius_presensi_meter' => 100,
            'status' => 'aktif',
        ];
    }
}
