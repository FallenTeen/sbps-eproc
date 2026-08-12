<?php

namespace Tests\Feature\Production;

use Tests\TestCase;

uses(\Illuminate\Foundation\Testing\DatabaseTransactions::class);

class ProductionCostTest extends TestCase
{
    /** @test */
    public function it_calculates_production_cost_correctly()
    {
        // Create a production session with items that consume materials
        $produk = \App\Models\Produk::factory()->create();
        $mesin = \App\Models\MesinProduksi::factory()->create([
            'biaya_per_jam' => 100000, // 100,000 per hour
        ]);

        // Create a production session
        $session = \App\Models\ProductionSession::create([
            'mesin_id' => $mesin->id,
            'produk_id' => $produk->id,
            'mulai' => now(),
            'status' => 'selesai',
            'hasil_output' => 10.0, // 10 m3
        ]);

        // Add items that consume materials
        $bahan1 = \App\Models\BahanBaku::factory()->create([
            'harga' => 50000, // 50,000 per unit
        ]);
        $bahan2 = \App\Models\BahanBaku::factory()->create([
            'harga' => 30000, // 30,000 per unit
        ]);

        $session->items()->createMany([
            ['bahan_baku_id' => $bahan1->id, 'jumlah_terpakai' => 2.0],
            ['bahan_baku_id' => $bahan2->id, 'jumlah_terpakai' => 3.0],
        ]);

        // Calculate cost
        $costAction = new \App\Domain\Production\Actions\CalculateProductionCostAction();
        $cost = $costAction->execute($session);

        // Expected cost: (duration * machine cost) + (material cost)
        $durationHours = 1.0; // 1 hour (assuming 1 hour for simplicity)
        $expectedMachineCost = $durationHours * 100000;
        $expectedMaterialCost = (2.0 * 50000) + (3.0 * 30000);
        $expectedTotal = $expectedMachineCost + $expectedMaterialCost;

        $this->assertEquals($expectedTotal, $cost);
    }
}