<?php

namespace Database\Factories;

use App\Domain\Procurement\Models\PurchaseOrderItem;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\BahanBaku;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PurchaseOrderItemFactory extends Factory
{
    protected $model = PurchaseOrderItem::class;

    public function definition(): array
    {
        $jumlah = $this->faker->numberBetween(1, 100);
        $harga = $this->faker->numberBetween(10000, 500000);
        return [
            'id' => (string) Str::uuid(),
            'purchase_order_id' => PurchaseOrder::factory(),
            'bahan_baku_id' => BahanBaku::factory(),
            'jumlah' => $jumlah,
            'harga_satuan_snapshot' => $harga,
            'subtotal' => $jumlah * $harga,
        ];
    }
}
