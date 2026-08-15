<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\BbmLog;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BbmLogFactory extends Factory
{
    protected $model = BbmLog::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'serviceable_type' => Armada::class,
            'serviceable_id' => Armada::factory(),
            'tanggal' => now()->toDateString(),
            'liter' => $this->faker->randomFloat(1, 20, 200),
            'biaya' => $this->faker->numberBetween(100000, 2000000),
            'jam_operasional_saat_isi' => $this->faker->randomFloat(1, 1, 12),
            'purchase_order_id' => null,
            'dicatat_oleh' => \App\Models\User::factory(),
        ];
    }
}