<?php

namespace App\Domain\Procurement\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class HargaBeli extends Model
{
    use HasUuids;
    protected $table = 'harga_beli';
    protected $fillable = ['bahan_baku_id', 'supplier_id', 'harga', 'berlaku_dari', 'berlaku_sampai'];

    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
