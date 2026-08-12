<?php

namespace Tests\Feature\Production;

use Tests\TestCase;

uses(\Illuminate\Foundation\Testing\DatabaseTransactions::class);

class ProductionRevenueTest extends TestCase
{
    /** @test */
    public function it_calculates_production_revenue_correctly()
    {
        // Create a production session with output
        $produk = \App\Models\Produk::factory()->create([
            'harga' => 200000, // 200,000 per m3
        ]);

        $session = \App\Models\ProductionSession::create([
            'produk_id' => $produk->id,
            'hasil_output' => 5.0, // 5 m3
            'status' => 'selesai',
        ]);

        // Calculate revenue
        $revenueAction = new \App\Domain\Production\Actions\CalculateProductionRevenueAction();
        $revenue = $revenueAction->execute($session);

        // Expected revenue: output * unit price
        $expectedRevenue = 5.0 * 200000;

        $this->assertEquals($expectedRevenue, $revenue);
    }
}