<?php

namespace App\Domain\Production\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class HargaJual extends Model
{
    use HasUuids;

    protected $table = 'harga_juals';

    protected $fillable = ['produk_id', 'harga', 'berlaku_dari', 'berlaku_sampai'];

    protected $casts = [
        'harga' => 'float',
        'berlaku_dari' => 'date',
        'berlaku_sampai' => 'date',
    ];

    // Relasi
    public function produk()
    {
        return $this->belongsTo(Produk::class);
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
