<?php

namespace App\Domain\Procurement\Models;

use App\Domain\Production\Models\ResepProduksi;
use App\Domain\Production\Models\ProductionSessionItem;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BahanBaku extends Model
{
    use HasUuids;

    protected $table = 'bahan_bakus';
    protected $fillable = ['kode', 'nama', 'kategori', 'sparepart_untuk', 'satuan', 'aktif'];
    protected $casts = ['aktif' => 'boolean'];

    // Relasi
    public function hargaBeli()
    {
        return $this->hasMany(HargaBeli::class);
    }

    public function purchaseOrderItems()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function stokMutasis()
    {
        return $this->hasMany(StokMutasi::class);
    }

    public function resepProduksis()
    {
        return $this->hasMany(ResepProduksi::class);
    }

    public function productionSessionItems()
    {
        return $this->hasMany(ProductionSessionItem::class);
    }

    public function mixDesignTemplateItems()
    {
        return $this->hasMany(\App\Domain\Production\Models\MixDesignTemplateItem::class);
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->where('aktif', true);
    }

    public function scopeBahanBaku($query)
    {
        return $query->where('kategori', 'bahan_baku');
    }

    public function scopeSparepart($query)
    {
        return $query->where('kategori', 'sparepart');
    }
}
