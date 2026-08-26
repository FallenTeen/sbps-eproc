<?php

namespace Database\Factories\Domain\Finance\Models;

use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MutasiKasBankFactory extends Factory
{
    protected $model = MutasiKasBank::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'akun_kas_bank_id' => AkunKasBank::factory(),
            'kategori' => 'operasional',
            'tipe' => $this->faker->randomElement(['masuk', 'keluar']),
            'jumlah' => $this->faker->numberBetween(100000, 10000000),
            'referensi_type' => null,
            'referensi_id' => null,
            'tanggal' => now()->toDateString(),
            'catatan' => null,
            'created_by' => User::factory(),
        ];
    }
}
