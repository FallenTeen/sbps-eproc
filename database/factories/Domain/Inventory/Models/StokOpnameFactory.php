<?php

namespace Database\Factories\Domain\Inventory\Models;

use App\Domain\Core\Models\Titik;
use App\Domain\Inventory\Models\StokOpname;
use App\Domain\Procurement\Models\BahanBaku;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class StokOpnameFactory extends Factory
{
    protected $model = StokOpname::class;

    public function definition(): array
    {
        $saldoSistem = $this->faker->numberBetween(0, 500);
        $saldoFisik = $this->faker->numberBetween(0, 500);

        return [
            'id' => (string) Str::uuid(),
            'bahan_baku_id' => BahanBaku::factory(),
            'titik_id' => Titik::factory(),
            'tanggal' => now()->toDateString(),
            'saldo_sistem' => $saldoSistem,
            'saldo_fisik' => $saldoFisik,
            'selisih' => $saldoFisik - $saldoSistem,
            'catatan' => null,
            'dicatat_oleh' => User::factory(),
        ];
    }
}