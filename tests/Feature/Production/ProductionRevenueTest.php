<?php

namespace Tests\Feature\Production;

use App\Domain\Production\Actions\CalculateProductionRevenueAction;
use App\Models\ProductionSession;
use App\Models\Produk;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

uses(DatabaseTransactions::class);

class ProductionRevenueTest extends TestCase
{
    /** @test */
    public function it_calculates_production_revenue_correctly()
    {
        // Create a production session with output
        $produk = Produk::factory()->create([
            'harga' => 200000, // 200,000 per m3
        ]);

        $session = ProductionSession::create([
            'produk_id' => $produk->id,
            'hasil_output' => 5.0, // 5 m3
            'status' => 'selesai',
        ]);

        // Calculate revenue
        $revenueAction = new CalculateProductionRevenueAction;
        $revenue = $revenueAction->execute($session);

        // Expected revenue: output * unit price
        $expectedRevenue = 5.0 * 200000;

        $this->assertEquals($expectedRevenue, $revenue);
    }
}
