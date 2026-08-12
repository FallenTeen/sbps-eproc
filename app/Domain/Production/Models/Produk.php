<?php

namespace App\Domain\Production\Models;

use App\Domain\Core\Models\UnitBisnis;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    use HasUuids;

    protected $table = 'produks';
    protected $fillable = [
        'unit_bisnis_id',
        'nama',
        'kategori',
        'satuan_output',
        'aktif'
    ];
    protected $casts = ['aktif' => 'boolean'];

    // Relasi
    public function unitBisnis()
    {
        return $this->belongsTo(UnitBisnis::class);
    }

    public function hargaJual()
    {
        return $this->hasMany(HargaJual::class);
    }

    public function resepProduksis()
    {
        return $this->hasMany(ResepProduksi::class);
    }

    public function productionSessions()
    {
        return $this->hasMany(ProductionSession::class);
    }

    public function mesinProduksis()
    {
        return $this->hasMany(MesinProduksi::class);
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->where('aktif', true);
    }

    public function scopeByUnit($query, $unitBisnisId)
    {
        return $query->where('unit_bisnis_id', $unitBisnisId);
    }

    public function scopeByKategori($query, $kategori)
    {
        return $query->where('kategori', $kategori);
    }
}
