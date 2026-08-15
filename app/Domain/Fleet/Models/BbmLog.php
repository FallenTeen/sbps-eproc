<?php

namespace App\Domain\Fleet\Models;

use App\Domain\Procurement\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BbmLog extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'bbm_logs';
    protected $fillable = [
        'serviceable_type',
        'serviceable_id',
        'tanggal',
        'liter',
        'biaya',
        'jam_operasional_saat_isi',
        'purchase_order_id',
        'dicatat_oleh'
    ];
    protected $casts = [
        'tanggal' => 'date',
        'liter' => 'float',
        'biaya' => 'float',
        'jam_operasional_saat_isi' => 'float',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Domain\Fleet\Models\BbmLogFactory::new();
    }

    // Relasi polymorphic
    public function serviceable()
    {
        return $this->morphTo();
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}
