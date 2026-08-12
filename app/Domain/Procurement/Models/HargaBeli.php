<?php

namespace App\Domain\Procurement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class HargaBeli extends Model
{
    use HasUuids;

    protected $table = 'harga_belis';
    protected $fillable = ['bahan_baku_id', 'supplier_id', 'harga', 'berlaku_dari', 'berlaku_sampai'];
    protected $casts = [
        'harga' => 'float',
        'berlaku_dari' => 'date',
        'berlaku_sampai' => 'date',
    ];

    // Relasi
    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    // Scope
    public function scopeAktif($query, $tanggal = null)
    {
        $tanggal = $tanggal ?? now();
        return $query->where('berlaku_dari', '<=', $tanggal)
            ->where(function ($q) use ($tanggal) {
                $q->whereNull('berlaku_sampai')
                    ->orWhere('berlaku_sampai', '>=', $tanggal);
            });
    }
}
