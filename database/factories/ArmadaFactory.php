<?php

namespace Database\Factories;

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ArmadaFactory extends Factory
{
    protected $model = Armada::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'unit_bisnis_id' => UnitBisnis::factory(),
            'plat_nomor' => $this->faker->unique()->regexify('[A-Z] \d{3,4} [A-Z]{2,3}'),
            'kode_unit' => $this->faker->unique()->regexify('GCS-[A-Z]{2}-\d{2}'),
            'jenis' => 'dump_truck',
            'model_tarif' => 'ritase',
            'tahun' => $this->faker->numberBetween(2015, 2025),
            'kapasitas' => $this->faker->randomElement(['8 m³', '5 ton', '12 m³']),
            'status' => 'aktif',
            'titik_id' => null,
            'tanggal_mulai_pakai' => $this->faker->date(),
        ];
    }

    public function dumpTruck(): static
    {
        return $this->state(fn () => ['jenis' => 'dump_truck', 'model_tarif' => 'ritase']);
    }

    public function alatBerat(): static
    {
        return $this->state(fn () => ['jenis' => 'alat_berat', 'model_tarif' => 'sewa_jam']);
    }

    public function truckMolen(): static
    {
        return $this->state(fn () => ['jenis' => 'truck_molen', 'model_tarif' => 'sewa_jam']);
    }

    public function servis(): static
    {
        return $this->state(fn () => ['status' => 'servis']);
    }

    public function nonaktif(): static
    {
        return $this->state(fn () => ['status' => 'nonaktif']);
    }
}
