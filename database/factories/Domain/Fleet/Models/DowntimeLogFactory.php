<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\DowntimeLog;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class DowntimeLogFactory extends Factory
{
    protected $model = DowntimeLog::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'serviceable_type' => Armada::class,
            'serviceable_id' => Armada::factory(),
            'mulai' => now()->subHour(),
            'selesai' => null,
            'penyebab' => $this->faker->sentence,
            'kategori' => $this->faker->randomElement(['kerusakan', 'menunggu_sparepart', 'lainnya']),
            'catatan' => $this->faker->sentence,
        ];
    }
}
