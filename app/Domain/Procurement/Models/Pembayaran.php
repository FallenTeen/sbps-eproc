<?php

namespace App\Domain\Procurement\Models;

use App\Domain\Finance\Models\AkunKasBank;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'pembayarans';
    protected $fillable = [
        'purchase_order_id',
        'jumlah',
        'tanggal',
        'metode',
        'akun_kas_bank_id',
        'dicatat_oleh',
        'catatan'
    ];
    protected $casts = [
        'jumlah' => 'float',
        'tanggal' => 'date',
    ];

    // Relasi
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function akunKasBank()
    {
        return $this->belongsTo(AkunKasBank::class);
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }

    public function mutasiKasBank()
    {
        return $this->morphOne(\App\Domain\Finance\Models\MutasiKasBank::class, 'referensi');
    }
}
