<?php

namespace Database\Factories;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RabFactory extends Factory
{
    protected $model = Rab::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'proyek_id' => Proyek::factory(),
            'titik_id' => null,
            'kategori' => $this->faker->randomElement(['bahan_baku', 'sparepart', 'sdm_tetap', 'sdm_kondisional', 'lainnya']),
            'rencana' => $this->faker->numberBetween(100000, 10000000),
            'catatan' => $this->faker->optional()->sentence,
            'created_by' => User::factory(),
        ];
    }

    public function bahanBaku(): static
    {
        return $this->state(fn (array $attributes) => [
            'kategori' => 'bahan_baku',
        ]);
    }

    public function sparepart(): static
    {
        return $this->state(fn (array $attributes) => [
            'kategori' => 'sparepart',
        ]);
    }
}
