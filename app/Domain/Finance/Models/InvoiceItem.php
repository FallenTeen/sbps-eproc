<?php

namespace App\Domain\Finance\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasUuids;

    protected $table = 'invoice_items';

    protected $fillable = [
        'invoice_id',
        'deskripsi',
        'referensi_type',
        'referensi_id',
        'jumlah',
        'harga_satuan',
        'subtotal',
    ];

    protected $casts = [
        'jumlah' => 'float',
        'harga_satuan' => 'float',
        'subtotal' => 'float',
    ];

    // Relasi
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function referensi()
    {
        return $this->morphTo();
    }
}
