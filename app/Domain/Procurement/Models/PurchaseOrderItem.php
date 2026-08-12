<?php

namespace App\Domain\Procurement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'purchase_order_items';
    protected $fillable = [
        'purchase_order_id',
        'bahan_baku_id',
        'jumlah',
        'harga_satuan_snapshot',
        'subtotal'
    ];
    protected $casts = [
        'jumlah' => 'float',
        'harga_satuan_snapshot' => 'float',
        'subtotal' => 'float',
    ];

    // Relasi
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class);
    }
}
