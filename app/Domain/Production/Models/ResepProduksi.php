<?php

namespace App\Domain\Production\Models;

use App\Domain\Procurement\Models\BahanBaku;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ResepProduksi extends Model
{
    use HasUuids;

    protected $table = 'resep_produksis';
    protected $fillable = ['produk_id', 'bahan_baku_id', 'jumlah_per_unit_output'];
    protected $casts = ['jumlah_per_unit_output' => 'float'];

    // Relasi
    public function produk()
    {
        return $this->belongsTo(Produk::class);
    }

    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class);
    }
}
