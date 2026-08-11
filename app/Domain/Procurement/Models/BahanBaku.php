<?php
namespace App\Domain\Procurement\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BahanBaku extends Model {
    use HasUuids;
    protected $table = 'bahan_baku';
    protected $fillable = ['kode', 'nama', 'kategori', 'sparepart_untuk', 'satuan', 'aktif'];

    public function hargaBeli() {
        return $this->hasMany(HargaBeli::class);
    }

    public function purchaseOrderItems() {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function stokMutasi() {
        return $this->hasMany(StokMutasi::class);
    }
}
