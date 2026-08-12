<?php

namespace Database\Factories;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProyekFactory extends Factory
{
    protected $model = Proyek::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'unit_bisnis_id' => UnitBisnis::factory(),
            'kode_proyek' => 'PRY-' . strtoupper(Str::random(8)),
            'nama' => $this->faker->sentence(3),
            'tipe_proyek' => $this->faker->randomElement(['internal', 'kontrak_klien']),
            'client' => $this->faker->optional()->company,
            'lokasi' => $this->faker->city,
            'tanggal_mulai' => $this->faker->date(),
            'tanggal_selesai_rencana' => $this->faker->optional()->date(),
            'tanggal_selesai_aktual' => null,
            'status' => 'aktif',
            'catatan' => $this->faker->optional()->sentence,
            'created_by' => User::factory(), // <- menggunakan factory
        ];
    }

    public function internal(): static
    {
        return $this->state(fn(array $attributes) => [
            'tipe_proyek' => 'internal',
            'client' => null,
        ]);
    }

    public function kontrakKlien(): static
    {
        return $this->state(fn(array $attributes) => [
            'tipe_proyek' => 'kontrak_klien',
            'client' => $this->faker->company,
        ]);
    }
}
