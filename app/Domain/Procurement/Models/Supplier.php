<?php

namespace App\Domain\Procurement\Models;

use Database\Factories\SupplierFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'suppliers';

    protected $fillable = ['kode', 'nama', 'kontak', 'telepon', 'alamat', 'aktif'];

    protected $casts = ['aktif' => 'boolean'];

    protected static function newFactory()
    {
        return SupplierFactory::new();
    }

    // Relasi
    public function hargaBeli()
    {
        return $this->hasMany(HargaBeli::class);
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    // Scope
    public function scopeAktif($query)
    {
        return $query->where('aktif', true);
    }
}
