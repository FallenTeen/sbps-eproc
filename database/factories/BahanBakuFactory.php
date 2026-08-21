<?php

namespace Database\Factories;

use App\Domain\Procurement\Models\BahanBaku;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class BahanBakuFactory extends Factory
{
    use HasFactory;

    protected $model = BahanBaku::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'kode' => 'BB-'.str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'nama' => $this->faker->word,
            'kategori' => $this->faker->randomElement(['bahan_baku', 'sparepart']),
            'sparepart_untuk' => null,
            'satuan' => $this->faker->randomElement(['kg', 'liter', 'unit', 'ton']),
            'aktif' => true,
        ];
    }

    public function bahanBaku(): static
    {
        return $this->state(fn (array $attributes) => [
            'kategori' => 'bahan_baku',
            'sparepart_untuk' => null,
        ]);
    }

    public function sparepart(): static
    {
        return $this->state(fn (array $attributes) => [
            'kategori' => 'sparepart',
            'sparepart_untuk' => $this->faker->randomElement(['armada', 'mesin']),
        ]);
    }
}
