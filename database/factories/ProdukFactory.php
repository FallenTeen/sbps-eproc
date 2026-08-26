<?php

namespace Database\Factories;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Production\Models\Produk;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProdukFactory extends Factory
{
    protected $model = Produk::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'unit_bisnis_id' => UnitBisnis::factory(),
            'nama' => $this->faker->unique()->words(3, true),
            'kategori' => $this->faker->randomElement(['SPLIT', 'HOTMIX', 'SIRTU', 'PASIR', 'BATU BELAH', 'BETON_COR']),
            'satuan_output' => $this->faker->randomElement(['ton', 'm3']),
            'aktif' => true,
        ];
    }

    public function beton(): static
    {
        return $this->state(fn (array $attributes) => [
            'kategori' => 'BETON_COR',
            'satuan_output' => 'm3',
            'nama' => 'FC'.$this->faker->randomElement(['10', '15', '20', '25', '30']),
        ]);
    }

    public function split(): static
    {
        return $this->state(fn (array $attributes) => [
            'kategori' => 'SPLIT',
            'satuan_output' => 'ton',
        ]);
    }
}
