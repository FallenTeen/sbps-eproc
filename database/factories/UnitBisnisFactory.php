<?php

namespace Database\Factories;

use App\Domain\Core\Models\UnitBisnis;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UnitBisnisFactory extends Factory
{
    protected $model = UnitBisnis::class;

    public function definition(): array
    {
        $kodes = ['GCS', 'CBP', 'AMP'];
        return [
            'id' => (string) Str::uuid(),
            'kode' => $this->faker->unique()->randomElement($kodes),
            'nama' => $this->faker->company,
            'deskripsi' => $this->faker->sentence,
            'aktif' => true,
        ];
    }

    public function gcs(): static
    {
        return $this->state(fn(array $attributes) => [
            'kode' => 'GCS',
            'nama' => 'General Contractor & Supplier',
        ]);
    }

    public function cbp(): static
    {
        return $this->state(fn(array $attributes) => [
            'kode' => 'CBP',
            'nama' => 'Concrete Batching Plant',
        ]);
    }

    public function amp(): static
    {
        return $this->state(fn(array $attributes) => [
            'kode' => 'AMP',
            'nama' => 'Asphalt Mixing Plant',
        ]);
    }
}
