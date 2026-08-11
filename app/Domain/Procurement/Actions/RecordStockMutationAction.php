<?php
namespace App\Domain\Procurement\Actions;

use App\Domain\Procurement\Models\StokMutasi;
use App\Domain\Procurement\Models\PurchaseOrder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RecordStockMutationAction
{
    public function execute(PurchaseOrder $po): void
    {
        DB::transaction(function () use ($po) {
            foreach ($po->items as $item) {
                StokMutasi::create([
                    'bahan_baku_id' => $item->bahan_baku_id,
                    'titik_id' => $po->titik_id,
                    'tipe' => 'masuk',
                    'jumlah' => $item->jumlah,
                    'referensi_type' => PurchaseOrder::class,
                    'referensi_id' => $po->id,
                    'catatan' => "Penerimaan PO {$po->kode_po}",
                    'tanggal' => now(),
                    'created_by' => Auth::id(),
                ]);
            }
        });
    }
}
