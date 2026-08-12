<?php

namespace Database\Factories;

use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Core\Models\UnitBisnis;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class AkunKasBankFactory extends Factory
{
    protected $model = AkunKasBank::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'unit_bisnis_id' => UnitBisnis::factory(),
            'nama' => $this->faker->word . ' ' . $this->faker->randomElement(['Kas Kecil', 'Kas Besar', 'Bank']),
            'jenis_kas' => $this->faker->randomElement(['kas_kecil', 'kas_besar', 'kas_operasional', 'bank']),
            'akun_coa_id' => null,
            'saldo_awal' => $this->faker->numberBetween(100000, 10000000),
            'aktif' => true,
        ];
    }
}
