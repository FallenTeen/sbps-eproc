<?php

namespace App\Domain\Procurement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasUuids;

    protected $table = 'suppliers';
    protected $fillable = ['kode', 'nama', 'kontak', 'telepon', 'alamat', 'aktif'];
    protected $casts = ['aktif' => 'boolean'];

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
