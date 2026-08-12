<?php

namespace App\Domain\Procurement\Models;

use App\Domain\Core\Models\Titik;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StokMutasi extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'stok_mutasis';
    protected $fillable = [
        'bahan_baku_id',
        'titik_id',
        'tipe',
        'jumlah',
        'referensi_type',
        'referensi_id',
        'catatan',
        'tanggal',
        'created_by'
    ];
    protected $casts = [
        'jumlah' => 'float',
        'tanggal' => 'date',
    ];

    // Relasi
    public function bahanBaku()
    {
        return $this->belongsTo(BahanBaku::class);
    }

    public function titik()
    {
        return $this->belongsTo(Titik::class);
    }

    public function referensi()
    {
        return $this->morphTo();
    }

    // Scope
    public function scopeMasuk($query)
    {
        return $query->where('tipe', 'masuk');
    }

    public function scopeKeluar($query)
    {
        return $query->where('tipe', 'keluar');
    }

    public function scopeByTitik($query, $titikId)
    {
        return $query->where('titik_id', $titikId);
    }

    public function scopeByBahanBaku($query, $bahanBakuId)
    {
        return $query->where('bahan_baku_id', $bahanBakuId);
    }
}
