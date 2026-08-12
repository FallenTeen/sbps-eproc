<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Procurement\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ServiceHistory extends Model
{
    use HasUuids;

    protected $table = 'service_history';
    protected $fillable = [
        'serviceable_type',
        'serviceable_id',
        'tanggal',
        'jenis_servis',
        'biaya',
        'notes',
        'purchase_order_id'
    ];
    protected $casts = [
        'tanggal' => 'date',
        'biaya' => 'float',
    ];

    // Relasi polymorphic
    public function serviceable()
    {
        return $this->morphTo();
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
