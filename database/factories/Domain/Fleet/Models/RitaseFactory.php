<?php

namespace Database\Factories\Domain\Fleet\Models;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\HR\Models\Karyawan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RitaseFactory extends Factory
{
    protected $model = Ritase::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'armada_id' => Armada::factory(),
            'driver_karyawan_id' => Karyawan::factory(),
            'tanggal' => now()->toDateString(),
            'rute_tarif_id' => RuteTarif::factory(),
            'kategori' => 'angkut_material',
            'material' => $this->faker->word,
            'jumlah_rit' => $this->faker->numberBetween(1, 10),
            'satuan_volume' => 'ritase',
            'jumlah_volume' => null,
            'tarif_per_rit_snapshot' => $this->faker->numberBetween(50000, 500000),
            'nominal' => null,
            'total_upah_rit' => 0,
            'proyek_id' => null,
            'titik_id' => null,
            'customer' => $this->faker->company,
            'status' => 'draft',
            'catatan' => null,
        ];
    }
}
