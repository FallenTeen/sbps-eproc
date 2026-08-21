<?php

namespace Database\Factories;

use App\Domain\Core\Models\Proyek;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PurchaseOrderFactory extends Factory
{
    protected $model = PurchaseOrder::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'kode_po' => 'PO-'.now()->format('Ymd').'-'.str_pad($this->faker->unique()->numberBetween(1, 999), 4, '0', STR_PAD_LEFT),
            'proyek_id' => Proyek::factory(),
            'titik_id' => null,
            'supplier_id' => Supplier::factory(),
            'created_by' => User::factory(),
            'tanggal_pesan' => $this->faker->date(),
            'tanggal_diperlukan' => $this->faker->optional()->date(),
            'total' => 0,
            'status' => 'draft',
            'catatan' => $this->faker->optional()->sentence,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'draft']);
    }

    public function diajukan(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'diajukan']);
    }

    public function disetujui(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'disetujui']);
    }

    public function diterima(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'diterima']);
    }

    public function lunas(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'lunas']);
    }
}
