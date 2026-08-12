<?php

namespace Database\Factories;

use App\Domain\Procurement\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'kode' => 'SUP-' . str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'nama' => $this->faker->company,
            'kontak' => $this->faker->name,
            'telepon' => $this->faker->phoneNumber,
            'alamat' => $this->faker->address,
            'aktif' => true,
        ];
    }
}
