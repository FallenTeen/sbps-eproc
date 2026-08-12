<?php
namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\MixDesignTemplate;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\ResepProduksi;

class GenerateResepFromMixDesignAction
{
    public function execute(Produk $produk, string $mutuBeton): void
    {
        $template = MixDesignTemplate::where('mutu_beton', $mutuBeton)->firstOrFail();
        foreach ($template->items as $item) {
            ResepProduksi::create([
                'produk_id' => $produk->id,
                'bahan_baku_id' => $item->bahan_baku_id,
                'jumlah_per_unit_output' => $item->jumlah_per_m3,
            ]);
        }
    }
}
