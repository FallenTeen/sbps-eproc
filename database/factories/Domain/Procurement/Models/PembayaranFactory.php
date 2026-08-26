<?php

namespace Database\Factories\Domain\Procurement\Models;

use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Procurement\Models\Pembayaran;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PembayaranFactory extends Factory
{
    protected $model = Pembayaran::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'purchase_order_id' => PurchaseOrder::factory(),
            'jumlah' => $this->faker->numberBetween(100000, 5000000),
            'tanggal' => now()->toDateString(),
            'metode' => 'transfer',
            'akun_kas_bank_id' => AkunKasBank::factory(),
            'dicatat_oleh' => User::factory(),
            'catatan' => null,
        ];
    }
}
