<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\HelperArmada;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class HelperArmadaFactory extends Factory
{
    protected $model = HelperArmada::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'armada_id' => Armada::factory(),
            'nama' => $this->faker->name(),
            'no_hp' => $this->faker->numerify('08##########'),
            'honor' => $this->faker->randomFloat(0, 100000, 500000),
            'durasi_mulai' => now()->toDateString(),
            'durasi_selesai' => null,
            'status' => 'aktif',
            'created_by' => User::factory(),
        ];
    }
}